require('dotenv').config();
const express = require('express');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const cookieParser = require('cookie-parser');
const path = require('path');

// MongoDB 관련 모듈 추가
let connectMongoDB, addDummyData, MongoUser, MongoMatch, MongoMatchmaking, MongoUserLog;
let authRoutes, userRoutes, matchRoutes, matchmakingRoutes, adminRoutes, replayRoutes;
let configPassport, logger;

try {
  // MongoDB 관련 모듈
  const mongoModule = require(path.join(__dirname, '../server/src/db/mongodb'));
  connectMongoDB = mongoModule.connectMongoDB;
  addDummyData = mongoModule.addDummyData;
  
  MongoUser = require(path.join(__dirname, '../server/src/models/MongoUser'));
  MongoMatch = require(path.join(__dirname, '../server/src/models/MongoMatch'));
  MongoMatchmaking = require(path.join(__dirname, '../server/src/models/MongoMatchmaking'));
  MongoUserLog = require(path.join(__dirname, '../server/src/models/MongoUserLog'));

  // 라우트 파일
  authRoutes = require(path.join(__dirname, '../server/src/routes/auth.routes'));
  userRoutes = require(path.join(__dirname, '../server/src/routes/user.routes'));
  matchRoutes = require(path.join(__dirname, '../server/src/routes/match.routes'));
  matchmakingRoutes = require(path.join(__dirname, '../server/src/routes/matchmaking.routes'));
  adminRoutes = require(path.join(__dirname, '../server/src/routes/admin.routes'));
  replayRoutes = require(path.join(__dirname, '../server/src/routes/replay.routes'));

  // 설정 및 유틸리티
  configPassport = require(path.join(__dirname, '../server/src/config/passport'));
  logger = require(path.join(__dirname, '../server/src/utils/logger'));
} catch (error) {
  console.error('모듈 로딩 실패:', error);
  // 기본 로거 설정
  logger = {
    info: console.log,
    error: console.error,
    warn: console.warn
  };
}

// 전역 설정
global.useMongoDB = true;
global.useNeDB = false;
global.dbDir = path.join(__dirname, '../server/data');

// MongoDB 연결 상태 추적
let isInitialized = false;
let initializationPromise = null;

const initializeDatabase = async () => {
  if (isInitialized) return;
  if (initializationPromise) return initializationPromise;
  
  initializationPromise = (async () => {
    if (process.env.USE_MONGODB === 'true' && connectMongoDB) {
      try {
        await connectMongoDB();
        logger.info('MongoDB 연결 성공');
        global.isMongoDBConnected = true;
        
        global.db = {
          users: MongoUser,
          matches: MongoMatch,
          matchmaking: MongoMatchmaking,
          userLogs: MongoUserLog
        };
        
        if (addDummyData && MongoUser) {
          await addDummyData(MongoUser);
        }
        isInitialized = true;
        logger.info('데이터베이스 초기화 완료');
      } catch (error) {
        logger.error('MongoDB 연결 실패:', error);
        global.isMongoDBConnected = false;
        throw error;
      }
    }
  })();
  
  return initializationPromise;
};

// Express 앱 생성
const app = express();

// CORS 설정
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'https://hotstinder.vercel.app',
      /\.vercel\.app$/
    ];
    
    if (!origin) return callback(null, true);
    
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
  allowedHeaders: ['Content-Type', 'Authorization']
};

// 미들웨어 설정
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// 세션 설정
app.use(session({
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
}));

// Passport 초기화
if (configPassport) {
  app.use(passport.initialize());
  app.use(passport.session());
  configPassport(passport);
}

// 데이터베이스 초기화 미들웨어
app.use(async (req, res, next) => {
  try {
    await initializeDatabase();
    next();
  } catch (error) {
    logger.error('데이터베이스 초기화 실패:', error);
    res.status(500).json({ 
      message: '데이터베이스 연결 실패', 
      error: process.env.NODE_ENV === 'development' ? error.message : '서버 오류'
    });
  }
});

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
    timestamp: new Date().toISOString()
  });
});

// API 라우트 (모듈이 로드된 경우에만)
if (authRoutes) app.use('/api/auth', authRoutes);
if (userRoutes) app.use('/api/users', userRoutes);
if (matchRoutes) app.use('/api/matches', matchRoutes);
if (matchmakingRoutes) app.use('/api/matchmaking', matchmakingRoutes);
if (adminRoutes) app.use('/api/admin', adminRoutes);
if (replayRoutes) app.use('/api/replay', replayRoutes);

// 헬스체크 라우트
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    mongodb: global.isMongoDBConnected || false,
    environment: process.env.NODE_ENV || 'development'
  });
});

// 디버깅용 모듈 상태 확인 라우트
app.get('/api/debug', (req, res) => {
  res.json({
    modules: {
      connectMongoDB: !!connectMongoDB,
      authRoutes: !!authRoutes,
      userRoutes: !!userRoutes,
      matchRoutes: !!matchRoutes,
      matchmakingRoutes: !!matchmakingRoutes,
      adminRoutes: !!adminRoutes,
      replayRoutes: !!replayRoutes,
      configPassport: !!configPassport,
      logger: !!logger
    },
    paths: {
      __dirname: __dirname,
      serverPath: path.join(__dirname, '../server'),
      authRoutePath: path.join(__dirname, '../server/src/routes/auth.routes.js'),
      mongoPath: path.join(__dirname, '../server/src/db/mongodb.js')
    },
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      USE_MONGODB: process.env.USE_MONGODB,
      MONGODB_URI: process.env.MONGODB_URI ? '설정됨' : '설정안됨',
      JWT_SECRET: process.env.JWT_SECRET ? '설정됨' : '설정안됨',
      BNET_CLIENT_ID: process.env.BNET_CLIENT_ID ? '설정됨' : '설정안됨'
    },
    global: {
      isMongoDBConnected: global.isMongoDBConnected,
      useMongoDB: global.useMongoDB,
      useNeDB: global.useNeDB
    },
    timestamp: new Date().toISOString()
  });
});

// 오류 처리 미들웨어
app.use((err, req, res, next) => {
  logger.error('서버 오류:', err);
  res.status(500).json({ 
    message: '서버 오류가 발생했습니다.', 
    error: process.env.NODE_ENV === 'development' ? err.message : '내부 서버 오류'
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

// Vercel 서버리스 함수용 export
module.exports = app; 