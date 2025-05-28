require('dotenv').config();
const passport = require('passport');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const jwt = require('jsonwebtoken');

// Passport 설정 (bnet.js와 동일)
passport.use('bnet', new (require('passport-bnet').Strategy)({
  clientID: process.env.BNET_CLIENT_ID,
  clientSecret: process.env.BNET_CLIENT_SECRET,
  callbackURL: process.env.BNET_CALLBACK_URL || 'https://hotstinder.vercel.app/api/auth/bnet/callback',
  region: process.env.BNET_REGION || 'kr'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const user = {
      bnetId: profile.id,
      battleTag: profile.battletag,
      accessToken: accessToken,
      generateAuthToken: function() {
        return jwt.sign(
          { 
            id: this.bnetId, 
            battleTag: this.battleTag 
          },
          process.env.JWT_SECRET || 'your-jwt-secret',
          { expiresIn: '24h' }
        );
      }
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

  sessionMiddleware(req, res, () => {
    passport.initialize()(req, res, () => {
      passport.session()(req, res, () => {
        // state 검증
        if (req.query.state !== req.session.state) {
          return res.redirect(`${process.env.FRONTEND_URL || 'https://hotstinder.vercel.app'}/login?error=invalid_state`);
        }

        // 인증 처리
        passport.authenticate('bnet', {
          failureRedirect: `${process.env.FRONTEND_URL || 'https://hotstinder.vercel.app'}/login?error=auth_failed`
        })(req, res, () => {
          try {
            // 토큰 생성
            const token = req.user.generateAuthToken();
            
            // 성공 리디렉션
            res.redirect(`${process.env.FRONTEND_URL || 'https://hotstinder.vercel.app'}/auth/success?token=${token}`);
          } catch (error) {
            console.error('토큰 생성 오류:', error);
            res.redirect(`${process.env.FRONTEND_URL || 'https://hotstinder.vercel.app'}/login?error=token_error`);
          }
        });
      });
    });
  });
}; 