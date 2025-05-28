require('dotenv').config();
const express = require('express');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const cookieParser = require('cookie-parser');
const path = require('path');
const morgan = require('morgan');

// MongoDB 관련 모듈 추가
const { connectMongoDB, addDummyData } = require('../server/src/db/mongodb');
const MongoUser = require('../server/src/models/MongoUser');
const MongoMatch = require('../server/src/models/MongoMatch');
const MongoMatchmaking = require('../server/src/models/MongoMatchmaking');
const MongoUserLog = require('../server/src/models/MongoUserLog');

// 라우트 파일 가져오기
const authRoutes = require('../server/src/routes/auth.routes');
const userRoutes = require('../server/src/routes/user.routes');
const matchRoutes = require('../server/src/routes/match.routes');
const matchmakingRoutes = require('../server/src/routes/matchmaking.routes');
const adminRoutes = require('../server/src/routes/admin.routes');
const replayRoutes = require('../server/src/routes/replay.routes');

// 설정 및 유틸리티 가져오기
const configPassport = require('../server/src/config/passport');
const logger = require('../server/src/utils/logger');

// 전역 설정
global.useMongoDB = true;
global.useNeDB = false;
global.dbDir = path.join(__dirname, '../server/data');

// MongoDB 연결 (Vercel에서는 매 요청마다 실행될 수 있음)
let isInitialized = false;

const initializeDatabase = async () => {
  if (isInitialized) return;
  
  if (process.env.USE_MONGODB === 'true') {
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
      
      await addDummyData(MongoUser);
      isInitialized = true;
    } catch (error) {
      logger.error('MongoDB 연결 실패:', error);
      global.isMongoDBConnected = false;
    }
  }
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 개발 환경에서만 morgan 사용
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

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
app.use(passport.initialize());
app.use(passport.session());
configPassport(passport);

// 데이터베이스 초기화 미들웨어
app.use(async (req, res, next) => {
  await initializeDatabase();
  next();
});

// 기본 라우트
app.get('/', (req, res) => {
  res.json({ message: 'HOTS Tinder API 서버', status: 'running' });
});

app.get('/api', (req, res) => {
  res.json({ message: 'HOTS Tinder API', version: '1.0.0' });
});

// API 라우트
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/matchmaking', matchmakingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/replay', replayRoutes);

// 오류 처리 미들웨어
app.use((err, req, res, next) => {
  logger.error('서버 오류:', err);
  res.status(500).json({ message: '서버 오류가 발생했습니다.', error: err.message });
});

// 404 처리
app.use((req, res) => {
  res.status(404).json({ message: '요청한 리소스를 찾을 수 없습니다.' });
});

module.exports = app; 