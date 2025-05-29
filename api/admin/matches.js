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

// Match 모델 정의
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
  status: { type: String, default: '완료' },
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
    console.log('Vercel /api/admin/matches 요청 처리:', req.method);

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
      const { page = 1, limit = 10, sortBy = 'createdAt', sortDirection = 'desc', startDate, endDate, map, status, userId } = req.query;
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      let filterQuery = {};
      if (startDate || endDate) {
        filterQuery.createdAt = {};
        if (startDate) filterQuery.createdAt.$gte = new Date(startDate);
        if (endDate) filterQuery.createdAt.$lte = new Date(endDate);
      }
      if (map) filterQuery['result.map'] = { $regex: map, $options: 'i' };
      if (status) filterQuery.status = status;
      if (userId) filterQuery['players.bnetId'] = userId;

      const sortOrder = sortDirection === 'desc' ? -1 : 1;
      const sortOptions = { [sortBy]: sortOrder };

      const [matches, totalMatches] = await Promise.all([
        Match.find(filterQuery).sort(sortOptions).skip(skip).limit(limitNum),
        Match.countDocuments(filterQuery)
      ]);

      const totalPages = Math.ceil(totalMatches / limitNum);
      console.log(`매치 목록 조회 완료: ${matches.length}개, 총 ${totalMatches}개`);

      res.status(200).json({
        matches, totalMatches, totalPages, currentPage: pageNum,
        hasNextPage: pageNum < totalPages, hasPrevPage: pageNum > 1
      });

    } else if (req.method === 'POST') {
      const { matchIds } = req.body;
      if (!matchIds || !Array.isArray(matchIds) || matchIds.length === 0) {
        return res.status(400).json({ error: '무효화할 매치 ID 목록이 필요합니다' });
      }

      const result = await Match.updateMany({ _id: { $in: matchIds } }, { $set: { status: '무효' } });
      console.log(`다중 매치 무효화 완료: ${result.modifiedCount}개`);

      res.status(200).json({
        success: true,
        message: `${result.modifiedCount}개의 매치가 무효화되었습니다`,
        modifiedCount: result.modifiedCount
      });

    } else if (req.method === 'DELETE') {
      const { matchId } = req.query;
      if (!matchId) {
        return res.status(400).json({ error: '매치 ID가 필요합니다' });
      }

      const result = await Match.deleteOne({ _id: matchId });
      console.log(`단일 매치 삭제 완료: ${result.deletedCount}개`);

      res.status(200).json({
        success: true,
        message: '매치가 삭제되었습니다',
        deletedCount: result.deletedCount
      });

    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('/api/admin/matches 오류:', error);

    if (error.message.includes('권한') || error.message.includes('토큰')) {
      res.status(401).json({ error: error.message });
    } else {
      res.status(500).json({ error: '서버 오류가 발생했습니다' });
    }
  }
};
