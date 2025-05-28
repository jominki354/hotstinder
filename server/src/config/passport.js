const BnetStrategy = require('passport-bnet').Strategy;
const User = require('../models/user.model');
const NeDBUser = require('../models/NeDBUser');
const logger = require('../utils/logger');
const jwt = require('jsonwebtoken');

module.exports = (passport, memoryUsers) => {
  // 사용자 세션 직렬화
  passport.serializeUser((user, done) => {
    logger.debug('사용자 직렬화:', { _id: user._id, battletag: user.battletag });
    done(null, user._id);
  });

  // 사용자 세션 역직렬화
  passport.deserializeUser(async (id, done) => {
    try {
      logger.debug('사용자 역직렬화 시도:', { id });
      
      let user = null;
      
      if (global.useNeDB) {
        // NeDB에서 사용자 찾기
        user = await NeDBUser.findById(id);
        
        if (user) {
          // 사용자 인스턴스에 generateAuthToken 메서드 추가
          user.generateAuthToken = function() {
            return NeDBUser.generateAuthToken(this);
          };
          
          logger.debug('NeDB에서 사용자 찾음:', { id, battletag: user.battletag });
          return done(null, user);
        }
      } else {
        // MongoDB에서 사용자 찾기
        user = await User.findById(id);
        
        // 메모리에서도 찾아봅니다 (메모리 저장소 사용 시)
        if (!user && memoryUsers) {
          memoryUsers.forEach((u) => {
            if (u._id === id) {
              user = u;
            }
          });
        }
      }
      
      if (user) {
        // 사용자 인스턴스에 generateAuthToken 메서드 추가
        user.generateAuthToken = function() {
          return NeDBUser.generateAuthToken(this);
        };
        
        logger.debug('사용자 역직렬화:', { id, battletag: user.battletag });
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
      
      // MongoDB만 사용하도록 수정
      // MongoDB에서 사용자 찾기 또는 생성
      user = await User.findOne({ bnetId: profile.id });
      
      if (!user) {
        // 새 사용자 생성
        user = new User({
          bnetId: profile.id,
          battletag: profile.battletag,
          email: profile.email || '',
          accessToken,
          refreshToken,
          isProfileComplete: false,
          mmr: 1500,
          wins: 0,
          losses: 0,
          preferredRoles: [],
          favoriteHeroes: []
        });
        await user.save();
        isNewUser = true;
        logger.info('새 사용자 등록 (MongoDB):', { battletag: user.battletag });
      } else {
        // 액세스 토큰 업데이트
        user.accessToken = accessToken;
        user.refreshToken = refreshToken;
        user.lastLoginAt = new Date();
        await user.save();
        logger.debug('기존 사용자 로그인 (MongoDB):', { battletag: user.battletag });
      }
      
      // 사용자 인스턴스에 JWT 토큰 생성 메서드 추가
      user.generateAuthToken = function() {
        const token = jwt.sign(
          { id: this._id, bnetId: this.bnetId }, 
          process.env.JWT_SECRET || 'your-jwt-secret',
          { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );
        return token;
      };
      
      // isNewUser 플래그 추가
      user.isNewUser = isNewUser;
      
      return done(null, user);
    } catch (err) {
      logger.error('배틀넷 인증 처리 오류:', err);
      return done(err, null);
    }
  }));
}; 