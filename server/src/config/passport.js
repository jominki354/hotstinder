const BnetStrategy = require('passport-bnet').Strategy;
const logger = require('../utils/logger');
const jwt = require('jsonwebtoken');

module.exports = (passport, memoryUsers) => {
  // 사용자 세션 직렬화
  passport.serializeUser((user, done) => {
    logger.debug('사용자 직렬화:', { id: user.id, battleTag: user.battleTag });
    done(null, user.id);
  });

  // 사용자 세션 역직렬화
  passport.deserializeUser(async (id, done) => {
    try {
      logger.debug('사용자 역직렬화 시도:', { id });

      let user = null;

      if (global.db && global.db.User) {
        // PostgreSQL에서 사용자 찾기
        user = await global.db.User.findByPk(id);

        if (user) {
          logger.debug('PostgreSQL에서 사용자 찾음:', { id, battleTag: user.battleTag });
          return done(null, user);
        }
      }

      if (user) {
        logger.debug('사용자 역직렬화:', { id, battleTag: user.battleTag });
        return done(null, user);
      } else {
        logger.warn('사용자를 찾을 수 없음:', { id });
        return done(null, null);
      }
    } catch (err) {
      logger.error('사용자 역직렬화 오류:', err);
      done(err, null);
    }
  });

  // 환경에 따른 콜백 URL 동적 설정
  const getCallbackURL = () => {
    if (process.env.NODE_ENV === 'production') {
      // Vercel 배포 환경
      return 'https://hotstinder.vercel.app/api/auth/bnet/callback';
    } else {
      // 로컬 개발 환경
      return process.env.BNET_CALLBACK_URL || 'http://localhost:5000/api/auth/bnet/callback';
    }
  };

  const callbackURL = getCallbackURL();
  logger.info('Battle.net 콜백 URL 설정:', { callbackURL, env: process.env.NODE_ENV });

  // 배틀넷 전략 설정
  passport.use(new BnetStrategy({
    clientID: process.env.BNET_CLIENT_ID,
    clientSecret: process.env.BNET_CLIENT_SECRET,
    callbackURL: callbackURL,
    region: process.env.BNET_REGION || 'kr',
    passReqToCallback: true
  }, async (req, accessToken, refreshToken, profile, done) => {
    try {
      logger.debug('배틀넷 인증 콜백 호출:', {
        bnetId: profile.id,
        battletag: profile.battletag,
        sessionID: req.sessionID
      });

      let user;
      let isNewUser = false;

      if (!global.db || !global.db.User) {
        logger.error('데이터베이스가 초기화되지 않았습니다');
        return done(new Error('데이터베이스가 초기화되지 않았습니다'), null);
      }

      // PostgreSQL에서 사용자 찾기 또는 생성
      user = await global.db.User.findOne({ where: { bnetId: profile.id } });

      if (!user) {
        // 새 사용자 생성
        user = await global.db.User.create({
          bnetId: profile.id,
          battleTag: profile.battletag,
          email: profile.email || '',
          isProfileComplete: false,
          mmr: 1500,
          wins: 0,
          losses: 0,
          preferredRoles: [],
          lastLoginAt: new Date()
        });
        isNewUser = true;
        logger.info('새 사용자 등록 (PostgreSQL):', { battleTag: user.battleTag });
      } else {
        // 마지막 로그인 시간 업데이트
        await user.update({ lastLoginAt: new Date() });
        logger.debug('기존 사용자 로그인 (PostgreSQL):', { battleTag: user.battleTag });
      }

      // isNewUser 플래그 추가
      user.isNewUser = isNewUser;

      return done(null, user);
    } catch (err) {
      logger.error('배틀넷 인증 처리 오류:', err);
      return done(err, null);
    }
  }));
};
