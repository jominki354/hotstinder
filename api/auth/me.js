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
  createdAt: { type: Date, default: Date.now },
  lastLoginAt: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = async function handler(req, res) {
  try {
    console.log('Vercel /api/auth/me 요청 처리');

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

    // Authorization 헤더 확인
    const authHeader = req.headers.authorization;
    console.log('Authorization 헤더:', authHeader ? 'Bearer ***' : '없음');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('토큰 없음');
      return res.status(401).json({ error: '인증 토큰이 필요합니다' });
    }

    const token = authHeader.substring(7);
    console.log('토큰 길이:', token.length);

    // JWT 토큰 검증
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
      console.log('토큰 검증 성공:', { id: decoded.id, bnetId: decoded.bnetId, battletag: decoded.battletag });
    } catch (jwtError) {
      console.error('토큰 검증 실패:', jwtError.message);
      return res.status(401).json({ error: '유효하지 않은 토큰입니다' });
    }

    // MongoDB 연결
    await connectMongoDB();

    // 사용자 조회
    let user;
    if (decoded.id && decoded.id !== 'undefined') {
      // ObjectId로 조회
      user = await User.findById(decoded.id);
      console.log('ObjectId로 사용자 조회:', user ? '성공' : '실패');
    }

    if (!user && decoded.bnetId) {
      // bnetId로 조회
      user = await User.findOne({ bnetId: decoded.bnetId });
      console.log('bnetId로 사용자 조회:', user ? '성공' : '실패');
    }

    if (!user) {
      console.log('사용자를 찾을 수 없음');
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    // 사용자 정보 반환 (민감한 정보 제외)
    const userInfo = {
      id: user._id,
      bnetId: user.bnetId,
      battletag: user.battletag,
      email: user.email,
      isProfileComplete: user.isProfileComplete,
      mmr: user.mmr,
      wins: user.wins,
      losses: user.losses,
      preferredRoles: user.preferredRoles,
      favoriteHeroes: user.favoriteHeroes,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt
    };

    console.log('사용자 정보 반환:', { battletag: userInfo.battletag });

    res.status(200).json({
      success: true,
      user: userInfo
    });

  } catch (error) {
    console.error('/api/auth/me 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
};
