const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const BnetStrategy = require('passport-bnet').Strategy;
const jwt = require('jsonwebtoken');

const app = express();

// CORS 설정
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://hotstinder.vercel.app',
    /\.vercel\.app$/
  ],
  credentials: true
}));

app.use(express.json());

// 세션 설정
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev_session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24시간
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

// Passport 초기화
app.use(passport.initialize());
app.use(passport.session());

// Passport 설정
passport.use(new BnetStrategy({
  clientID: process.env.BNET_CLIENT_ID,
  clientSecret: process.env.BNET_CLIENT_SECRET,
  callbackURL: process.env.BNET_CALLBACK_URL || 'https://hotstinder.vercel.app/api/auth/bnet/callback',
  region: process.env.BNET_REGION || 'kr'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // 사용자 정보 처리
    const user = {
      id: profile.id,
      battletag: profile.battletag,
      accessToken: accessToken,
      profile: profile
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

// 기본 라우트
app.get('/', (req, res) => {
  res.json({ 
    message: 'HOTS Tinder API 서버', 
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

app.get('/api', (req, res) => {
  res.json({ 
    message: 'HOTS Tinder API', 
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// 배틀넷 로그인 시작
app.get('/api/auth/bnet', passport.authenticate('bnet'));

// 배틀넷 콜백 처리
app.get('/api/auth/bnet/callback', 
  passport.authenticate('bnet', { 
    failureRedirect: `${process.env.FRONTEND_URL || 'https://hotstinder.vercel.app'}/login?error=auth_failed`
  }),
  (req, res) => {
    try {
      // JWT 토큰 생성
      const token = jwt.sign(
        { 
          id: req.user.id, 
          battletag: req.user.battletag 
        },
        process.env.JWT_SECRET || 'your-jwt-secret',
        { expiresIn: '7d' }
      );
      
      // 성공 시 프론트엔드로 리다이렉트
      res.redirect(`${process.env.FRONTEND_URL || 'https://hotstinder.vercel.app'}/auth/success?token=${token}`);
    } catch (error) {
      console.error('JWT 생성 오류:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'https://hotstinder.vercel.app'}/login?error=token_error`);
    }
  }
);

// 로그아웃
app.post('/api/auth/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: '로그아웃 실패' });
    }
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: '세션 삭제 실패' });
      }
      res.json({ message: '로그아웃 성공' });
    });
  });
});

// 사용자 정보 조회
app.get('/api/user/me', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: '토큰이 필요합니다' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret');
    res.json({ user: decoded });
  } catch (error) {
    res.status(401).json({ error: '유효하지 않은 토큰입니다' });
  }
});

// 헬스체크
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    auth: {
      bnet_configured: !!(process.env.BNET_CLIENT_ID && process.env.BNET_CLIENT_SECRET),
      jwt_configured: !!process.env.JWT_SECRET
    }
  });
});

// 에러 핸들링 미들웨어
app.use((error, req, res, next) => {
  console.error('API 오류:', error);
  res.status(500).json({ 
    error: '서버 내부 오류',
    message: process.env.NODE_ENV === 'development' ? error.message : '서버 오류가 발생했습니다'
  });
});

// 404 처리
app.use((req, res) => {
  res.status(404).json({ 
    message: '요청한 리소스를 찾을 수 없습니다.',
    path: req.path,
    method: req.method
  });
});

module.exports = app; 