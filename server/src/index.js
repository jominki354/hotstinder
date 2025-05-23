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

// MongoDB 관련 모듈 추가
const { connectDB, addDummyData } = require('./db/mongodb');
const MongoUser = require('./models/MongoUser');
const MongoMatch = require('./models/MongoMatch');
const MongoMatchmaking = require('./models/MongoMatchmaking');
const MongoUserLog = require('./models/MongoUserLog');

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
const authController = require('./controllers/auth.controller');

// 전역 설정
global.useMongoDB = true; // MongoDB만 사용하도록 강제 설정
global.useNeDB = false; // NeDB 사용 안함
global.dbDir = path.join(__dirname, '../data');

// MongoDB 연결
(async () => {
  logger.info('MongoDB를 사용하도록 설정되어 있습니다. 연결을 시도합니다...');
  const conn = await connectDB();
  
  if (conn) {
    global.mongoConnected = true;
    logger.info('MongoDB 연결 성공. MongoDB를 기본 데이터베이스로 사용합니다.');
    
    // 모델 설정
    global.db = {
      users: MongoUser,
      matches: MongoMatch,
      matchmaking: MongoMatchmaking,
      userLogs: MongoUserLog
    };
    
    // 더미 데이터 추가
    await addDummyData(MongoUser);
  } else {
    logger.error('MongoDB 연결 실패. 애플리케이션을 실행할 수 없습니다.');
    process.exit(1); // MongoDB 연결 실패 시 애플리케이션 종료
  }
})();

// 앱 초기화
const app = express();
const httpServer = createServer(app);

// CORS 설정
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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

// 기본 라우트
app.get('/', (req, res) => {
  res.json({ message: 'HOTS Tinder API 서버' });
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

// 서버 시작
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  logger.info(`서버가 ${PORT} 포트에서 실행 중입니다`);
  if (global.mongoConnected) {
    logger.info('MongoDB를 사용하여 데이터를 저장하고 있습니다');
  } else {
    logger.error('MongoDB 연결이 활성화되지 않았습니다. 서버가 제대로 작동하지 않을 수 있습니다.');
  }
}); 