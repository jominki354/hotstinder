require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const passport = require('passport');
const path = require('path');
const fs = require('fs');

// PostgreSQL 관련 모듈
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

// 유틸리티
const logger = require('./utils/logger');

// 애플리케이션 시작 로그
logger.info('🚀 HotsTinder Server Starting...', {
  nodeVersion: process.version,
  environment: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000
});

// 전역 설정
global.usePostgreSQL = true;
global.useNeDB = false;
global.dbDir = path.join(__dirname, '../data');

// PostgreSQL 연결
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

      // Passport 설정 (데이터베이스 연결 후)
      require('./config/passport')(passport);
      logger.info('✅ Passport 설정 완료');
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

// Express 앱 초기화
const app = express();

// 보안 미들웨어
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// 압축 미들웨어
app.use(compression());

// 로깅 미들웨어
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // 최대 100 요청
  message: {
    success: false,
    message: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.'
  }
});
app.use('/api/', limiter);

// CORS 설정
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://localhost:5000',
      'https://hotstinder.vercel.app'
    ];

    if (!origin) return callback(null, true);

    const isAllowed = allowedOrigins.some(allowedOrigin => {
      return origin === allowedOrigin;
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
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf, encoding) => {
    try {
      JSON.parse(buf);
    } catch (err) {
      logger.error('💥 JSON 파싱 오류', {
        error: err.message,
        body: buf.toString(),
        url: req.url,
        method: req.method,
        contentType: req.headers['content-type']
      });
      err.status = 400;
      err.body = buf;
      err.type = 'entity.parse.failed';
      throw err;
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Passport 미들웨어 초기화
app.use(passport.initialize());
logger.info('✅ Passport 미들웨어 초기화 완료');

// 업로드 디렉토리 정적 접근 허용
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  logger.info('📁 업로드 디렉토리 생성', { path: uploadsDir });
}
app.use('/uploads', express.static(uploadsDir));

// 헬스체크 엔드포인트
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

// 프로덕션 환경에서 클라이언트 정적 파일 서빙
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../../client/build');

  app.use(express.static(clientBuildPath));
  logger.info('📦 정적 파일 서빙 설정', { path: clientBuildPath });

  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      logger.warn('❌ API 엔드포인트를 찾을 수 없음', { path: req.path }, 'API');
      return res.status(404).json({ message: 'API 엔드포인트를 찾을 수 없습니다.' });
    }

    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    const message = { message: 'HOTS Tinder API 서버 - 개발 모드' };
    res.json(message);
    logger.info('🏠 루트 엔드포인트 접근', message);
  });
}

// JSON 파싱 오류 처리 미들웨어
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    logger.error('💥 서버 오류 발생', {
      error: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      body: err.body ? err.body.toString() : 'No body',
      headers: {
        'content-type': req.headers['content-type'],
        'content-length': req.headers['content-length']
      }
    });

    return res.status(400).json({
      success: false,
      message: 'JSON 데이터 형식이 올바르지 않습니다.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
  next(err);
});

// 일반적인 오류 처리 미들웨어
app.use((err, req, res, next) => {
  logger.error('💥 일반 서버 오류', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  }, 'ERROR');

  res.status(err.status || 500).json({
    success: false,
    message: '서버 오류가 발생했습니다.',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 서버 시작 (개발 환경에서만)
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    logger.info('🎉 서버 시작 완료!', {
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
      database: isPostgreSQLConnected ? 'PostgreSQL' : 'None'
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
}

// Express 앱 내보내기 (Vercel 서버리스 함수용)
module.exports = app;
