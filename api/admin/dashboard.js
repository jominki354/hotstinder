require('dotenv').config();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// MongoDB 연결
let isConnected = false;

const connectMongoDB = async () => {
  if (isConnected) return;

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 30000,
      maxPoolSize: 10,
      retryWrites: true,
      w: 'majority'
    });
    isConnected = true;
    console.log('MongoDB 연결 성공');
  } catch (error) {
    console.error('MongoDB 연결 실패:', error);
    throw error;
  }
};

// User 모델 정의
const userSchema = new mongoose.Schema({
  bnetId: { type: String, required: true, unique: true },
  battletag: { type: String, required: true },
  email: String,
  accessToken: String,
  refreshToken: String,
  isProfileComplete: { type: Boolean, default: false },
  mmr: { type: Number, default: 1500 },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  preferredRoles: [String],
  favoriteHeroes: [String],
  isAdmin: { type: Boolean, default: false },
  isSuperAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  lastLoginAt: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

// Match 모델 정의 (기본적인 구조)
const matchSchema = new mongoose.Schema({
  matchId: { type: String, required: true, unique: true },
  players: [{
    bnetId: String,
    battletag: String,
    team: Number,
    hero: String,
    role: String,
    mmr: Number
  }],
  result: {
    winner: Number, // 0 또는 1
    duration: Number, // 초 단위
    map: String
  },
  createdAt: { type: Date, default: Date.now },
  completedAt: Date
});

const Match = mongoose.models.Match || mongoose.model('Match', matchSchema);

// 관리자 권한 확인 미들웨어
const verifyAdmin = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('인증 토큰이 필요합니다');
  }

  const token = authHeader.substring(7);
  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');

  if (!decoded.isAdmin) {
    throw new Error('관리자 권한이 필요합니다');
  }

  return decoded;
};

module.exports = async function handler(req, res) {
  try {
    console.log('Vercel /api/admin/dashboard 요청 처리');

    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'https://hotstinder.vercel.app');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // OPTIONS 요청 처리
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // GET 요청만 허용
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // 관리자 권한 확인
    await verifyAdmin(req);

    // MongoDB 연결
    await connectMongoDB();

    // 통계 데이터 수집
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalMatches,
      activeUsers,
      recentMatches
    ] = await Promise.all([
      User.countDocuments({}),
      Match.countDocuments({}),
      User.countDocuments({ lastLoginAt: { $gte: oneWeekAgo } }),
      Match.countDocuments({ createdAt: { $gte: oneDayAgo } })
    ]);

    console.log('대시보드 통계 수집 완료:', {
      totalUsers,
      totalMatches,
      activeUsers,
      recentMatches
    });

    res.status(200).json({
      totalUsers,
      totalMatches,
      activeUsers,
      recentMatches
    });

  } catch (error) {
    console.error('/api/admin/dashboard 오류:', error);

    if (error.message.includes('권한') || error.message.includes('토큰')) {
      res.status(401).json({ error: error.message });
    } else {
      res.status(500).json({ error: '서버 오류가 발생했습니다' });
    }
  }
};
