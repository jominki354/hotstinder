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

// 랜덤 데이터 생성 함수들
const getRandomHero = () => {
  const heroes = [
    'Abathur', 'Alarak', 'Alexstrasza', 'Ana', 'Anduin', 'Anubarak', 'Artanis', 'Arthas',
    'Auriel', 'Azmodan', 'Blaze', 'Brightwing', 'Cassia', 'Chen', 'Cho', 'Chromie',
    'Deckard', 'Dehaka', 'Diablo', 'DVa', 'ETC', 'Falstad', 'Fenix', 'Gall',
    'Garrosh', 'Gazlowe', 'Genji', 'Greymane', 'Guldan', 'Hanzo', 'Illidan', 'Imperius',
    'Jaina', 'Johanna', 'Junkrat', 'Kaelthas', 'Kelthuzad', 'Kerrigan', 'Kharazim', 'Leoric',
    'LiLi', 'LiMing', 'LtMorales', 'Lucio', 'Lunara', 'Maiev', 'Malfurion', 'Malganis',
    'Malthael', 'Medivh', 'Mephisto', 'Muradin', 'Murky', 'Nazeebo', 'Nova', 'Orphea',
    'Probius', 'Qhira', 'Ragnaros', 'Raynor', 'Rehgar', 'Rexxar', 'Samuro', 'Sgt.Hammer',
    'Sonya', 'Stitches', 'Stukov', 'Sylvanas', 'Tassadar', 'The Butcher', 'Thrall', 'Tracer',
    'Tychus', 'Tyrael', 'Tyrande', 'Uther', 'Valeera', 'Valla', 'Varian', 'Whitemane',
    'Xul', 'Yrel', 'Zagara', 'Zarya', 'Zeratul', 'Zuljin'
  ];
  return heroes[Math.floor(Math.random() * heroes.length)];
};

const getRandomMap = () => {
  const maps = [
    'Alterac Pass', 'Battlefield of Eternity', 'Blackheart\'s Bay', 'Braxis Holdout',
    'Cursed Hollow', 'Dragon Shire', 'Garden of Terror', 'Hanamura Temple',
    'Infernal Shrines', 'Sky Temple', 'Tomb of the Spider Queen', 'Towers of Doom',
    'Volskaya Foundry', 'Warhead Junction'
  ];
  return maps[Math.floor(Math.random() * maps.length)];
};

const getRandomRole = () => {
  const roles = ['Tank', 'Bruiser', 'Melee Assassin', 'Ranged Assassin', 'Healer', 'Support'];
  return roles[Math.floor(Math.random() * roles.length)];
};

const generateMatchDuration = () => {
  const minMinutes = 10;
  const maxMinutes = 35;
  const minutes = Math.random() * (maxMinutes - minMinutes) + minMinutes;
  return Math.round(minutes * 60);
};

module.exports = async function handler(req, res) {
  try {
    console.log('Vercel /api/admin/create-test-matches 요청 처리:', req.method);

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

    if (req.method === 'POST') {
      const { count = 5 } = req.body;
      const matchCount = Math.min(Math.max(1, parseInt(count)), 50);
      console.log(`${matchCount}개의 테스트 매치 생성 시작`);

      const users = await User.find({}).limit(100);
      if (users.length < 10) {
        return res.status(400).json({
          error: '테스트 매치 생성을 위해 최소 10명의 사용자가 필요합니다',
          message: '먼저 테스트 계정을 생성해주세요'
        });
      }

      const createdMatches = [];

      for (let i = 0; i < matchCount; i++) {
        try {
          const shuffledUsers = users.sort(() => 0.5 - Math.random());
          const selectedUsers = shuffledUsers.slice(0, 10);

          const players = selectedUsers.map((user, index) => ({
            bnetId: user.bnetId,
            battletag: user.battletag,
            team: index < 5 ? 0 : 1,
            hero: getRandomHero(),
            role: getRandomRole(),
            mmr: user.mmr
          }));

          const team0AvgMMR = players.slice(0, 5).reduce((sum, p) => sum + p.mmr, 0) / 5;
          const team1AvgMMR = players.slice(5, 10).reduce((sum, p) => sum + p.mmr, 0) / 5;
          const mmrDiff = team0AvgMMR - team1AvgMMR;
          const team0WinChance = 0.5 + (mmrDiff / 1000) * 0.2;
          const winner = Math.random() < Math.max(0.1, Math.min(0.9, team0WinChance)) ? 0 : 1;

          const matchData = {
            matchId: `test_match_${Date.now()}_${i}`,
            players,
            result: {
              winner,
              duration: generateMatchDuration(),
              map: getRandomMap()
            },
            createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
            completedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
          };

          const match = new Match(matchData);
          await match.save();

          for (const player of players) {
            const user = await User.findOne({ bnetId: player.bnetId });
            if (user) {
              if (player.team === winner) {
                user.wins += 1;
              } else {
                user.losses += 1;
              }
              await user.save();
            }
          }

          createdMatches.push(matchData.matchId);

        } catch (error) {
          if (error.code === 11000) {
            console.log(`중복된 매치 건너뜀: test_match_${Date.now()}_${i}`);
          } else {
            console.error(`매치 생성 실패:`, error);
          }
        }
      }

      console.log(`테스트 매치 생성 완료: ${createdMatches.length}개`);

      res.status(200).json({
        success: true,
        message: `${createdMatches.length}개의 테스트 매치가 생성되었습니다.`,
        createdCount: createdMatches.length,
        requestedCount: matchCount,
        matches: createdMatches.slice(0, 10)
      });

    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('/api/admin/create-test-matches 오류:', error);

    if (error.message.includes('권한') || error.message.includes('토큰')) {
      res.status(401).json({ error: error.message });
    } else {
      res.status(500).json({ error: '서버 오류가 발생했습니다' });
    }
  }
};
