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
    const { pathname } = new URL(req.url, `http://${req.headers.host}`);
    console.log('Vercel /api/admin 요청 처리:', req.method, pathname);

    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'https://hotstinder.vercel.app');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // OPTIONS 요청 처리
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // 관리자 권한 확인 (dashboard 제외)
    if (!pathname.includes('/dashboard')) {
      await verifyAdmin(req);
    }

    // MongoDB 연결
    await connectMongoDB();

    // 라우팅 처리
    if (pathname === '/api/admin/dashboard') {
      return handleDashboard(req, res);
    } else if (pathname === '/api/admin/users') {
      return handleUsers(req, res);
    } else if (pathname === '/api/admin/matches') {
      return handleMatches(req, res);
    } else if (pathname === '/api/admin/delete-all-users') {
      return handleDeleteAllUsers(req, res);
    } else if (pathname === '/api/admin/delete-all-matches') {
      return handleDeleteAllMatches(req, res);
    } else if (pathname === '/api/admin/create-test-accounts') {
      return handleCreateTestAccounts(req, res);
    } else if (pathname === '/api/admin/create-test-matches') {
      return handleCreateTestMatches(req, res);
    } else {
      return res.status(404).json({ error: 'Not found' });
    }

  } catch (error) {
    console.error('/api/admin 오류:', error);

    if (error.message.includes('권한') || error.message.includes('토큰')) {
      res.status(401).json({ error: error.message });
    } else {
      res.status(500).json({ error: '서버 오류가 발생했습니다' });
    }
  }
};

// 대시보드 핸들러
async function handleDashboard(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [totalUsers, totalMatches, activeUsers, recentMatches] = await Promise.all([
    User.countDocuments({}),
    Match.countDocuments({}),
    User.countDocuments({ lastLoginAt: { $gte: oneWeekAgo } }),
    Match.countDocuments({ createdAt: { $gte: oneDayAgo } })
  ]);

  console.log('대시보드 통계 수집 완료:', { totalUsers, totalMatches, activeUsers, recentMatches });

  res.status(200).json({ totalUsers, totalMatches, activeUsers, recentMatches });
}

// 사용자 관리 핸들러
async function handleUsers(req, res) {
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
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

// 매치 관리 핸들러
async function handleMatches(req, res) {
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
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

// 모든 사용자 삭제 핸들러
async function handleDeleteAllUsers(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const result = await User.deleteMany({ isAdmin: { $ne: true } });
  console.log(`모든 사용자 삭제 완료: ${result.deletedCount}개`);

  res.status(200).json({
    success: true,
    message: `관리자를 제외한 ${result.deletedCount}명의 사용자가 삭제되었습니다`,
    deletedCount: result.deletedCount
  });
}

// 모든 매치 삭제 핸들러
async function handleDeleteAllMatches(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const result = await Match.deleteMany({});
  console.log(`모든 매치 삭제 완료: ${result.deletedCount}개`);

  res.status(200).json({
    success: true,
    message: `${result.deletedCount}개의 매치가 삭제되었습니다`,
    deletedCount: result.deletedCount
  });
}

// 테스트 계정 생성 핸들러
async function handleCreateTestAccounts(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
}

// 테스트 매치 생성 핸들러
async function handleCreateTestMatches(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
}
