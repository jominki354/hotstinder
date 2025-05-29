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

// JWT 토큰 생성 메서드
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    {
      id: this._id,
      bnetId: this.bnetId,
      battletag: this.battletag,
      isAdmin: this.isAdmin,
      isSuperAdmin: this.isSuperAdmin
    },
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: '7d' }
  );
};

const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = async function handler(req, res) {
  try {
    console.log('Vercel /api/auth/admin-login 요청 처리');

    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'https://hotstinder.vercel.app');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // OPTIONS 요청 처리
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // POST 요청만 허용
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: '아이디와 비밀번호를 입력해주세요',
        message: '아이디와 비밀번호를 입력해주세요'
      });
    }

    console.log('관리자 로그인 시도:', { username });

    // MongoDB 연결
    await connectMongoDB();

    // 하드코딩된 관리자 계정 확인 (임시)
    const adminCredentials = {
      username: 'admin',
      password: '1231',
      battletag: 'Admin#1231',
      bnetId: 'admin_new'
    };

    if (username === adminCredentials.username && password === adminCredentials.password) {
      // 관리자 사용자 찾기 또는 생성
      let adminUser = await User.findOne({ bnetId: adminCredentials.bnetId });

      if (!adminUser) {
        // 관리자 계정 생성
        adminUser = new User({
          bnetId: adminCredentials.bnetId,
          battletag: adminCredentials.battletag,
          email: 'admin@hotstinder.com',
          isProfileComplete: true,
          isAdmin: true,
          isSuperAdmin: true,
          mmr: 3000,
          wins: 0,
          losses: 0,
          preferredRoles: ['All'],
          favoriteHeroes: ['All']
        });
        await adminUser.save();
        console.log('관리자 계정 생성:', { battletag: adminUser.battletag });
      } else {
        // 기존 관리자 계정 업데이트
        adminUser.lastLoginAt = new Date();
        adminUser.isAdmin = true;
        adminUser.isSuperAdmin = true;
        await adminUser.save();
        console.log('기존 관리자 로그인:', { battletag: adminUser.battletag });
      }

      // JWT 토큰 생성
      const token = adminUser.generateAuthToken();

      console.log('관리자 로그인 성공:', {
        battletag: adminUser.battletag,
        isAdmin: adminUser.isAdmin,
        isSuperAdmin: adminUser.isSuperAdmin
      });

      res.status(200).json({
        success: true,
        message: '관리자 로그인 성공',
        token: token,
        user: {
          id: adminUser._id,
          bnetId: adminUser.bnetId,
          battletag: adminUser.battletag,
          email: adminUser.email,
          isAdmin: adminUser.isAdmin,
          isSuperAdmin: adminUser.isSuperAdmin,
          isProfileComplete: adminUser.isProfileComplete
        }
      });
    } else {
      console.log('관리자 로그인 실패: 잘못된 자격 증명');
      res.status(401).json({
        error: '잘못된 아이디 또는 비밀번호입니다',
        message: '잘못된 아이디 또는 비밀번호입니다'
      });
    }

  } catch (error) {
    console.error('/api/auth/admin-login 오류:', error);
    res.status(500).json({
      error: '서버 오류가 발생했습니다',
      message: '서버 오류가 발생했습니다'
    });
  }
};
