require('dotenv').config();
const passport = require('passport');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);

// Passport 설정
passport.use('bnet', new (require('passport-bnet').Strategy)({
  clientID: process.env.BNET_CLIENT_ID,
  clientSecret: process.env.BNET_CLIENT_SECRET,
  callbackURL: process.env.BNET_CALLBACK_URL || 'https://hotstinder.vercel.app/api/auth/bnet/callback',
  region: process.env.BNET_REGION || 'kr'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // 간단한 사용자 객체 반환
    const user = {
      bnetId: profile.id,
      battleTag: profile.battletag,
      accessToken: accessToken
    };
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

module.exports = function handler(req, res) {
  // 세션 설정
  const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET || 'dev_session_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 86400000,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    },
    store: new MemoryStore({
      checkPeriod: 86400000
    })
  });

  // 세션 초기화
  sessionMiddleware(req, res, () => {
    // Passport 초기화
    passport.initialize()(req, res, () => {
      passport.session()(req, res, () => {
        // state 매개변수 생성
        req.session.state = Math.random().toString(36).substring(2, 15) +
                           Math.random().toString(36).substring(2, 15);

        // 배틀넷 인증 시작
        passport.authenticate('bnet', {
          state: req.session.state
        })(req, res);
      });
    });
  });
}; 