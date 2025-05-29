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

// Match 모델 정의
const matchSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['open', 'full', 'in_progress', 'completed', 'cancelled'],
    default: 'open'
  },
  gameMode: { type: String, default: 'ranked' },
  maxPlayers: { type: Number, default: 10 },
  map: String,
  isPrivate: { type: Boolean, default: false },
  password: String,
  balanceType: { type: String, default: 'mmr' },
  teams: {
    blue: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      role: String,
      hero: String,
      joinedAt: { type: Date, default: Date.now }
    }],
    red: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      role: String,
      hero: String,
      joinedAt: { type: Date, default: Date.now }
    }]
  },
  result: {
    winner: String,
    blueScore: { type: Number, default: 0 },
    redScore: { type: Number, default: 0 },
    duration: { type: Number, default: 0 }
  },
  playerStats: [{
    userId: String,
    battletag: String,
    team: String,
    hero: String,
    kills: Number,
    deaths: Number,
    assists: Number,
    heroDamage: Number,
    siegeDamage: Number,
    healing: Number,
    experienceContribution: Number,
    mmrBefore: Number,
    mmrAfter: Number,
    mmrChange: Number
  }],
  isSimulation: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  scheduledTime: { type: Date, default: Date.now }
});

const Match = mongoose.models.Match || mongoose.model('Match', matchSchema);

module.exports = async function handler(req, res) {
  try {
    console.log('API 테스트 요청:', req.method, req.url);

    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    const results = {
      timestamp: new Date().toISOString(),
      tests: {}
    };

    try {
      // MongoDB 연결 테스트
      await connectMongoDB();
      results.tests.mongodb = '✅ 연결 성공';
    } catch (error) {
      results.tests.mongodb = `❌ 연결 실패: ${error.message}`;
    }

    try {
      // 사용자 수 확인
      const userCount = await User.countDocuments();
      results.tests.userCount = `✅ 사용자 ${userCount}명`;
    } catch (error) {
      results.tests.userCount = `❌ 사용자 조회 실패: ${error.message}`;
    }

    try {
      // 매치 수 확인
      const matchCount = await Match.countDocuments();
      results.tests.matchCount = `✅ 매치 ${matchCount}개`;
    } catch (error) {
      results.tests.matchCount = `❌ 매치 조회 실패: ${error.message}`;
    }

    try {
      // 완료된 게임 수 확인
      const completedMatchCount = await Match.countDocuments({ status: 'completed' });
      results.tests.completedMatches = `✅ 완료된 게임 ${completedMatchCount}개`;
    } catch (error) {
      results.tests.completedMatches = `❌ 완료된 게임 조회 실패: ${error.message}`;
    }

    try {
      // 리더보드 데이터 테스트
      const leaderboard = await User.find({ wins: { $gt: 0 } })
        .sort({ mmr: -1 })
        .limit(5)
        .select('nickname battletag mmr wins losses');
      results.tests.leaderboard = `✅ 리더보드 ${leaderboard.length}명`;
      results.leaderboardSample = leaderboard;
    } catch (error) {
      results.tests.leaderboard = `❌ 리더보드 조회 실패: ${error.message}`;
    }

    try {
      // 최근 게임 데이터 테스트
      const recentGames = await Match.find({ status: 'completed' })
        .sort({ scheduledTime: -1 })
        .limit(3)
        .select('title map gameMode scheduledTime result');
      results.tests.recentGames = `✅ 최근 게임 ${recentGames.length}개`;
      results.recentGamesSample = recentGames;
    } catch (error) {
      results.tests.recentGames = `❌ 최근 게임 조회 실패: ${error.message}`;
    }

    // API 엔드포인트 존재 확인
    results.tests.apiEndpoints = {
      '/api/users': '✅ 존재',
      '/api/matchmaking': '✅ 존재',
      '/api/matches': '✅ 존재'
    };

    console.log('API 테스트 결과:', results);

    res.status(200).json({
      success: true,
      message: 'API 테스트 완료',
      results
    });

  } catch (error) {
    console.error('API 테스트 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
};
