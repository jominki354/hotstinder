const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();

// CORS 설정
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://hotstinder.vercel.app',
    /\.vercel\.app$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

// 환경 변수 디버깅 (개발 환경에서만)
app.get('/api/debug/env', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ message: '프로덕션에서는 사용할 수 없습니다.' });
  }

  res.json({
    NODE_ENV: process.env.NODE_ENV,
    BNET_CLIENT_ID: process.env.BNET_CLIENT_ID ? '설정됨' : '설정되지 않음',
    BNET_CLIENT_SECRET: process.env.BNET_CLIENT_SECRET ? '설정됨' : '설정되지 않음',
    BNET_CALLBACK_URL: process.env.BNET_CALLBACK_URL,
    BNET_REGION: process.env.BNET_REGION,
    JWT_SECRET: process.env.JWT_SECRET ? '설정됨' : '설정되지 않음',
    DATABASE_URL: process.env.DATABASE_URL ? '설정됨' : '설정되지 않음',
    FRONTEND_URL: process.env.FRONTEND_URL
  });
});

// JWT 토큰 검증 미들웨어
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: '액세스 토큰이 필요합니다.'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret', (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: '유효하지 않은 토큰입니다.'
      });
    }
    req.user = user;
    next();
  });
};

// 사용자 정보 조회
app.get('/api/user/me', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: req.user
  });
});

// 헬스체크
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    auth: {
      jwt_configured: !!process.env.JWT_SECRET,
      database_configured: !!process.env.DATABASE_URL
    }
  });
});

// 에러 핸들링 미들웨어
app.use((error, req, res, next) => {
  console.error('API 오류:', error);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' ? error.message : '서버 오류가 발생했습니다'
  });
});

// 404 처리
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '요청한 리소스를 찾을 수 없습니다.',
    path: req.path,
    method: req.method
  });
});

module.exports = app;
