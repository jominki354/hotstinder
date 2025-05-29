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
    console.log('Vercel /api/admin/users 요청 처리:', req.method);

    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'https://hotstinder.vercel.app');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // OPTIONS 요청 처리
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // 관리자 권한 확인
    await verifyAdmin(req);

    // MongoDB 연결
    await connectMongoDB();

    if (req.method === 'GET') {
      const { page = 1, limit = 10, sortBy = 'lastLoginAt', sortDirection = 'desc', search = '' } = req.query;
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      let searchQuery = {};
      if (search) {
        searchQuery = {
          $or: [
            { battletag: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { bnetId: { $regex: search, $options: 'i' } }
          ]
        };
      }

      const sortOrder = sortDirection === 'desc' ? -1 : 1;
      const sortOptions = { [sortBy]: sortOrder };

      const [users, totalUsers] = await Promise.all([
        User.find(searchQuery).sort(sortOptions).skip(skip).limit(limitNum).select('-accessToken -refreshToken'),
        User.countDocuments(searchQuery)
      ]);

      const totalPages = Math.ceil(totalUsers / limitNum);
      console.log(`사용자 목록 조회 완료: ${users.length}개, 총 ${totalUsers}개`);

      res.status(200).json({
        users, totalUsers, totalPages, currentPage: pageNum,
        hasNextPage: pageNum < totalPages, hasPrevPage: pageNum > 1
      });

    } else if (req.method === 'POST') {
      const { userIds } = req.body;
      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ error: '삭제할 사용자 ID 목록이 필요합니다' });
      }

      const result = await User.deleteMany({ _id: { $in: userIds }, isAdmin: { $ne: true } });
      console.log(`다중 사용자 삭제 완료: ${result.deletedCount}개`);

      res.status(200).json({
        success: true,
        message: `${result.deletedCount}명의 사용자가 삭제되었습니다`,
        deletedCount: result.deletedCount
      });

    } else if (req.method === 'DELETE') {
      const { userId } = req.query;
      if (!userId) {
        return res.status(400).json({ error: '사용자 ID가 필요합니다' });
      }

      const result = await User.deleteOne({ _id: userId, isAdmin: { $ne: true } });
      console.log(`단일 사용자 삭제 완료: ${result.deletedCount}개`);

      res.status(200).json({
        success: true,
        message: '사용자가 삭제되었습니다',
        deletedCount: result.deletedCount
      });

    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('/api/admin/users 오류:', error);

    if (error.message.includes('권한') || error.message.includes('토큰')) {
      res.status(401).json({ error: error.message });
    } else {
      res.status(500).json({ error: '서버 오류가 발생했습니다' });
    }
  }
};
