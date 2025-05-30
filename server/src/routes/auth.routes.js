const express = require('express');
const passport = require('passport');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

// 미들웨어: 인증 확인
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: '인증 토큰이 필요합니다' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!global.db || !global.db.User) {
      return res.status(500).json({ message: '데이터베이스가 초기화되지 않았습니다' });
    }

    const user = await global.db.User.findByPk(decoded.id);
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다' });
    }

    req.user = user;
    next();
  } catch (err) {
    logger.error('인증 오류:', err);
    return res.status(401).json({ message: '인증에 실패했습니다' });
  }
};

// 임시 state 저장소 (메모리 기반)
const stateStore = new Map();

// state 정리 함수 (5분 후 자동 삭제)
const cleanupState = (state) => {
  setTimeout(() => {
    stateStore.delete(state);
  }, 5 * 60 * 1000); // 5분
};

/**
 * @route   GET /api/auth/bnet
 * @desc    배틀넷 OAuth 로그인 시작
 * @access  Public
 */
router.get('/bnet', (req, res, next) => {
  // state 매개변수 생성 - CSRF 방지 위한 무작위 문자열
  const state = Math.random().toString(36).substring(2, 15) +
                Math.random().toString(36).substring(2, 15);

  // 메모리에 state 저장
  stateStore.set(state, {
    timestamp: Date.now(),
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress
  });

  // 자동 정리 설정
  cleanupState(state);

  // state 매개변수를 포함하여 인증
  passport.authenticate('bnet', {
    state: state
  })(req, res, next);
});

/**
 * @route   GET /api/auth/bnet/callback
 * @desc    배틀넷 OAuth 콜백 처리
 * @access  Public
 */
router.get('/bnet/callback',
  (req, res, next) => {
    // state 매개변수 검증
    const receivedState = req.query.state;
    const storedStateData = stateStore.get(receivedState);

    if (!storedStateData) {
      logger.warn('🔒 OAuth state 매개변수 불일치 또는 만료', {
        received: receivedState,
        hasStored: !!storedStateData
      }, 'AUTH');
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=invalid_state`);
    }

    // state 사용 후 삭제
    stateStore.delete(receivedState);

    // state 검증 성공 시 인증 진행 (세션 없이)
    passport.authenticate('bnet', { session: false }, (err, user, info) => {
      if (err) {
        logger.error('❌ Battle.net 인증 오류', err, 'AUTH');
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
      }

      if (!user) {
        logger.error('❌ Battle.net 콜백에서 사용자 정보 없음', {
          info,
          query: req.query
        }, 'AUTH');
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
      }

      // 사용자 정보를 req.user에 설정
      req.user = user;
      next();
    })(req, res, next);
  },
  async (req, res) => {
    const timer = logger.startTimer('Battle.net OAuth Callback');

    try {
      logger.info('🎮 Battle.net 콜백 처리 시작', {
        sessionId: req.sessionID,
        hasUser: !!req.user,
        query: req.query
      }, 'AUTH');

      if (!req.user) {
        logger.error('❌ Battle.net 콜백에서 사용자 정보 없음', {
          sessionId: req.sessionID,
          query: req.query
        }, 'AUTH');
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
      }

      // 사용자 로그인 로그 기록
      const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      // 마지막 로그인 시간 업데이트
      try {
        if (global.db && global.db.User) {
          await global.db.User.update(
            { lastLoginAt: new Date() },
            { where: { id: req.user.id } }
          );
          logger.debug('✅ 마지막 로그인 시간 업데이트 성공', { userId: req.user.id }, 'AUTH');
        }
      } catch (updateErr) {
        logger.error('❌ 마지막 로그인 시간 업데이트 실패', updateErr, 'AUTH');
      }

      logger.logAuth('login_success', req.user.id, {
        bnetId: req.user.bnetId,
        battleTag: req.user.battleTag,
        loginMethod: 'Battle.net OAuth',
        ipAddress,
        userAgent: userAgent?.substring(0, 100)
      });

      // 로그 데이터 구성
      const logData = {
        userId: req.user.id,
        action: 'login',
        details: {
          bnetId: req.user.bnetId,
          battleTag: req.user.battleTag,
          loginMethod: 'Battle.net OAuth'
        },
        ipAddress,
        userAgent
      };

      // PostgreSQL 로그 저장
      try {
        if (global.db && global.db.UserLog) {
          await global.db.UserLog.create(logData);
          logger.debug('💾 사용자 로그 저장 성공', { userId: req.user.id }, 'AUTH');
        }
      } catch (logErr) {
        logger.error('💾 로그 생성 중 오류', logErr, 'AUTH');
      }

      // 토큰 생성 시도
      if (!req.user.generateAuthToken) {
        logger.error('🔑 generateAuthToken 메서드 없음', {
          userType: typeof req.user,
          userKeys: Object.keys(req.user),
          hasGenerateAuthToken: !!req.user.generateAuthToken
        }, 'AUTH');
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=token_error`);
      }

      const token = req.user.generateAuthToken();
      logger.info('🔑 토큰 생성 성공', {
        userId: req.user.id,
        battleTag: req.user.battleTag,
        tokenLength: token ? token.length : 0
      }, 'AUTH');

      // 클라이언트로 리디렉션
      const redirectUrl = `${process.env.FRONTEND_URL}/auth/success?token=${token}`;
      logger.info('🔄 클라이언트로 리디렉션', {
        userId: req.user.id,
        redirectUrl: redirectUrl.replace(token, 'TOKEN_HIDDEN')
      }, 'AUTH');

      timer.end();
      res.redirect(redirectUrl);

    } catch (error) {
      timer.end();
      logger.error('💥 Battle.net 콜백 처리 중 오류', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        battleTag: req.user?.battleTag
      }, 'AUTH');

      // 에러가 있어도 로그인 처리는 계속 진행
      try {
        if (req.user && req.user.generateAuthToken) {
          const token = req.user.generateAuthToken();
          logger.info('🔄 오류 발생 후 토큰 생성 재시도 성공', {
            userId: req.user.id
          }, 'AUTH');
          res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${token}`);
        } else {
          logger.error('❌ 오류 발생 후 토큰 생성 불가능', {
            hasUser: !!req.user,
            hasTokenMethod: !!(req.user?.generateAuthToken)
          }, 'AUTH');
          res.redirect(`${process.env.FRONTEND_URL}/login?error=token_error`);
        }
      } catch (retryError) {
        logger.error('💥 토큰 생성 재시도 실패', retryError, 'AUTH');
        res.redirect(`${process.env.FRONTEND_URL}/login?error=token_error`);
      }
    }
  }
);

/**
 * @route   POST /api/auth/profile/setup
 * @desc    사용자 프로필 설정
 * @access  Private
 */
router.post('/profile/setup', authenticate, async (req, res) => {
  const timer = logger.startTimer('Profile Setup');

  try {
    logger.info('🔧 프로필 설정 요청 시작', {
      userId: req.user.id,
      battleTag: req.user.battleTag,
      requestBody: req.body,
      headers: {
        'content-type': req.headers['content-type'],
        'authorization': req.headers.authorization ? 'Bearer [HIDDEN]' : 'None'
      }
    }, 'AUTH');

    const { nickname, preferredRoles, previousTier, initialMmr, isProfileComplete } = req.body;

    logger.info('🔧 프로필 설정 데이터 파싱', {
      userId: req.user.id,
      battleTag: req.user.battleTag,
      nickname,
      preferredRoles: preferredRoles?.length,
      previousTier,
      initialMmr,
      isProfileComplete
    }, 'AUTH');

    // 데이터 검증
    if (!preferredRoles || !Array.isArray(preferredRoles) || preferredRoles.length === 0) {
      logger.warn('❌ 프로필 설정 검증 실패 - 선호 역할 누락', {
        userId: req.user.id,
        preferredRoles
      }, 'AUTH');

      timer.end();
      return res.status(400).json({
        success: false,
        message: '선호하는 역할을 하나 이상 선택해주세요.'
      });
    }

    // 데이터베이스 연결 확인
    if (!global.db || !global.db.User) {
      logger.error('❌ 데이터베이스 연결 오류', {
        hasGlobalDb: !!global.db,
        hasUserModel: !!(global.db && global.db.User)
      }, 'AUTH');

      timer.end();
      return res.status(500).json({
        success: false,
        message: '데이터베이스 연결에 문제가 있습니다.'
      });
    }

    // 프로필 업데이트 데이터 구성
    const updateData = {
      nickname: nickname || req.user.battleTag,
      preferredRoles: preferredRoles,
      previousTier: previousTier || 'placement',
      isProfileComplete: true,
      lastLoginAt: new Date()
    };

    // MMR 설정 (초기 설정 시에만)
    if (initialMmr && !req.user.isProfileComplete) {
      updateData.mmr = initialMmr;
      logger.info('🎯 초기 MMR 설정', {
        userId: req.user.id,
        oldMmr: req.user.mmr,
        newMmr: initialMmr
      }, 'AUTH');
    }

    logger.info('💾 사용자 정보 업데이트 시작', {
      userId: req.user.id,
      updateData
    }, 'AUTH');

    // 사용자 정보 업데이트
    await req.user.update(updateData);

    logger.info('✅ 사용자 정보 업데이트 완료', {
      userId: req.user.id
    }, 'AUTH');

    // 로그 기록
    try {
      if (global.db && global.db.UserLog) {
        await global.db.UserLog.create({
          userId: req.user.id,
          action: 'profile_setup',
          details: {
            nickname: updateData.nickname,
            preferredRoles: updateData.preferredRoles,
            previousTier: updateData.previousTier,
            initialMmr: updateData.mmr
          },
          ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
          userAgent: req.headers['user-agent']
        });
        logger.debug('💾 프로필 설정 로그 저장 성공', { userId: req.user.id }, 'AUTH');
      }
    } catch (logErr) {
      logger.error('💾 프로필 설정 로그 생성 중 오류', logErr, 'AUTH');
    }

    // 업데이트된 사용자 정보 조회
    const updatedUser = await global.db.User.findByPk(req.user.id);

    if (!updatedUser) {
      logger.error('❌ 업데이트된 사용자 정보 조회 실패', {
        userId: req.user.id
      }, 'AUTH');

      timer.end();
      return res.status(500).json({
        success: false,
        message: '사용자 정보 업데이트 후 조회에 실패했습니다.'
      });
    }

    // 응답 데이터 구성
    const responseUser = {
      id: updatedUser.id,
      _id: updatedUser.id,
      bnetId: updatedUser.bnetId,
      battleTag: updatedUser.battleTag,
      battletag: updatedUser.battleTag,
      nickname: updatedUser.nickname,
      preferredRoles: updatedUser.preferredRoles,
      previousTier: updatedUser.previousTier,
      mmr: updatedUser.mmr,
      wins: updatedUser.wins,
      losses: updatedUser.losses,
      isProfileComplete: updatedUser.isProfileComplete,
      isAdmin: updatedUser.role === 'admin',
      role: updatedUser.role,
      createdAt: updatedUser.createdAt,
      lastLoginAt: updatedUser.lastLoginAt
    };

    logger.info('✅ 프로필 설정 완료', {
      userId: updatedUser.id,
      battleTag: updatedUser.battleTag,
      isProfileComplete: updatedUser.isProfileComplete,
      duration: timer.end()
    }, 'AUTH');

    res.json({
      success: true,
      message: '프로필이 성공적으로 업데이트되었습니다.',
      user: responseUser
    });

  } catch (err) {
     logger.error('❌ 프로필 설정 중 오류 발생', {
      userId: req.user?.id,
      battleTag: req.user?.battleTag,
      error: err.message,
      stack: err.stack,
      requestBody: req.body
    }, 'AUTH');

    timer.end();
    res.status(500).json({
      success: false,
      message: '프로필 설정 중 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

/**
 * @route   POST /api/auth/admin-login
 * @desc    관리자 로그인
 * @access  Public
 */
router.post('/admin-login', async (req, res) => {
  const timer = logger.startTimer('Admin Login');

  try {
    const { username, password } = req.body;

    logger.info('🔐 관리자 로그인 시도', {
      username,
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress
    }, 'AUTH');

    // 초기 관리자 계정이 없는 경우 생성
    await initializeAdminAccount();

    let adminUser;

    // PostgreSQL에서 관리자 계정 찾기
    if (global.db && global.db.User) {
      logger.debug('🔍 PostgreSQL에서 관리자 계정 조회', { username }, 'AUTH');
      adminUser = await global.db.User.findOne({
        where: {
          role: 'admin',
          battleTag: username // 관리자는 battleTag를 username으로 사용
        }
      });
    }

    // 관리자가 존재하지 않는 경우
    if (!adminUser) {
      logger.warn('❌ 관리자 로그인 실패: 계정 없음', {
        username,
        ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress
      }, 'AUTH');
      timer.end();
      return res.status(401).json({ message: '아이디 또는 비밀번호가 일치하지 않습니다.' });
    }

    // 비밀번호 검증
    const isMatch = await adminUser.comparePassword(password);

    if (!isMatch) {
      logger.warn('❌ 관리자 로그인 실패: 비밀번호 불일치', {
        username,
        userId: adminUser.id,
        ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress
      }, 'AUTH');
      timer.end();
      return res.status(401).json({ message: '아이디 또는 비밀번호가 일치하지 않습니다.' });
    }

    // 마지막 로그인 시간 업데이트
    await adminUser.update({
      lastLoginAt: new Date()
    });

    // 관리자 로그인 로그 기록
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    logger.logAuth('admin_login_success', adminUser.id, {
      username,
      loginMethod: 'admin_credentials',
      ipAddress,
      userAgent: userAgent?.substring(0, 100)
    });

    try {
      if (global.db && global.db.UserLog) {
        await global.db.UserLog.create({
          userId: adminUser.id,
          action: 'admin_login',
          details: {
            username,
            loginMethod: 'admin_credentials'
          },
          ipAddress,
          userAgent
        });
        logger.debug('💾 관리자 로그인 로그 저장 성공', { userId: adminUser.id }, 'AUTH');
      }
    } catch (logErr) {
      logger.error('💾 관리자 로그인 로그 생성 중 오류', logErr, 'AUTH');
    }

    // JWT 토큰 생성
    const token = adminUser.generateAuthToken();

    logger.info('✅ 관리자 로그인 성공', {
      userId: adminUser.id,
      username,
      tokenLength: token.length,
      duration: timer.end()
    }, 'AUTH');

    res.json({
      message: '관리자 로그인 성공',
      token,
      user: {
        id: adminUser.id,
        _id: adminUser.id,
        battleTag: adminUser.battleTag,
        battletag: adminUser.battleTag,
        role: adminUser.role,
        isAdmin: adminUser.role === 'admin',
        isProfileComplete: adminUser.isProfileComplete
      }
    });

  } catch (error) {
    timer.end();
    logger.error('💥 관리자 로그인 중 오류', {
      error: error.message,
      stack: error.stack,
      username: req.body?.username
    }, 'AUTH');
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    현재 로그인한 사용자 정보 조회
 * @access  Private
 */
router.get('/me', async (req, res) => {
  const timer = logger.startTimer('Get Current User');

  try {
    logger.debug('👤 현재 사용자 정보 요청', {
      hasAuthHeader: !!req.headers.authorization,
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress
    }, 'AUTH');

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('❌ Authorization 헤더 없음 또는 형식 오류', {
        authHeader: authHeader ? 'present' : 'missing',
        ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress
      }, 'AUTH');
      timer.end();
      return res.status(401).json({ message: '인증 토큰이 필요합니다.' });
    }

    const token = authHeader.substring(7);
    logger.debug('🔍 토큰 추출 완료', {
      tokenLength: token.length
    }, 'AUTH');

    // JWT 토큰 검증
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    logger.debug('✅ 토큰 디코딩 성공', {
      userId: decoded.id,
      exp: new Date(decoded.exp * 1000)
    }, 'AUTH');

    // 사용자 조회
    let user;
    if (global.db && global.db.User) {
      user = await global.db.User.findByPk(decoded.id);
    }

    if (!user) {
      logger.warn('❌ 토큰은 유효하지만 사용자를 찾을 수 없음', {
        userId: decoded.id,
        ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress
      }, 'AUTH');
      timer.end();
      return res.status(401).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    // 사용자 정보 반환 (비밀번호 제외)
    const userResponse = {
      id: user.id,
      _id: user.id,
      battleTag: user.battleTag,
      battletag: user.battleTag,
      nickname: user.nickname,
      isProfileComplete: user.isProfileComplete,
      mmr: user.mmr,
      role: user.role,
      isAdmin: user.role === 'admin'
    };

    logger.info('✅ 사용자 정보 조회 성공', {
      userId: user.id,
      battleTag: user.battleTag,
      role: user.role,
      duration: timer.end()
    }, 'AUTH');

    res.json({ user: userResponse });

  } catch (error) {
    timer.end();

    if (error.name === 'JsonWebTokenError') {
      logger.warn('❌ JWT 토큰 검증 실패', {
        error: error.message,
        ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress
      }, 'AUTH');
      return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
    } else if (error.name === 'TokenExpiredError') {
      logger.warn('⏰ JWT 토큰 만료', {
        error: error.message,
        ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress
      }, 'AUTH');
      return res.status(401).json({ message: '토큰이 만료되었습니다.' });
    }

    logger.error('💥 /api/auth/me 오류', {
      error: error.message,
      stack: error.stack,
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress
    }, 'AUTH');
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * @route   GET /api/auth/dashboard
 * @desc    사용자 대시보드 데이터 조회
 * @access  Private
 */
router.get('/dashboard', authenticate, async (req, res) => {
  const timer = logger.startTimer('User Dashboard');

  try {
    logger.info('🏠 사용자 대시보드 데이터 요청', {
      userId: req.user.id,
      battleTag: req.user.battleTag
    }, 'AUTH');

    if (!global.db || !global.db.User || !global.db.Match || !global.db.MatchParticipant) {
      logger.error('💥 데이터베이스 모델이 초기화되지 않음', {
        userId: req.user.id,
        availableModels: Object.keys(global.db || {})
      }, 'AUTH');
      return res.status(500).json({
        success: false,
        message: '데이터베이스가 초기화되지 않았습니다.'
      });
    }

    // 사용자 정보 조회
    const user = await global.db.User.findByPk(req.user.id);
    if (!user) {
      logger.warn('⚠️ 사용자를 찾을 수 없음', {
        userId: req.user.id
      }, 'AUTH');
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      });
    }

    // 사용자의 매치 참여 기록 조회 (최근 10경기)
    const recentMatches = await global.db.MatchParticipant.findAll({
      where: { userId: req.user.id },
      include: [{
        model: global.db.Match,
        as: 'match',
        attributes: ['id', 'mapName', 'gameMode', 'gameDuration', 'winner', 'createdAt']
      }],
      order: [['createdAt', 'DESC']],
      limit: 10,
      attributes: [
        'id', 'team', 'hero', 'kills', 'deaths', 'assists',
        'heroDamage', 'siegeDamage', 'healing', 'mmrChange', 'createdAt'
      ]
    });

    // 전체 통계 계산
    const allMatches = await global.db.MatchParticipant.findAll({
      where: { userId: req.user.id },
      include: [{
        model: global.db.Match,
        as: 'match',
        attributes: ['winner']
      }],
      attributes: ['team', 'kills', 'deaths', 'assists', 'mmrChange', 'hero']
    });

    // 통계 계산
    let totalKills = 0;
    let totalDeaths = 0;
    let totalAssists = 0;
    let totalWins = 0;
    let totalGames = allMatches.length;

    allMatches.forEach(match => {
      totalKills += match.kills || 0;
      totalDeaths += match.deaths || 0;
      totalAssists += match.assists || 0;

      // 승리 여부 확인
      const winner = match.match?.winner;
      const userTeam = match.team;

      // winner 값 정규화 (다양한 형태 처리)
      let normalizedWinner = null;
      if (winner === 'blue' || winner === 0 || winner === '0') {
        normalizedWinner = 0;
      } else if (winner === 'red' || winner === 1 || winner === '1') {
        normalizedWinner = 1;
      }

      if (normalizedWinner !== null && userTeam === normalizedWinner) {
        totalWins++;
      }
    });

    const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;

    // 최근 매치 데이터 포맷팅
    const formattedRecentMatches = recentMatches.map(participant => {
      const match = participant.match;
      const winner = match?.winner;
      const userTeam = participant.team;

      // 승리 여부 확인
      let isWin = false;
      if (winner === 'blue' || winner === 0 || winner === '0') {
        isWin = userTeam === 0;
      } else if (winner === 'red' || winner === 1 || winner === '1') {
        isWin = userTeam === 1;
      }

      return {
        id: participant.id,
        matchId: match?.id,
        map: match?.mapName || '알 수 없음',
        gameMode: match?.gameMode || 'unknown',
        result: isWin ? 'win' : 'loss',
        date: new Date(participant.createdAt).toLocaleDateString('ko-KR'),
        mmrChange: participant.mmrChange || 0,
        hero: participant.hero || '알 수 없음',
        kills: participant.kills || 0,
        deaths: participant.deaths || 0,
        assists: participant.assists || 0,
        heroDamage: participant.heroDamage || 0,
        siegeDamage: participant.siegeDamage || 0,
        healing: participant.healing || 0,
        gameDuration: match?.gameDuration || 0
      };
    });

    // MMR 히스토리 (최근 30경기)
    const mmrHistory = await global.db.MatchParticipant.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'ASC']],
      limit: 30,
      attributes: ['mmrChange', 'createdAt']
    });

    // MMR 히스토리 계산 (누적)
    let currentMmr = user.mmr || 1500;
    const formattedMmrHistory = [];

    // 역순으로 계산해서 현재 MMR에서 거꾸로 추적
    const reversedHistory = [...mmrHistory].reverse();
    reversedHistory.forEach((record, index) => {
      if (index === 0) {
        formattedMmrHistory.unshift({
          date: new Date(record.createdAt).toLocaleDateString('ko-KR'),
          mmr: currentMmr
        });
      } else {
        currentMmr -= (record.mmrChange || 0);
        formattedMmrHistory.unshift({
          date: new Date(record.createdAt).toLocaleDateString('ko-KR'),
          mmr: currentMmr
        });
      }
    });

    // 선호 영웅 통계 (가장 많이 플레이한 영웅 3개)
    const heroStats = {};
    allMatches.forEach(match => {
      const heroName = match.hero;
      if (heroName) {
        if (!heroStats[heroName]) {
          heroStats[heroName] = { games: 0, wins: 0 };
        }
        heroStats[heroName].games++;

        // 승리 여부 확인
        const winner = match.match?.winner;
        const userTeam = match.team;

        let isWin = false;
        if (winner === 'blue' || winner === 0 || winner === '0') {
          isWin = userTeam === 0;
        } else if (winner === 'red' || winner === 1 || winner === '1') {
          isWin = userTeam === 1;
        }

        if (isWin) {
          heroStats[heroName].wins++;
        }
      }
    });

    // 영웅 통계를 게임 수 기준으로 정렬하고 상위 3개 선택
    const favoriteHeroes = Object.entries(heroStats)
      .map(([name, stats]) => ({
        name,
        games: stats.games,
        winRate: stats.games > 0 ? Math.round((stats.wins / stats.games) * 100) : 0
      }))
      .sort((a, b) => b.games - a.games)
      .slice(0, 3);

    const dashboardData = {
      user: {
        id: user.id,
        battleTag: user.battleTag,
        mmr: user.mmr || 1500,
        createdAt: user.createdAt
      },
      stats: {
        totalGames,
        winRate,
        kda: {
          kills: totalKills,
          deaths: totalDeaths,
          assists: totalAssists
        },
        recentMatches: formattedRecentMatches,
        mmrHistory: formattedMmrHistory,
        favoriteHeroes
      }
    };

    logger.info('✅ 사용자 대시보드 데이터 조회 성공', {
      userId: req.user.id,
      battleTag: req.user.battleTag,
      totalGames,
      winRate,
      recentMatchesCount: formattedRecentMatches.length,
      favoriteHeroesCount: favoriteHeroes.length
    }, 'AUTH');

    timer.end();

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (err) {
    logger.error('💥 사용자 대시보드 데이터 조회 오류', {
      error: err.message,
      stack: err.stack,
      userId: req.user?.id
    }, 'AUTH');

    timer.end();

    res.status(500).json({
      success: false,
      message: '대시보드 데이터를 불러오는 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 초기 관리자 계정 생성
 */
async function initializeAdminAccount() {
  try {
    if (!global.db || !global.db.User) {
      logger.warn('데이터베이스가 초기화되지 않음');
      return;
    }

    // 기존 관리자 계정 확인
    const existingAdmin = await global.db.User.findOne({
      where: { role: 'admin' }
    });

    if (existingAdmin) {
      logger.debug('관리자 계정이 이미 존재함');
      return;
    }

    // 관리자 계정 생성
    const adminData = {
      battleTag: process.env.ADMIN_USERNAME || 'Admin#0000',
      bnetId: 0,
      nickname: 'Administrator',
      email: process.env.ADMIN_EMAIL || 'admin@hotstinder.com',
      role: 'admin',
      isProfileComplete: true,
      password: process.env.ADMIN_PASSWORD || 'admin123'
    };

    const adminUser = await global.db.User.create(adminData);
    logger.info('초기 관리자 계정 생성 완료:', {
      id: adminUser.id,
      battleTag: adminUser.battleTag
    });

  } catch (error) {
    logger.error('관리자 계정 초기화 중 오류:', error);
  }
}

module.exports = router;
