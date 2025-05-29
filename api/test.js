const mongoose = require('mongoose');

// MongoDB 연결 함수
const connectMongoDB = async () => {
  if (mongoose.connections[0].readyState) {
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 60000,
      connectTimeoutMS: 30000,
      maxPoolSize: 5,
      minPoolSize: 1,
      maxIdleTimeMS: 60000,
      bufferCommands: false,
      bufferMaxEntries: 0,
      retryWrites: true,
      retryReads: true
    });
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
  nickname: { type: String, required: true },
  profilePicture: String,
  mmr: { type: Number, default: 1500 },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  preferredRoles: [{
    type: String,
    enum: ['탱커', '투사', '원거리 암살자', '근접 암살자', '지원가', '힐러', '서포터', '브루저', '전체']
  }],
  isAdmin: { type: Boolean, default: false },
  isDummy: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = async function handler(req, res) {
  try {
    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    const { pathname, searchParams } = new URL(req.url, `http://${req.headers.host}`);
    const action = searchParams.get('action');

    console.log('Test API 호출:', {
      method: req.method,
      url: req.url,
      pathname,
      action,
      searchParams: Object.fromEntries(searchParams.entries())
    });

    // POST /api/test?action=create-sample-data
    if (req.method === 'POST' && action === 'create-sample-data') {
      console.log('샘플 데이터 생성 시작...');
      await connectMongoDB();

      // 기존 사용자 수 확인
      const existingUserCount = await User.countDocuments();
      console.log('기존 사용자 수:', existingUserCount);

      if (existingUserCount >= 10) {
        return res.json({
          success: true,
          message: '이미 충분한 사용자 데이터가 있습니다.',
          userCount: existingUserCount
        });
      }

      // 샘플 사용자 데이터
      const sampleUsers = [
        {
          bnetId: 'sample1',
          battletag: 'ProGamer#1234',
          nickname: '프로게이머',
          mmr: 2100,
          wins: 45,
          losses: 20,
          preferredRoles: ['원거리 암살자'],
          isDummy: true
        },
        {
          bnetId: 'sample2',
          battletag: 'TankMaster#5678',
          nickname: '탱크마스터',
          mmr: 1950,
          wins: 38,
          losses: 25,
          preferredRoles: ['탱커'],
          isDummy: true
        },
        {
          bnetId: 'sample3',
          battletag: 'HealBot#9012',
          nickname: '힐봇',
          mmr: 1850,
          wins: 42,
          losses: 28,
          preferredRoles: ['힐러'],
          isDummy: true
        },
        {
          bnetId: 'sample4',
          battletag: 'AssassinKing#3456',
          nickname: '암살자킹',
          mmr: 1750,
          wins: 35,
          losses: 30,
          preferredRoles: ['근접 암살자'],
          isDummy: true
        },
        {
          bnetId: 'sample5',
          battletag: 'SupportGod#7890',
          nickname: '서포트신',
          mmr: 1650,
          wins: 30,
          losses: 25,
          preferredRoles: ['지원가'],
          isDummy: true
        }
      ];

      // 중복 제거를 위해 기존 사용자 확인
      const existingBnetIds = await User.find({}, 'bnetId').lean();
      const existingIds = existingBnetIds.map(u => u.bnetId);

      const newUsers = sampleUsers.filter(user => !existingIds.includes(user.bnetId));

      if (newUsers.length === 0) {
        return res.json({
          success: true,
          message: '모든 샘플 사용자가 이미 존재합니다.',
          userCount: existingUserCount
        });
      }

      // 새 사용자 생성
      const createdUsers = await User.insertMany(newUsers);
      console.log(`${createdUsers.length}명의 샘플 사용자 생성 완료`);

      const finalUserCount = await User.countDocuments();

      return res.json({
        success: true,
        message: `${createdUsers.length}명의 샘플 사용자가 생성되었습니다.`,
        createdCount: createdUsers.length,
        totalUserCount: finalUserCount,
        users: createdUsers.map(u => ({
          nickname: u.nickname,
          mmr: u.mmr,
          wins: u.wins,
          losses: u.losses
        }))
      });
    }

    // 기본 GET 요청
    if (req.method === 'GET') {
      return res.json({
        message: 'Vercel API 라우트 테스트 성공!',
        method: req.method,
        url: req.url,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        actions: {
          'create-sample-data': 'POST /api/test?action=create-sample-data'
        }
      });
    }

    return res.status(405).json({ error: '지원하지 않는 메서드입니다' });

  } catch (error) {
    console.error('API 테스트 오류:', error);
    return res.status(500).json({
      error: '서버 오류가 발생했습니다',
      details: error.message
    });
  }
};
