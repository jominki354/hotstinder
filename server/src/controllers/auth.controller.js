const passport = require('passport');
const UserModel = require('../models/NeDBUser');
const logger = require('../utils/logger');

/**
 * 배틀넷 로그인 시작
 * @param {Express.Request} req - 요청 객체
 * @param {Express.Response} res - 응답 객체
 * @param {Express.NextFunction} next - 다음 미들웨어 함수
 */
exports.startBattleNetAuth = (req, res, next) => {
  logger.debug('배틀넷 로그인 시작', { sessionID: req.sessionID });

  // 세션에 state 저장
  const state = Math.random().toString(36).substring(2, 18);
  req.session.state = state;
  logger.debug('생성된 state', state);
  logger.debug('세션에 state 저장됨', { state, sessionID: req.sessionID });

  passport.authenticate('bnet', {
    scope: ['profile'],
    state: state
  })(req, res, next);
};

/**
 * 배틀넷 콜백 처리
 * @param {Express.Request} req - 요청 객체
 * @param {Express.Response} res - 응답 객체
 * @param {Express.NextFunction} next - 다음 미들웨어 함수
 */
exports.handleBattleNetCallback = (req, res, next) => {
  const { state } = req.query;
  const sessionState = req.session.state;

  logger.debug('배틀넷 콜백 요청 도착', {
    state,
    code: req.query.code ? '존재함' : '없음',
    sessionID: req.sessionID
  });

  logger.debug('콜백의 세션 정보', {
    sessionID: req.sessionID,
    sessionState
  });

  // state 검증
  if (!state || !sessionState || state !== sessionState) {
    logger.warn('State 검증 실패', { state, sessionState });
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=state_mismatch`);
  }

  logger.debug('State 검증 성공, 인증 진행');

  // 인증 수행
  passport.authenticate('bnet', (err, user, info) => {
    if (err) {
      logger.error('인증 오류', err);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=auth_error`);
    }

    if (!user) {
      logger.warn('사용자 없음', info);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=no_user`);
    }

    req.logIn(user, (err) => {
      if (err) {
        logger.error('로그인 오류', err);
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=login_error`);
      }

      // 인증 성공 처리
      logger.info('인증 성공', {
        user: user.battletag,
        isNewUser: user.isNewUser,
        isProfileComplete: user.isProfileComplete
      });

      // 토큰 생성
      let token;
      try {
        token = user.generateAuthToken ? user.generateAuthToken() : '';
        logger.debug('생성된 인증 토큰', { tokenLength: token.length });
      } catch (tokenErr) {
        logger.error('토큰 생성 오류', tokenErr);
        token = '';
      }

      // 프로필 설정이 필요한 경우
      if (!user.isProfileComplete) {
        const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/success?token=${token}&redirect=/profile/setup`;
        logger.debug('프로필 작성 필요, 콜백 페이지로 리디렉션', { redirectUrl });
        return res.redirect(redirectUrl);
      }

      // 정상 로그인 처리
      const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/success?token=${token}&redirect=/dashboard`;
      logger.debug('정상 로그인, 콜백 페이지로 리디렉션', { redirectUrl });
      return res.redirect(redirectUrl);
    });
  })(req, res, next);
};

/**
 * 로그아웃 처리
 * @param {Express.Request} req - 요청 객체
 * @param {Express.Response} res - 응답 객체
 * @param {Express.NextFunction} next - 다음 미들웨어 함수
 */
exports.logout = (req, res, next) => {
  const battletag = req.user?.battletag;
  logger.info('로그아웃 요청', { user: battletag });

  req.logout((err) => {
    if (err) {
      logger.error('로그아웃 오류', err);
      return next(err);
    }

    logger.info('로그아웃 성공', { user: battletag });
    res.redirect(process.env.FRONTEND_URL || 'http://localhost:3000');
  });
};

/**
 * @route   GET /api/user
 * @desc    현재 로그인한 사용자 정보 조회
 * @access  Public
 */
exports.getCurrentUser = (req, res) => {
  try {
    // 세션 인증 확인
    if (req.isAuthenticated() && req.user) {
      // 필드 이름 일치를 위한 정규화
      const normalizeUserFields = (user) => {
        const original = {
          battleTag: user.battleTag,
          battletag: user.battletag
        };

        // battleTag or battletag 중 하나만 정의되어 있으면 일관성을 위해 둘 다 설정
        const normalizedTag = original.battleTag || original.battletag;
        logger.debug('사용자 정보 반환 전처리:', { originalFields: original, normalizedTag });

        return {
          id: user._id || user.id,
          battletag: normalizedTag,
          battleTag: normalizedTag,
          bnetId: user.bnetId,
          nickname: user.nickname || (normalizedTag ? normalizedTag.split('#')[0] : null),
          isProfileComplete: user.isProfileComplete || false,
          isNewUser: false
        };
      };

      return res.json(normalizeUserFields(req.user));
    }

    // 인증되지 않은 요청 - 게스트 상태 반환
    return res.json({
      isAuthenticated: false,
      isGuest: true,
      battletag: '전부못함#3518', // 테스트용 태그
      nickname: '게스트',
      message: '인증되지 않은 사용자입니다.'
    });
  } catch (err) {
    logger.error('현재 사용자 조회 오류:', err);
    return res.status(500).json({ error: '사용자 정보를 조회하는 중 오류가 발생했습니다' });
  }
};

/**
 * 사용자 프로필 설정
 * @param {Express.Request} req - 요청 객체
 * @param {Express.Response} res - 응답 객체
 */
exports.setupProfile = async (req, res) => {
  if (!req.isAuthenticated()) {
    logger.warn('인증되지 않은 프로필 설정 시도');
    return res.status(401).json({ message: '인증이 필요합니다' });
  }

  try {
    const { nickname, preferredRoles, favoriteHeroes } = req.body;
    logger.info('프로필 설정 요청', {
      userId: req.user._id,
      battletag: req.user.battletag,
      nickname,
      preferredRoles: preferredRoles?.length,
      favoriteHeroes: favoriteHeroes?.length
    });

    const memoryUsers = req.app.get('memoryUsers');
    let updatedUser;

    if (global.useNeDB) {
      // NeDB 사용자 모델 업데이트
      logger.debug('NeDB 사용자 프로필 업데이트 시작');
      const user = await UserModel.findById(req.user._id);

      if (!user) {
        logger.error('사용자를 찾을 수 없음', { _id: req.user._id });
        throw new Error('사용자를 찾을 수 없습니다');
      }

      // NeDB 사용자 업데이트
      updatedUser = await UserModel.update(user._id, {
        nickname: nickname || user.nickname,
        preferredRoles: preferredRoles || user.preferredRoles,
        favoriteHeroes: favoriteHeroes || user.favoriteHeroes,
        isProfileComplete: true
      });

      logger.info('NeDB 사용자 프로필 업데이트 완료', { _id: user._id });
    } else if (memoryUsers) {
      // 메모리에서 사용자 찾기 및 업데이트
      logger.debug('메모리 저장소 사용자 프로필 업데이트 시작');
      const user = memoryUsers.get(req.user.bnetId);

      if (!user) {
        logger.error('메모리에서 사용자를 찾을 수 없음', { bnetId: req.user.bnetId });
        throw new Error('사용자를 찾을 수 없습니다');
      }

      user.nickname = nickname || user.nickname;
      user.preferredRoles = preferredRoles || user.preferredRoles;
      user.favoriteHeroes = favoriteHeroes || user.favoriteHeroes;
      user.isProfileComplete = true;

      // 변경된 사용자 정보 저장
      memoryUsers.set(req.user.bnetId, user);
      updatedUser = user;
      logger.info('메모리 사용자 프로필 업데이트 완료', { bnetId: req.user.bnetId });
    } else {
      logger.error('사용자 저장소를 찾을 수 없음');
      throw new Error('사용자 저장소에 접근할 수 없습니다');
    }

    // 업데이트된 사용자 정보를 세션에 반영
    req.user.preferredRoles = updatedUser.preferredRoles;
    req.user.favoriteHeroes = updatedUser.favoriteHeroes;
    req.user.nickname = updatedUser.nickname;
    req.user.isProfileComplete = true;

    // 응답 객체 생성
    const responseUser = {
      _id: req.user._id,
      battletag: req.user.battletag,
      nickname: updatedUser.nickname,
      preferredRoles: updatedUser.preferredRoles || [],
      favoriteHeroes: updatedUser.favoriteHeroes || [],
      isProfileComplete: true
    };

    return res.json({
      success: true,
      message: '프로필이 성공적으로 업데이트되었습니다.',
      user: responseUser
    });
  } catch (error) {
    logger.error('프로필 업데이트 오류', error);
    return res.status(500).json({
      success: false,
      message: '프로필 업데이트 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

/**
 * 사용자 계정 삭제
 * @param {Express.Request} req - 요청 객체
 * @param {Express.Response} res - 응답 객체
 */
exports.deleteUser = async (req, res) => {
  if (!req.isAuthenticated()) {
    logger.warn('인증되지 않은 계정 삭제 시도');
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다'
    });
  }

  try {
    const { battletag } = req.body;

    // 배틀태그 값 확인
    if (!battletag) {
      logger.warn('계정 삭제 요청에 배틀태그 누락');
      return res.status(400).json({
        success: false,
        message: '배틀태그를 입력해주세요.'
      });
    }

    // 배틀태그 확인
    if (battletag !== req.user.battletag) {
      logger.warn('계정 삭제 요청 배틀태그 불일치', {
        provided: battletag,
        actual: req.user.battletag
      });

      return res.status(400).json({
        success: false,
        message: '배틀태그가 일치하지 않습니다. 정확한 배틀태그를 입력해주세요.'
      });
    }

    logger.info('사용자 계정 삭제 요청', {
      battletag: req.user.battletag,
      bnetId: req.user.bnetId
    });

    const memoryUsers = req.app.get('memoryUsers');

    // 데이터베이스에서 사용자 삭제
    if (global.useNeDB) {
      // NeDB 사용자 모델에서 삭제
      await UserModel.delete(req.user._id);
      logger.info('NeDB에서 사용자 삭제 완료', { _id: req.user._id });
    } else if (memoryUsers) {
      // 메모리에서 사용자 삭제
      const deleteResult = memoryUsers.delete(req.user.bnetId);
      logger.info('메모리에서 사용자 삭제', {
        success: deleteResult,
        bnetId: req.user.bnetId
      });
    }

    // 세션 종료 (로그아웃)
    req.logout((err) => {
      if (err) {
        logger.error('계정 삭제 후 로그아웃 오류', err);
        return res.status(500).json({
          success: false,
          message: '계정 탈퇴 중 오류가 발생했습니다. 다시 시도해주세요.'
        });
      }

      logger.info('사용자 계정 삭제 및 로그아웃 완료', { battletag });

      // 응답 전송
      res.set('Content-Type', 'application/json');
      return res.status(200).json({
        success: true,
        message: '계정이 성공적으로 삭제되었습니다.'
      });
    });
  } catch (error) {
    logger.error('계정 삭제 처리 오류', error);
    return res.status(500).json({
      success: false,
      message: '계정 탈퇴 중 오류가 발생했습니다',
      error: error.message
    });
  }
};