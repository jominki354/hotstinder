const express = require('express');
const passport = require('passport');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

/**
 * @route   GET /api/auth/bnet
 * @desc    배틀넷 OAuth 로그인 시작
 * @access  Public
 */
router.get('/bnet', (req, res, next) => {
  // state 매개변수 생성 - CSRF 방지 위한 무작위 문자열
  req.session.state = Math.random().toString(36).substring(2, 15) +
                       Math.random().toString(36).substring(2, 15);

  // state 매개변수를 포함하여 인증
  passport.authenticate('bnet', {
    state: req.session.state
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
    if (req.query.state !== req.session.state) {
      logger.warn('🔒 OAuth state 매개변수 불일치', {
        expected: req.session.state,
        received: req.query.state,
        sessionId: req.sessionID
      }, 'AUTH');
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=invalid_state`);
    }

    // state 검증 성공 시 인증 진행
    passport.authenticate('bnet', {
      failureRedirect: `${process.env.FRONTEND_URL}/login?error=auth_failed`
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
