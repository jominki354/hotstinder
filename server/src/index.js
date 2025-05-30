require('dotenv').config();
const express = require('express');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const cookieParser = require('cookie-parser');
const { createServer } = require('http');
const fs = require('fs');
const path = require('path');
const uuid = require('uuid').v4;

// PostgreSQL 관련 모듈 추가
const { connectPostgreSQL, getSequelize } = require('./db/postgresql');
const { initializeModels } = require('./models');

// 라우트 파일 가져오기
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const matchRoutes = require('./routes/match.routes');
const matchmakingRoutes = require('./routes/matchmaking.routes');
const adminRoutes = require('./routes/admin.routes');
const replayRoutes = require('./routes/replay.routes');
const leaderboardRoutes = require('./routes/leaderboard.routes');
const debugRoutes = require('./routes/debug.routes');

// 설정 및 유틸리티 가져오기
const configPassport = require('./config/passport');
const { setupSocketIO } = require('./socket');
const logger = require('./utils/logger');

// 애플리케이션 시작 로그
logger.info('🚀 HotsTinder Server Starting...', {
  nodeVersion: process.version,
  environment: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000
});

// 전역 설정
global.usePostgreSQL = true; // PostgreSQL 사용
global.useNeDB = false; // NeDB 사용 안함
global.dbDir = path.join(__dirname, '../data');

// PostgreSQL 연결 시도
let isPostgreSQLConnected = false;

if (process.env.USE_POSTGRESQL === 'true') {
  connectPostgreSQL()
    .then((sequelize) => {
      logger.info('✅ PostgreSQL 연결 성공', {
        database: 'PostgreSQL',
        status: 'connected'
      }, 'DB');
      isPostgreSQLConnected = true;
      global.isPostgreSQLConnected = true;

      // 모델 초기화
      const models = initializeModels();

      // 전역 모델 설정
      global.db = {
        ...models,
        sequelize
      };

      logger.info('✅ Sequelize 모델 초기화 완료', {
        models: Object.keys(models)
      }, 'DB');
    })
    .catch((error) => {
      logger.error('❌ PostgreSQL 연결 실패', error, 'DB');
      isPostgreSQLConnected = false;
      global.isPostgreSQLConnected = false;
    });
} else {
  logger.warn('⚠️ PostgreSQL이 비활성화되어 있습니다', null, 'DB');
  isPostgreSQLConnected = false;
  global.isPostgreSQLConnected = false;
}

// 앱 초기화
const app = express();
const httpServer = createServer(app);

// HTTP 요청 로깅 미들웨어
app.use((req, res, next) => {
  const startTime = Date.now();

  // 응답 완료 시 로그 기록
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    logger.logRequest(req, res, responseTime);
  });

  next();
});

// CORS 설정
const corsOptions = {
  origin: function (origin, callback) {
    // 허용할 도메인 목록
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:5000',
      'http://localhost:5000',
      'http://localhost:3000'
    ];

    // origin이 없는 경우 (모바일 앱, Postman 등) 허용
    if (!origin) return callback(null, true);

    // 허용된 도메인인지 확인
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return origin === allowedOrigin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      logger.warn('🚫 CORS 차단된 도메인', { origin }, 'CORS');
      callback(new Error('CORS 정책에 의해 차단되었습니다.'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Cache-Control',
    'Pragma',
    'Expires',
    'X-Requested-With'
  ]
};

// 미들웨어 설정
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 업로드 디렉토리 정적 접근 허용
const uploadsDir = path.join(__dirname, '../uploads');
// 디렉토리가 없으면 생성
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  logger.info('📁 업로드 디렉토리 생성', { path: uploadsDir });
}
app.use('/uploads', express.static(uploadsDir));

// 세션 설정
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev_session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 86400000 // 24시간
  },
  store: new MemoryStore({
    checkPeriod: 86400000 // 24시간마다 만료된 세션 정리
  })
}));

logger.info('🔐 세션 설정 완료', {
  secure: process.env.NODE_ENV === 'production',
  maxAge: '24시간'
});

// Passport 초기화
app.use(passport.initialize());
app.use(passport.session());
configPassport(passport);

logger.info('🛡️ Passport 인증 설정 완료');

// 소켓 설정
const io = setupSocketIO(httpServer);

logger.info('🔌 Socket.IO 설정 완료');

// 헬스체크 엔드포인트 (도커 헬스체크용)
app.get('/api/health', (req, res) => {
  const healthCheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    database: isPostgreSQLConnected ? 'PostgreSQL connected' : 'Database disconnected'
  };

  try {
    res.status(200).json(healthCheck);
    logger.debug('💚 헬스체크 요청 처리', healthCheck, 'HEALTH');
  } catch (error) {
    healthCheck.message = error;
    res.status(503).json(healthCheck);
    logger.error('💔 헬스체크 실패', error, 'HEALTH');
  }
});

// API 라우트
logger.info('🛣️ API 라우트 설정 중...');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/matchmaking', matchmakingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/replay', replayRoutes);
app.use('/api/debug', debugRoutes);

logger.info('✅ API 라우트 설정 완료', {
  routes: [
    '/api/auth',
    '/api/users',
    '/api/matches',
    '/api/leaderboard',
    '/api/matchmaking',
    '/api/admin',
    '/api/replay',
    '/api/debug'
  ]
});

// 프로덕션 환경 또는 Docker 환경에서 클라이언트 정적 파일 서빙
if (process.env.NODE_ENV === 'production' || process.env.USE_POSTGRESQL === 'true') {
  // 클라이언트 빌드 파일 경로
  const clientBuildPath = path.join(__dirname, '../../client/build');

  // 정적 파일 서빙
  app.use(express.static(clientBuildPath));

  logger.info('📦 정적 파일 서빙 설정', { path: clientBuildPath });

  // 모든 GET 요청을 React 앱으로 리다이렉트 (SPA 라우팅 지원)
  app.get('*', (req, res) => {
    // API 요청은 제외
    if (req.path.startsWith('/api/')) {
      logger.warn('❌ API 엔드포인트를 찾을 수 없음', { path: req.path }, 'API');
      return res.status(404).json({ message: 'API 엔드포인트를 찾을 수 없습니다.' });
    }

    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
} else {
  // 개발 환경에서는 기본 API 메시지 표시
  app.get('/', (req, res) => {
    const message = { message: 'HOTS Tinder API 서버 - 개발 모드' };
    res.json(message);
    logger.info('🏠 루트 엔드포인트 접근', message);
  });
}

// 오류 처리 미들웨어
app.use((err, req, res, next) => {
  logger.error('💥 서버 오류 발생', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  }, 'ERROR');

  res.status(500).json({
    message: '서버 오류가 발생했습니다.',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 서버 시작
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  logger.info('🎉 서버 시작 완료!', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    database: isPostgreSQLConnected ? 'PostgreSQL' : 'None',
    uptime: process.uptime()
  }, 'SERVER');

  if (isPostgreSQLConnected) {
    logger.info('💾 데이터베이스 상태', {
      type: 'PostgreSQL',
      status: 'connected'
    }, 'DB');
  } else {
    logger.error('💾 데이터베이스 연결 없음', {
      warning: '서버가 제대로 작동하지 않을 수 있습니다'
    }, 'DB');
  }
});
