const express = require('express');
const cors = require('cors');

// Express 앱 생성
const app = express();

// CORS 설정 - 모든 도메인 허용 (배포 테스트용)
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// JSON 파싱
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 기본 라우트
app.get('/', (req, res) => {
  res.json({ 
    message: 'HOTS Tinder API 서버', 
    status: 'running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api', (req, res) => {
  res.json({ 
    message: 'HOTS Tinder API', 
    version: '1.0.0',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// 헬스 체크 엔드포인트
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    }
  });
});

// 환경 변수 확인 엔드포인트
app.get('/api/env-check', (req, res) => {
  const envStatus = {
    NODE_ENV: !!process.env.NODE_ENV,
    USE_MONGODB: !!process.env.USE_MONGODB,
    MONGODB_URI: !!process.env.MONGODB_URI,
    JWT_SECRET: !!process.env.JWT_SECRET,
    SESSION_SECRET: !!process.env.SESSION_SECRET,
    FRONTEND_URL: !!process.env.FRONTEND_URL,
    REACT_APP_API_URL: !!process.env.REACT_APP_API_URL
  };
  
  res.json({
    message: '환경 변수 상태',
    status: envStatus,
    timestamp: new Date().toISOString()
  });
});

// Mock 사용자 API
app.get('/api/users/leaderboard', (req, res) => {
  const mockUsers = [
    { id: 1, battletag: 'TestUser#1234', mmr: 2500, wins: 15, losses: 5 },
    { id: 2, battletag: 'Player#5678', mmr: 2300, wins: 12, losses: 8 },
    { id: 3, battletag: 'Hero#9999', mmr: 2100, wins: 10, losses: 10 }
  ];
  
  res.json(mockUsers);
});

// Mock 인증 API
app.get('/api/auth/me', (req, res) => {
  res.json({
    user: {
      id: 1,
      battletag: 'TestUser#1234',
      isAuthenticated: false,
      message: '실제 인증 시스템은 환경 변수 설정 후 활성화됩니다.'
    }
  });
});

// 404 처리
app.use((req, res) => {
  res.status(404).json({ 
    message: '요청한 리소스를 찾을 수 없습니다.',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// 오류 처리
app.use((err, req, res, next) => {
  console.error('서버 오류:', err);
  res.status(500).json({ 
    message: '서버 오류가 발생했습니다.',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
    timestamp: new Date().toISOString()
  });
});

module.exports = app; 