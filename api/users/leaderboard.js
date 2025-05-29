const mongoose = require('mongoose');

// MongoDB 연결 함수 (최적화된 설정)
const connectMongoDB = async () => {
  if (mongoose.connections[0].readyState) {
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
      bufferCommands: false,
      bufferMaxEntries: 0
    });
    console.log('MongoDB 연결 성공 (리더보드)');
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

// MMR 기반 티어 계산
const getTier = (mmr) => {
  if (mmr >= 2500) return '그랜드마스터';
  if (mmr >= 2200) return '마스터';
  if (mmr >= 2000) return '다이아몬드';
  if (mmr >= 1800) return '플래티넘';
  if (mmr >= 1600) return '골드';
  if (mmr >= 1400) return '실버';
  return '브론즈';
};

module.exports = async function handler(req, res) {
  try {
    console.log('Vercel /api/users/leaderboard 요청 처리:', req.method);

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
      return res.status(405).json({ error: '허용되지 않는 메소드입니다' });
    }

    // MongoDB 연결
    await connectMongoDB();

    const { minGames = 1, limit = 100 } = req.query;
    const minGamesNum = parseInt(minGames);
    const limitNum = parseInt(limit);

    try {
      // MongoDB에서 사용자 데이터 가져오기
      const users = await User.find({}).lean().exec();

      if (!users || users.length === 0) {
        console.warn('리더보드에 표시할 사용자 데이터가 없습니다');
        return res.json([]);
      }

      console.log(`리더보드용 사용자 ${users.length}명 조회됨`);

      // 유효한 사용자만 필터링 (최소 게임 수 이상)
      let filteredUsers = users.filter(user => {
        const totalGames = (user.wins || 0) + (user.losses || 0);
        return totalGames >= minGamesNum;
      });

      // MMR 기준으로 정렬
      filteredUsers.sort((a, b) => (b.mmr || 0) - (a.mmr || 0));

      // 제한된 수의 사용자만 반환
      filteredUsers = filteredUsers.slice(0, limitNum);

      // 리더보드 정보로 변환
      const leaderboard = filteredUsers.map((user, index) => {
        const wins = user.wins || 0;
        const losses = user.losses || 0;
        const totalGames = wins + losses;
        const winRate = totalGames > 0 ? ((wins / totalGames) * 100).toFixed(1) : '0.0';

        const btag = user.battletag || user.battleTag || '';
        let mainRole = '없음';
        if (user.preferredRoles && Array.isArray(user.preferredRoles) && user.preferredRoles.length > 0) {
          mainRole = user.preferredRoles[0];
        }

        const mmr = user.mmr || 1500;
        const tier = getTier(mmr);
        const isDummy = user.isDummy || false;

        return {
          rank: index + 1,
          id: user._id || `user-${index}`,
          nickname: user.nickname || (btag ? btag.split('#')[0] : `유저${index+1}`),
          battletag: btag,
          mmr: mmr,
          wins: wins,
          losses: losses,
          winRate: parseFloat(winRate),
          mainRole: mainRole,
          tier: tier,
          totalGames: totalGames,
          isDummy: isDummy
        };
      });

      console.log(`리더보드 데이터 ${leaderboard.length}개 반환`);
      return res.json(leaderboard);
    } catch (err) {
      console.error('리더보드 조회 오류:', err);
      return res.json([]);
    }

  } catch (error) {
    console.error('/api/users/leaderboard 오류:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
};
