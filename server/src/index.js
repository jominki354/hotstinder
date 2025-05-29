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
const morgan = require('morgan');

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

// 설정 및 유틸리티 가져오기
const configPassport = require('./config/passport');
const { setupSocketIO } = require('./socket');
const logger = require('./utils/logger');

// 전역 설정
global.usePostgreSQL = true; // PostgreSQL 사용
global.useNeDB = false; // NeDB 사용 안함
global.dbDir = path.join(__dirname, '../data');

// PostgreSQL 연결 시도
let isPostgreSQLConnected = false;

if (process.env.USE_POSTGRESQL === 'true') {
  connectPostgreSQL()
    .then((sequelize) => {
      logger.info('PostgreSQL 연결 성공. PostgreSQL을 기본 데이터베이스로 사용합니다.');
      isPostgreSQLConnected = true;
      global.isPostgreSQLConnected = true;

      // 모델 초기화
      const models = initializeModels();

      // 전역 모델 설정
      global.db = {
        ...models,
        sequelize
      };

      logger.info('Sequelize 모델이 초기화되었습니다.');
    })
    .catch((error) => {
      logger.error('PostgreSQL 연결 실패:', error);
      isPostgreSQLConnected = false;
      global.isPostgreSQLConnected = false;
    });
} else {
  logger.info('PostgreSQL이 비활성화되어 있습니다.');
  isPostgreSQLConnected = false;
  global.isPostgreSQLConnected = false;
}

// 앱 초기화
const app = express();
const httpServer = createServer(app);

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
      console.log('CORS 차단된 도메인:', origin);
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
app.use(morgan('dev'));

// 업로드 디렉토리 정적 접근 허용
const uploadsDir = path.join(__dirname, '../uploads');
// 디렉토리가 없으면 생성
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
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

// Passport 초기화
app.use(passport.initialize());
app.use(passport.session());
configPassport(passport);

// 소켓 설정
const io = setupSocketIO(httpServer);

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
  } catch (error) {
    healthCheck.message = error;
    res.status(503).json(healthCheck);
  }
});

// API 라우트
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/matchmaking', matchmakingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/replay', replayRoutes);

// 프로덕션 환경 또는 Docker 환경에서 클라이언트 정적 파일 서빙
if (process.env.NODE_ENV === 'production' || process.env.USE_POSTGRESQL === 'true') {
  // 클라이언트 빌드 파일 경로
  const clientBuildPath = path.join(__dirname, '../../client/build');

  // 정적 파일 서빙
  app.use(express.static(clientBuildPath));

  // 모든 GET 요청을 React 앱으로 리다이렉트 (SPA 라우팅 지원)
  app.get('*', (req, res) => {
    // API 요청은 제외
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ message: 'API 엔드포인트를 찾을 수 없습니다.' });
    }

    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
} else {
  // 개발 환경에서는 기본 API 메시지 표시
  app.get('/', (req, res) => {
    res.json({ message: 'HOTS Tinder API 서버 - 개발 모드' });
  });
}

// 오류 처리 미들웨어
app.use((err, req, res, next) => {
  logger.error('서버 오류:', err);
  res.status(500).json({ message: '서버 오류가 발생했습니다.', error: err.message });
});

// 서버 시작
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  logger.info(`서버가 ${PORT} 포트에서 실행 중입니다`);
  if (isPostgreSQLConnected) {
    logger.info('PostgreSQL을 사용하여 데이터를 저장하고 있습니다');
  } else {
    logger.error('PostgreSQL 연결이 활성화되지 않았습니다. 서버가 제대로 작동하지 않을 수 있습니다.');
  }
});
