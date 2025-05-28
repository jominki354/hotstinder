const express = require('express');
const cors = require('cors');

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

// 배틀넷 로그인 라우트 (임시)
app.get('/api/auth/bnet', (req, res) => {
  res.json({
    message: '배틀넷 로그인 라우트',
    redirect: 'https://oauth.battle.net/authorize',
    status: 'working'
  });
});

// 헬스체크
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
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