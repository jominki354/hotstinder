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

// 랜덤 데이터 생성 함수들
const generateRandomBattletag = () => {
  const adjectives = ['Swift', 'Brave', 'Mighty', 'Silent', 'Fierce', 'Noble', 'Quick', 'Strong', 'Wise', 'Bold'];
  const nouns = ['Warrior', 'Hunter', 'Mage', 'Knight', 'Ranger', 'Paladin', 'Rogue', 'Wizard', 'Hero', 'Champion'];
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 9999) + 1;
  return `${adjective}${noun}#${number}`;
};

const generateRandomMMR = () => {
  const min = 1000;
  const max = 3000;
  const mean = 1500;
  const stdDev = 300;

  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

  let mmr = Math.round(mean + stdDev * z0);
  return Math.max(min, Math.min(max, mmr));
};

const generateRandomRoles = () => {
  const allRoles = ['Tank', 'Bruiser', 'Melee Assassin', 'Ranged Assassin', 'Healer', 'Support'];
  const numRoles = Math.floor(Math.random() * 3) + 1;
  const shuffled = allRoles.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, numRoles);
};

const generateRandomHeroes = () => {
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
  const numHeroes = Math.floor(Math.random() * 5) + 1;
  const shuffled = heroes.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, numHeroes);
};

module.exports = async function handler(req, res) {
  try {
    console.log('Vercel /api/admin/create-test-accounts 요청 처리:', req.method);

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
      const { count = 10 } = req.body;
      const accountCount = Math.min(Math.max(1, parseInt(count)), 100);
      console.log(`${accountCount}개의 테스트 계정 생성 시작`);

      const testAccounts = [];
      const createdAccounts = [];

      for (let i = 0; i < accountCount; i++) {
        const bnetId = `test_${Date.now()}_${i}`;
        const battletag = generateRandomBattletag();

        const testAccount = {
          bnetId, battletag,
          email: `test${i}@hotstinder.com`,
          isProfileComplete: Math.random() > 0.3,
          mmr: generateRandomMMR(),
          wins: Math.floor(Math.random() * 100),
          losses: Math.floor(Math.random() * 100),
          preferredRoles: generateRandomRoles(),
          favoriteHeroes: generateRandomHeroes(),
          createdAt: new Date(),
          lastLoginAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
        };

        testAccounts.push(testAccount);
      }

      for (const account of testAccounts) {
        try {
          const user = new User(account);
          await user.save();
          createdAccounts.push(account.battletag);
        } catch (error) {
          if (error.code === 11000) {
            console.log(`중복된 계정 건너뜀: ${account.bnetId}`);
          } else {
            console.error(`계정 생성 실패: ${account.battletag}`, error);
          }
        }
      }

      console.log(`테스트 계정 생성 완료: ${createdAccounts.length}개`);

      res.status(200).json({
        success: true,
        message: `${createdAccounts.length}개의 테스트 계정이 생성되었습니다.`,
        createdCount: createdAccounts.length,
        requestedCount: accountCount,
        accounts: createdAccounts.slice(0, 10)
      });

    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('/api/admin/create-test-accounts 오류:', error);

    if (error.message.includes('권한') || error.message.includes('토큰')) {
      res.status(401).json({ error: error.message });
    } else {
      res.status(500).json({ error: '서버 오류가 발생했습니다' });
    }
  }
};
