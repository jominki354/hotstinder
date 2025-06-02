const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

// 미들웨어: 인증 확인
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: '인증 토큰이 필요합니다' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!global.db || !global.db.User) {
      return res.status(500).json({ message: '데이터베이스가 초기화되지 않았습니다' });
    }

    // JWT에서 받은 ID로 사용자 찾기 (UUID 우선, bnetId fallback)
    let user = await global.db.User.findByPk(decoded.id);
    if (!user) {
      user = await global.db.User.findOne({ where: { bnetId: decoded.id } });
    }

    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다' });
    }

    req.user = user;
    next();
  } catch (err) {
    logger.error('인증 오류:', err);
    return res.status(401).json({ message: '인증에 실패했습니다' });
  }
};

// 미들웨어: 관리자 확인
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: '관리자 권한이 필요합니다' });
  }
  next();
};

/**
 * @route   GET /api/admin/users
 * @desc    모든 사용자 목록 조회 (관리자용)
 * @access  Admin
 */
router.get('/users', authenticate, isAdmin, async (req, res) => {
  const timer = logger.startTimer('Admin Get Users');

  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const role = req.query.role || 'all';

    logger.info('👥 관리자 사용자 목록 조회 요청', {
      adminId: req.user.id,
      page,
      limit,
      search,
      role
    }, 'ADMIN');

    let whereClause = {};

    // 검색 조건
    if (search) {
      whereClause[Op.or] = [
        { battleTag: { [Op.iLike]: `%${search}%` } },
        { nickname: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // 역할 필터
    if (role !== 'all') {
      whereClause.role = role;
    }

    const { count, rows: users } = await global.db.User.findAndCountAll({
      where: whereClause,
      attributes: [
        'id', 'battleTag', 'nickname', 'email', 'role',
        'mmr', 'wins', 'losses', 'isProfileComplete',
        'createdAt', 'lastLoginAt'
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    const userList = users.map(user => ({
      id: user.id,
      _id: user.id,
      battleTag: user.battleTag,
      battletag: user.battleTag,
      nickname: user.nickname,
      email: user.email,
      role: user.role,
      mmr: user.mmr,
      wins: user.wins,
      losses: user.losses,
      winRate: user.getWinRate(),
      isProfileComplete: user.isProfileComplete,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt
    }));

    logger.info('✅ 관리자 사용자 목록 조회 성공', {
      adminId: req.user.id,
      totalUsers: count,
      returnedUsers: userList.length,
      page,
      duration: timer.end()
    }, 'ADMIN');

    res.json({
      users: userList,
      pagination: {
        total: count,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        limit
      }
    });

  } catch (err) {
    timer.end();
    logger.error('💥 관리자 사용자 목록 조회 오류', {
      error: err.message,
      stack: err.stack,
      adminId: req.user?.id
    }, 'ADMIN');
    res.status(500).json({ message: '사용자 목록 조회에 실패했습니다' });
  }
});

/**
 * @route   GET /api/admin/users/:id
 * @desc    개별 사용자 정보 조회 (관리자용)
 * @access  Admin
 */
router.get('/users/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await global.db.User.findByPk(userId, {
      attributes: [
        'id', 'battleTag', 'nickname', 'email', 'role',
        'mmr', 'wins', 'losses', 'isProfileComplete',
        'preferredRoles', 'previousTier',
        'createdAt', 'lastLoginAt'
      ]
    });

    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다' });
    }

    // 사용자 정보 반환 (클라이언트 호환성을 위해 필드 매핑)
    const userResponse = {
      id: user.id,
      battleTag: user.battleTag,
      battletag: user.battleTag, // 호환성을 위해 추가
      nickname: user.nickname,
      email: user.email,
      role: user.role,
      mmr: user.mmr,
      wins: user.wins,
      losses: user.losses,
      winRate: user.getWinRate(),
      isProfileComplete: user.isProfileComplete,
      preferredRoles: user.preferredRoles || [],
      previousTier: user.previousTier || 'placement',
      favoriteHeroes: [], // 기본값
      isAdmin: user.role === 'admin', // 호환성을 위해 추가
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt
    };

    logger.info('관리자 개별 사용자 조회:', {
      adminId: req.user.id,
      targetUserId: userId,
      targetBattleTag: user.battleTag
    });

    res.json(userResponse);

  } catch (err) {
    logger.error('관리자 개별 사용자 조회 오류:', err);
    res.status(500).json({ message: '사용자 정보 조회에 실패했습니다' });
  }
});

/**
 * @route   GET /api/admin/users/:id/logs
 * @desc    개별 사용자 로그 조회 (관리자용)
 * @access  Admin
 */
router.get('/users/:id/logs', authenticate, isAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const limit = parseInt(req.query.limit) || 20;

    // UserLog 모델이 있는지 확인
    if (!global.db.UserLog) {
      // UserLog 모델이 없으면 빈 배열 반환
      return res.json([]);
    }

    const logs = await global.db.UserLog.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit,
      attributes: ['id', 'action', 'ipAddress', 'userAgent', 'createdAt']
    });

    logger.info('관리자 사용자 로그 조회:', {
      adminId: req.user.id,
      targetUserId: userId,
      logCount: logs.length
    });

    res.json(logs);

  } catch (err) {
    logger.error('관리자 사용자 로그 조회 오류:', err);
    // 에러가 발생해도 빈 배열 반환 (로그는 필수가 아니므로)
    res.json([]);
  }
});

/**
 * @route   GET /api/admin/users/:id/matches
 * @desc    개별 사용자 매치 히스토리 조회 (관리자용)
 * @access  Admin
 */
router.get('/users/:id/matches', authenticate, isAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const limit = parseInt(req.query.limit) || 10;

    // Match 모델이 있는지 확인
    if (!global.db.Match || !global.db.MatchParticipant) {
      // 필요한 모델이 없으면 빈 배열 반환
      return res.json([]);
    }

    // 사용자가 참여한 매치 조회 (MatchParticipant를 통해)
    const matches = await global.db.Match.findAll({
      include: [{
        model: global.db.MatchParticipant,
        as: 'participants',
        where: { userId },
        attributes: ['team', 'hero', 'role']
      }],
      order: [['createdAt', 'DESC']],
      limit,
      attributes: ['id', 'mapName', 'winner', 'status', 'createdAt']
    });

    // 매치 데이터 변환
    const matchHistory = matches.map(match => {
      const playerData = match.participants[0]; // 해당 사용자의 플레이어 데이터
      return {
        id: match.id,
        map: match.mapName,
        winner: match.winner,
        playerTeam: playerData ? playerData.team : null,
        hero: playerData ? playerData.hero : null,
        role: playerData ? playerData.role : null,
        status: match.status,
        createdAt: match.createdAt
      };
    });

    logger.info('관리자 사용자 매치 히스토리 조회:', {
      adminId: req.user.id,
      targetUserId: userId,
      matchCount: matchHistory.length
    });

    res.json(matchHistory);

  } catch (err) {
    logger.error('관리자 사용자 매치 히스토리 조회 오류:', err);
    // 에러가 발생해도 빈 배열 반환 (매치 히스토리는 필수가 아니므로)
    res.json([]);
  }
});

/**
 * @route   GET /api/admin/stats
 * @desc    관리자 통계 조회
 * @access  Admin
 */
router.get('/stats', authenticate, isAdmin, async (req, res) => {
  try {
    // 기본 통계
    const totalUsers = await global.db.User.count();
    const totalMatches = await global.db.Match.count();

    // 활성 사용자 (최근 7일 내 로그인)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activeUsers = await global.db.User.count({
      where: {
        lastLoginAt: {
          [Op.gte]: sevenDaysAgo
        }
      }
    });

    // 매치 상태별 통계
    const matchStats = await global.db.Match.findAll({
      attributes: [
        'status',
        [global.db.sequelize.fn('COUNT', global.db.sequelize.col('id')), 'count']
      ],
      group: ['status']
    });

    const matchStatusCounts = {};
    matchStats.forEach(stat => {
      matchStatusCounts[stat.status] = parseInt(stat.dataValues.count);
    });

    // 대기열 통계
    const queueCount = await global.db.MatchmakingQueue.count();

    // 최근 가입자 (최근 24시간)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const newUsersToday = await global.db.User.count({
      where: {
        createdAt: {
          [Op.gte]: oneDayAgo
        }
      }
    });

    // MMR 분포
    const mmrDistribution = await global.db.User.findAll({
      attributes: [
        [global.db.sequelize.fn('COUNT', global.db.sequelize.col('id')), 'count'],
        [global.db.sequelize.literal(`
          CASE
            WHEN mmr >= 2500 THEN 'Grandmaster'
            WHEN mmr >= 2200 THEN 'Master'
            WHEN mmr >= 2000 THEN 'Diamond'
            WHEN mmr >= 1800 THEN 'Platinum'
            WHEN mmr >= 1600 THEN 'Gold'
            WHEN mmr >= 1400 THEN 'Silver'
            ELSE 'Bronze'
          END
        `), 'tier']
      ],
      group: [global.db.sequelize.literal(`
        CASE
          WHEN mmr >= 2500 THEN 'Grandmaster'
          WHEN mmr >= 2200 THEN 'Master'
          WHEN mmr >= 2000 THEN 'Diamond'
          WHEN mmr >= 1800 THEN 'Platinum'
          WHEN mmr >= 1600 THEN 'Gold'
          WHEN mmr >= 1400 THEN 'Silver'
          ELSE 'Bronze'
        END
      `)]
    });

    const tierDistribution = {};
    mmrDistribution.forEach(dist => {
      tierDistribution[dist.dataValues.tier] = parseInt(dist.dataValues.count);
    });

    res.json({
      totalUsers,
      totalMatches,
      activeUsers,
      newUsersToday,
      queueCount,
      matchStats: matchStatusCounts,
      tierDistribution
    });

  } catch (err) {
    logger.error('관리자 통계 조회 오류:', err);
    res.status(500).json({ message: '통계 조회에 실패했습니다' });
  }
});

/**
 * @route   GET /api/admin/dashboard
 * @desc    관리자 대시보드 데이터 조회 (프론트엔드 호환)
 * @access  Admin
 */
router.get('/dashboard', authenticate, isAdmin, async (req, res) => {
  const timer = logger.startTimer('Admin Dashboard');

  try {
    logger.info('📊 관리자 대시보드 요청', {
      adminId: req.user?.id,
      adminRole: req.user?.role,
      userAgent: req.headers['user-agent']?.substring(0, 100),
      origin: req.headers.origin,
      referer: req.headers.referer
    }, 'ADMIN');

    // 기본 통계
    const totalUsers = await global.db.User.count();
    const totalMatches = await global.db.Match.count();

    // 활성 사용자 (최근 7일 내 로그인)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activeUsers = await global.db.User.count({
      where: {
        lastLoginAt: {
          [Op.gte]: sevenDaysAgo
        }
      }
    });

    // 최근 매치 (최근 24시간)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const recentMatches = await global.db.Match.count({
      where: {
        createdAt: {
          [Op.gte]: oneDayAgo
        }
      }
    });

    const dashboardData = {
      totalUsers,
      totalMatches,
      activeUsers,
      recentMatches
    };

    logger.info('✅ 관리자 대시보드 데이터 조회 완료', {
      adminId: req.user.id,
      data: dashboardData,
      duration: timer.end()
    }, 'ADMIN');

    // 캐시 방지 헤더 설정
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.json(dashboardData);

  } catch (err) {
    timer.end();
    logger.error('💥 관리자 대시보드 조회 오류', {
      error: err.message,
      stack: err.stack,
      adminId: req.user?.id
    }, 'ADMIN');
    res.status(500).json({
      message: '대시보드 데이터 조회에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

/**
 * @route   PUT /api/admin/users/:id
 * @desc    사용자 정보 수정 (관리자용)
 * @access  Admin
 */
router.put('/users/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const { role, mmr, wins, losses, isProfileComplete } = req.body;

    const user = await global.db.User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다' });
    }

    // 업데이트할 필드들
    const updateData = {};
    if (role !== undefined) updateData.role = role;
    if (mmr !== undefined) updateData.mmr = mmr;
    if (wins !== undefined) updateData.wins = wins;
    if (losses !== undefined) updateData.losses = losses;
    if (isProfileComplete !== undefined) updateData.isProfileComplete = isProfileComplete;

    await user.update(updateData);

    // 로그 기록
    try {
      if (global.db && global.db.UserLog) {
        await global.db.UserLog.create({
          userId: req.user.id,
          action: 'admin_user_update',
          details: {
            targetUserId: userId,
            targetBattleTag: user.battleTag,
            changes: updateData
          },
          ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
          userAgent: req.headers['user-agent']
        });
      }
    } catch (logErr) {
      logger.error('관리자 사용자 수정 로그 기록 오류:', logErr);
    }

    logger.info('관리자가 사용자 정보 수정:', {
      adminId: req.user.id,
      targetUserId: userId,
      changes: updateData
    });

    res.json({
      success: true,
      message: '사용자 정보가 성공적으로 수정되었습니다',
      user: {
        id: user.id,
        battleTag: user.battleTag,
        nickname: user.nickname,
        role: user.role,
        mmr: user.mmr,
        wins: user.wins,
        losses: user.losses,
        winRate: user.getWinRate(),
        isProfileComplete: user.isProfileComplete
      }
    });

  } catch (err) {
    logger.error('관리자 사용자 수정 오류:', err);
    res.status(500).json({ message: '사용자 정보 수정에 실패했습니다' });
  }
});

/**
 * @route   GET /api/admin/logs
 * @desc    사용자 활동 로그 조회
 * @access  Admin
 */
router.get('/logs', authenticate, isAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const action = req.query.action || 'all';
    const userId = req.query.userId;

    let whereClause = {};
    if (action !== 'all') {
      whereClause.action = action;
    }
    if (userId) {
      whereClause.userId = userId;
    }

    const { count, rows: logs } = await global.db.UserLog.findAndCountAll({
      where: whereClause,
      include: [{
        model: global.db.User,
        as: 'user',
        attributes: ['id', 'battleTag', 'nickname']
      }],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    res.json({
      logs,
      pagination: {
        total: count,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        limit
      }
    });

  } catch (err) {
    logger.error('관리자 로그 조회 오류:', err);
    res.status(500).json({ message: '로그 조회에 실패했습니다' });
  }
});

/**
 * @route   POST /api/admin/create-test-accounts
 * @desc    테스트 계정 생성
 * @access  Admin
 */
router.post('/create-test-accounts', authenticate, isAdmin, async (req, res) => {
  try {
    const { count = 10 } = req.body;
    const maxCount = 50;
    const actualCount = Math.min(Math.max(1, parseInt(count)), maxCount);

    logger.info('테스트 계정 생성 요청:', {
      adminId: req.user.id,
      requestedCount: count,
      actualCount
    });

    const testAccounts = [];
    const heroes = ['Abathur', 'Alarak', 'Alexstrasza', 'Ana', 'Anduin', 'Anubarak', 'Artanis', 'Arthas', 'Auriel', 'Azmodan', 'Blaze', 'Brightwing', 'Cassia', 'Chen', 'Cho', 'Chromie', 'Deckard', 'Dehaka', 'Diablo', 'DVa', 'ETC', 'Falstad', 'Fenix', 'Gall', 'Garrosh', 'Gazlowe', 'Genji', 'Greymane', 'Guldan', 'Hanzo', 'Illidan', 'Imperius', 'Jaina', 'Johanna', 'Junkrat', 'Kaelthas', 'Kelthuzad', 'Kerrigan', 'Kharazim', 'Leoric', 'LiLi', 'LiMing', 'LtMorales', 'Lucio', 'Lunara', 'Maiev', 'Malfurion', 'Malganis', 'Malthael', 'Medivh', 'Mephisto', 'Muradin', 'Murky', 'Nazeebo', 'Nova', 'Orphea', 'Probius', 'Qhira', 'Ragnaros', 'Raynor', 'Rehgar', 'Rexxar', 'Samuro', 'Sgt.Hammer', 'Sonya', 'Stitches', 'Stukov', 'Sylvanas', 'Tassadar', 'TheButcher', 'TheLostVikings', 'Thrall', 'Tracer', 'Tychus', 'Tyrael', 'Tyrande', 'Uther', 'Valeera', 'Valla', 'Varian', 'Whitemane', 'Xul', 'Yrel', 'Zagara', 'Zarya', 'Zeratul', 'Zuljin'];
    const roles = ['Tank', 'Bruiser', 'Melee Assassin', 'Ranged Assassin', 'Healer', 'Support'];

    for (let i = 0; i < actualCount; i++) {
      const randomHero = heroes[Math.floor(Math.random() * heroes.length)];
      const randomRole = roles[Math.floor(Math.random() * roles.length)];
      const randomMMR = Math.floor(Math.random() * 2000) + 1000; // 1000-3000 MMR
      const randomWins = Math.floor(Math.random() * 100);
      const randomLosses = Math.floor(Math.random() * 100);

      const testAccount = {
        bnetId: `test_${Date.now()}_${i}`,
        battleTag: `TestUser${i + 1}#${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`,
        nickname: `테스트유저${i + 1}`,
        email: `test${i + 1}@hotstinder.com`,
        password: 'test123', // 실제로는 해시됨
        role: 'user',
        isProfileComplete: true,
        preferredRoles: [randomRole],
        mmr: randomMMR,
        wins: randomWins,
        losses: randomLosses
      };

      testAccounts.push(testAccount);
    }

    // 배치 생성
    const createdAccounts = await global.db.User.bulkCreate(testAccounts, {
      returning: true,
      ignoreDuplicates: true
    });

    logger.info('테스트 계정 생성 완료:', {
      adminId: req.user.id,
      createdCount: createdAccounts.length,
      requestedCount: actualCount
    });

    res.json({
      message: `${createdAccounts.length}개의 테스트 계정이 생성되었습니다.`,
      createdCount: createdAccounts.length,
      accounts: createdAccounts.map(acc => ({
        id: acc.id,
        battleTag: acc.battleTag,
        mmr: acc.mmr
      }))
    });

  } catch (err) {
    logger.error('테스트 계정 생성 오류:', {
      error: err.message,
      stack: err.stack,
      adminId: req.user?.id
    });
    res.status(500).json({
      error: '테스트 계정 생성 중 오류가 발생했습니다.',
      message: process.env.NODE_ENV === 'development' ? err.message : '서버 오류가 발생했습니다.'
    });
  }
});

/**
 * @route   POST /api/admin/create-test-matches
 * @desc    테스트 매치 생성
 * @access  Admin
 */
router.post('/create-test-matches', authenticate, isAdmin, async (req, res) => {
  try {
    const { count = 5 } = req.body;
    const maxCount = 20;
    const actualCount = Math.min(Math.max(1, parseInt(count)), maxCount);

    logger.info('테스트 매치 생성 요청:', {
      adminId: req.user.id,
      requestedCount: count,
      actualCount
    });

    // 사용 가능한 사용자 조회 (최소 10명 필요)
    const availableUsers = await global.db.User.findAll({
      where: {
        role: 'user',
        isProfileComplete: true
      },
      limit: 100
    });

    if (availableUsers.length < 10) {
      return res.status(400).json({
        error: '테스트 매치 생성을 위해서는 최소 10명의 사용자가 필요합니다.',
        currentUsers: availableUsers.length
      });
    }

    const maps = ['Alterac Pass', 'Battlefield of Eternity', 'Braxis Holdout', 'Cursed Hollow', 'Dragon Shire', 'Garden of Terror', 'Hanamura Temple', 'Infernal Shrines', 'Sky Temple', 'Tomb of the Spider Queen', 'Towers of Doom', 'Volskaya Foundry'];
    const heroes = ['Abathur', 'Alarak', 'Alexstrasza', 'Ana', 'Anduin', 'Anubarak', 'Artanis', 'Arthas', 'Auriel', 'Azmodan', 'Blaze', 'Brightwing', 'Cassia', 'Chen', 'Chromie', 'Deckard', 'Dehaka', 'Diablo', 'DVa', 'ETC', 'Falstad', 'Fenix', 'Garrosh', 'Gazlowe', 'Genji', 'Greymane', 'Guldan', 'Hanzo', 'Illidan', 'Imperius', 'Jaina', 'Johanna', 'Junkrat', 'Kaelthas', 'Kelthuzad', 'Kerrigan', 'Kharazim', 'Leoric', 'LiLi', 'LiMing', 'LtMorales', 'Lucio', 'Lunara', 'Maiev', 'Malfurion', 'Malganis', 'Malthael', 'Medivh', 'Mephisto', 'Muradin', 'Murky', 'Nazeebo', 'Nova', 'Orphea', 'Probius', 'Qhira', 'Ragnaros', 'Raynor', 'Rehgar', 'Rexxar', 'Samuro', 'Sgt.Hammer', 'Sonya', 'Stitches', 'Stukov', 'Sylvanas', 'Tassadar', 'The Butcher', 'Thrall', 'Tracer', 'Tychus', 'Tyrael', 'Tyrande', 'Uther', 'Valeera', 'Valla', 'Varian', 'Whitemane', 'Xul', 'Yrel', 'Zagara', 'Zarya', 'Zeratul', 'Zuljin'];
    const testMatches = [];

    for (let i = 0; i < actualCount; i++) {
      // 랜덤하게 10명 선택
      const shuffled = [...availableUsers].sort(() => 0.5 - Math.random());
      const selectedUsers = shuffled.slice(0, 10);

      const randomMap = maps[Math.floor(Math.random() * maps.length)];
      const randomWinner = Math.random() < 0.5 ? 'blue' : 'red';
      const gameDuration = Math.floor(Math.random() * 1200) + 600; // 10-30분

      const testMatch = {
        map: randomMap,
        gameMode: 'Storm League',
        winner: randomWinner,
        gameDuration,
        status: 'completed',
        players: selectedUsers.map((user, index) => {
          const randomHero = heroes[Math.floor(Math.random() * heroes.length)];
          const kills = Math.floor(Math.random() * 15);
          const deaths = Math.floor(Math.random() * 10) + 1; // 최소 1 데스
          const assists = Math.floor(Math.random() * 20);

          return {
            userId: user.id,
            team: index < 5 ? 0 : 1, // 0=blue, 1=red
            hero: randomHero,
            kills,
            deaths,
            assists,
            heroDamage: Math.floor(Math.random() * 80000) + 20000, // 20k-100k
            siegeDamage: Math.floor(Math.random() * 150000) + 10000, // 10k-160k
            healing: Math.floor(Math.random() * 60000), // 0-60k (힐러가 아니면 낮음)
            experience: Math.floor(Math.random() * 50000) + 10000, // 10k-60k
            mmrChange: Math.floor(Math.random() * 50) - 25 // -25 to +25
          };
        })
      };

      testMatches.push(testMatch);
    }

    // 매치 생성
    const createdMatches = [];
    for (const matchData of testMatches) {
      const match = await global.db.Match.create({
        mapName: matchData.map,
        gameMode: matchData.gameMode,
        winner: matchData.winner,
        gameDuration: matchData.gameDuration,
        status: matchData.status,
        createdBy: req.user.id,
        startedAt: new Date(Date.now() - matchData.gameDuration * 1000),
        endedAt: new Date()
      });

      // 플레이어 데이터 생성
      for (const playerData of matchData.players) {
        await global.db.MatchParticipant.create({
          matchId: match.id,
          userId: playerData.userId,
          team: playerData.team,
          hero: playerData.hero,
          kills: playerData.kills,
          deaths: playerData.deaths,
          assists: playerData.assists,
          heroDamage: playerData.heroDamage,
          siegeDamage: playerData.siegeDamage,
          healing: playerData.healing,
          experience: playerData.experience,
          mmrChange: playerData.mmrChange
        });
      }

      createdMatches.push(match);
    }

    logger.info('테스트 매치 생성 완료:', {
      adminId: req.user.id,
      createdCount: createdMatches.length,
      requestedCount: actualCount
    });

    res.json({
      message: `${createdMatches.length}개의 테스트 매치가 생성되었습니다.`,
      createdCount: createdMatches.length,
      matches: createdMatches.map(match => ({
        id: match.id,
        _id: match.id,
        matchId: match.id,
        map: match.mapName,
        winner: match.winner
      }))
    });

  } catch (err) {
    logger.error('테스트 매치 생성 오류:', {
      error: err.message,
      stack: err.stack,
      adminId: req.user?.id
    });
    res.status(500).json({
      error: '테스트 매치 생성 중 오류가 발생했습니다.',
      message: process.env.NODE_ENV === 'development' ? err.message : '서버 오류가 발생했습니다.'
    });
  }
});

/**
 * @route   GET /api/admin/matches
 * @desc    모든 매치 목록 조회 (관리자용)
 * @access  Admin
 */
router.get('/matches', authenticate, isAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortDirection = req.query.sortDirection || 'desc';

    // 허용된 정렬 필드만 사용 (Match 모델의 실제 필드만)
    const allowedSortFields = ['id', 'mapName', 'gameMode', 'winner', 'gameDuration', 'status', 'createdAt', 'updatedAt', 'startedAt', 'endedAt'];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    // 필터 조건
    let whereClause = {};
    if (req.query.status) {
      whereClause.status = req.query.status;
    }
    if (req.query.map) {
      whereClause.mapName = { [Op.iLike]: `%${req.query.map}%` };
    }
    if (req.query.startDate && req.query.endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(req.query.startDate), new Date(req.query.endDate)]
      };
    }

    logger.info('관리자 매치 목록 조회 요청:', {
      adminId: req.user.id,
      page,
      limit,
      sortBy: validSortBy,
      sortDirection,
      filters: whereClause
    });

    const { count, rows: matches } = await global.db.Match.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: global.db.MatchParticipant,
          as: 'participants',
          include: [
            {
              model: global.db.User,
              as: 'user',
              attributes: ['id', 'battleTag', 'nickname']
            }
          ]
        }
      ],
      order: [[validSortBy, sortDirection.toUpperCase()]],
      limit,
      offset
    });

    const matchList = matches.map(match => ({
      id: match.id,
      _id: match.id,
      matchId: match.id,
      map: match.mapName,
      gameMode: match.gameMode,
      winner: match.winner,
      gameDuration: match.gameDuration,
      status: match.status,
      createdAt: match.createdAt,
      updatedAt: match.updatedAt,
      playerCount: match.participants?.length || 0,
      players: match.participants?.map(participant => ({
        id: participant.id,
        userId: participant.userId,
        team: participant.team,
        hero: participant.hero,
        role: participant.role,
        kills: participant.kills || 0,
        deaths: participant.deaths || 0,
        assists: participant.assists || 0,
        heroDamage: participant.heroDamage || 0,
        siegeDamage: participant.siegeDamage || 0,
        healing: participant.healing || 0,
        experience: participant.experience || 0,
        mmrChange: participant.mmrChange || 0,
        joinedAt: participant.joinedAt,
        user: participant.user
      })) || []
    }));

    res.json({
      matches: matchList,
      pagination: {
        total: count,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        limit
      }
    });

  } catch (err) {
    logger.error('관리자 매치 목록 조회 오류:', {
      error: err.message,
      stack: err.stack,
      adminId: req.user?.id
    });
    res.status(500).json({ message: '매치 목록 조회에 실패했습니다' });
  }
});

/**
 * @route   GET /api/admin/matches/:id
 * @desc    매치 상세 조회 (관리자용)
 * @access  Admin
 */
router.get('/matches/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const matchId = req.params.id;

    logger.info('관리자 매치 상세 조회 요청:', {
      adminId: req.user.id,
      matchId
    });

    const match = await global.db.Match.findByPk(matchId, {
      include: [
        {
          model: global.db.MatchParticipant,
          as: 'participants',
          include: [
            {
              model: global.db.User,
              as: 'user',
              attributes: ['id', 'battleTag', 'nickname', 'mmr']
            }
          ]
        }
      ]
    });

    if (!match) {
      return res.status(404).json({ message: '매치를 찾을 수 없습니다' });
    }

    // 팀별로 플레이어 분류
    const redTeam = [];
    const blueTeam = [];
    let redTeamAvgMmr = 0;
    let blueTeamAvgMmr = 0;

    if (match.participants) {
      match.participants.forEach(participant => {
        const playerData = {
          id: participant.id,
          userId: participant.userId,
          battleTag: participant.user?.battleTag || 'Unknown',
          nickname: participant.user?.nickname,
          mmr: participant.user?.mmr || 1500,
          team: participant.team,
          hero: participant.hero,
          role: participant.role,
          kills: participant.kills,
          deaths: participant.deaths,
          assists: participant.assists,
          mmrChange: participant.mmrChange,
          stats: {
            kills: participant.kills || 0,
            deaths: participant.deaths || 0,
            assists: participant.assists || 0,
            heroDamage: participant.heroDamage || 0,
            siegeDamage: participant.siegeDamage || 0,
            healing: participant.healing || 0,
            experience: participant.experience || 0
          }
        };

        if (participant.team === 1) {
          redTeam.push(playerData);
        } else if (participant.team === 0) {
          blueTeam.push(playerData);
        }
      });

      // 팀 평균 MMR 계산
      if (redTeam.length > 0) {
        redTeamAvgMmr = Math.round(redTeam.reduce((sum, p) => sum + p.mmr, 0) / redTeam.length);
      }
      if (blueTeam.length > 0) {
        blueTeamAvgMmr = Math.round(blueTeam.reduce((sum, p) => sum + p.mmr, 0) / blueTeam.length);
      }
    }

    const matchData = {
      id: match.id,
      matchId: match.id,
      map: match.mapName,
      gameMode: match.gameMode,
      winner: match.winner,
      gameDuration: match.gameDuration,
      gameLength: match.gameDuration,
      status: match.status,
      createdAt: match.createdAt,
      updatedAt: match.updatedAt,
      players: match.participants?.map(participant => ({
        id: participant.id,
        userId: participant.userId,
        team: participant.team,
        hero: participant.hero,
        role: participant.role,
        kills: participant.kills || 0,
        deaths: participant.deaths || 0,
        assists: participant.assists || 0,
        heroDamage: participant.heroDamage || 0,
        siegeDamage: participant.siegeDamage || 0,
        healing: participant.healing || 0,
        experience: participant.experience || 0,
        mmrChange: participant.mmrChange || 0,
        user: participant.user
      })) || [],
      redTeam,
      blueTeam,
      redTeamAvgMmr,
      blueTeamAvgMmr,
      notes: match.notes,
      result: {
        winner: match.winner,
        gameLength: match.gameDuration
      }
    };

    logger.info('관리자 매치 상세 조회 성공:', {
      adminId: req.user.id,
      matchId,
      playerCount: match.participants?.length || 0
    });

    res.json(matchData);

  } catch (err) {
    logger.error('관리자 매치 상세 조회 오류:', {
      error: err.message,
      stack: err.stack,
      adminId: req.user?.id,
      matchId: req.params.id
    });
    res.status(500).json({ message: '매치 상세 조회에 실패했습니다' });
  }
});

/**
 * @route   PUT /api/admin/matches/:id
 * @desc    매치 정보 수정 (관리자용)
 * @access  Admin
 */
router.put('/matches/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const matchId = req.params.id;
    const { status, winner, notes } = req.body;

    logger.info('관리자 매치 수정 요청:', {
      adminId: req.user.id,
      matchId,
      updates: { status, winner, notes }
    });

    const match = await global.db.Match.findByPk(matchId);
    if (!match) {
      return res.status(404).json({ message: '매치를 찾을 수 없습니다' });
    }

    // 업데이트할 필드만 포함
    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (winner !== undefined) updateData.winner = winner;
    if (notes !== undefined) updateData.notes = notes;

    await match.update(updateData);

    logger.info('관리자 매치 수정 완료:', {
      adminId: req.user.id,
      matchId,
      updates: updateData
    });

    // 수정된 매치 정보 반환
    const updatedMatch = await global.db.Match.findByPk(matchId, {
      include: [
        {
          model: global.db.MatchParticipant,
          as: 'participants',
          include: [
            {
              model: global.db.User,
              as: 'user',
              attributes: ['id', 'battleTag', 'nickname', 'mmr']
            }
          ]
        }
      ]
    });

    res.json(updatedMatch);

  } catch (err) {
    logger.error('관리자 매치 수정 오류:', {
      error: err.message,
      stack: err.stack,
      adminId: req.user?.id,
      matchId: req.params.id
    });
    res.status(500).json({ message: '매치 수정에 실패했습니다' });
  }
});

/**
 * @route   DELETE /api/admin/matches/:id
 * @desc    매치 삭제 (관리자용)
 * @access  Admin
 */
router.delete('/matches/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const matchId = req.params.id;

    const match = await global.db.Match.findByPk(matchId);
    if (!match) {
      return res.status(404).json({ message: '매치를 찾을 수 없습니다' });
    }

    // 관련 플레이어 데이터도 함께 삭제
    await global.db.MatchParticipant.destroy({
      where: { matchId }
    });

    await match.destroy();

    logger.info('관리자가 매치 삭제:', {
      adminId: req.user.id,
      matchId,
      map: match.mapName
    });

    res.json({
      success: true,
      message: '매치가 성공적으로 삭제되었습니다'
    });

  } catch (err) {
    logger.error('관리자 매치 삭제 오류:', {
      error: err.message,
      stack: err.stack,
      adminId: req.user?.id,
      matchId: req.params.id
    });
    res.status(500).json({ message: '매치 삭제에 실패했습니다' });
  }
});

/**
 * @route   POST /api/admin/matches/:id/invalidate
 * @desc    매치 무효화 (관리자용)
 * @access  Admin
 */
router.post('/matches/:id/invalidate', authenticate, isAdmin, async (req, res) => {
  try {
    const matchId = req.params.id;

    const match = await global.db.Match.findByPk(matchId);
    if (!match) {
      return res.status(404).json({ message: '매치를 찾을 수 없습니다' });
    }

    await match.update({ status: 'invalidated' });

    logger.info('관리자가 매치 무효화:', {
      adminId: req.user.id,
      matchId,
      map: match.mapName
    });

    res.json({
      success: true,
      message: '매치가 성공적으로 무효화되었습니다'
    });

  } catch (err) {
    logger.error('관리자 매치 무효화 오류:', {
      error: err.message,
      stack: err.stack,
      adminId: req.user?.id,
      matchId: req.params.id
    });
    res.status(500).json({ message: '매치 무효화에 실패했습니다' });
  }
});

/**
 * @route   DELETE /api/admin/delete-all-users
 * @desc    모든 사용자 삭제 (관리자 제외)
 * @access  Admin
 */
router.delete('/delete-all-users', authenticate, isAdmin, async (req, res) => {
  try {
    logger.info('모든 사용자 삭제 요청:', {
      adminId: req.user.id
    });

    // 관리자가 아닌 모든 사용자 삭제
    const deletedCount = await global.db.User.destroy({
      where: {
        role: {
          [Op.ne]: 'admin'
        }
      }
    });

    logger.info('사용자 삭제 완료:', {
      adminId: req.user.id,
      deletedCount
    });

    res.json({
      success: true,
      message: `${deletedCount}명의 사용자가 삭제되었습니다. (관리자 제외)`,
      deletedCount
    });

  } catch (err) {
    logger.error('모든 사용자 삭제 오류:', {
      error: err.message,
      stack: err.stack,
      adminId: req.user?.id
    });
    res.status(500).json({
      error: '사용자 삭제 중 오류가 발생했습니다.',
      message: process.env.NODE_ENV === 'development' ? err.message : '서버 오류가 발생했습니다.'
    });
  }
});

/**
 * @route   DELETE /api/admin/delete-all-matches
 * @desc    모든 매치 삭제
 * @access  Admin
 */
router.delete('/delete-all-matches', authenticate, isAdmin, async (req, res) => {
  try {
    logger.info('모든 매치 삭제 요청:', {
      adminId: req.user.id
    });

    // 모든 매치 플레이어 데이터 먼저 삭제
    const participantDeleteResult = await global.db.MatchParticipant.destroy({
      where: {},
      force: true // 강제 삭제
    });

    // 모든 매치 삭제
    const matchDeleteResult = await global.db.Match.destroy({
      where: {},
      force: true // 강제 삭제
    });

    logger.info('매치 삭제 완료:', {
      adminId: req.user.id,
      deletedParticipants: participantDeleteResult,
      deletedMatches: matchDeleteResult
    });

    res.json({
      success: true,
      message: `모든 매치 데이터가 삭제되었습니다. (매치: ${matchDeleteResult}개, 참가자: ${participantDeleteResult}개)`,
      deletedMatches: matchDeleteResult,
      deletedParticipants: participantDeleteResult
    });

  } catch (err) {
    logger.error('모든 매치 삭제 오류:', {
      error: err.message,
      stack: err.stack,
      adminId: req.user?.id
    });
    res.status(500).json({
      error: '매치 삭제 중 오류가 발생했습니다.',
      message: process.env.NODE_ENV === 'development' ? err.message : '서버 오류가 발생했습니다.'
    });
  }
});

/**
 * @route   POST /api/admin/users/delete
 * @desc    다중 사용자 삭제
 * @access  Admin
 */
router.post('/users/delete', authenticate, isAdmin, async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: '삭제할 사용자 ID가 필요합니다.' });
    }

    logger.info('다중 사용자 삭제 요청:', {
      adminId: req.user.id,
      userIds,
      count: userIds.length
    });

    // 관리자 계정은 삭제하지 않도록 필터링
    const usersToDelete = await global.db.User.findAll({
      where: {
        id: {
          [Op.in]: userIds
        },
        role: {
          [Op.ne]: 'admin'
        }
      }
    });

    const deletedCount = await global.db.User.destroy({
      where: {
        id: {
          [Op.in]: usersToDelete.map(user => user.id)
        }
      }
    });

    logger.info('다중 사용자 삭제 완료:', {
      adminId: req.user.id,
      requestedCount: userIds.length,
      deletedCount
    });

    res.json({
      success: true,
      message: `${deletedCount}명의 사용자가 삭제되었습니다.`,
      deletedCount
    });

  } catch (err) {
    logger.error('다중 사용자 삭제 오류:', {
      error: err.message,
      stack: err.stack,
      adminId: req.user?.id
    });
    res.status(500).json({
      error: '사용자 삭제 중 오류가 발생했습니다.',
      message: process.env.NODE_ENV === 'development' ? err.message : '서버 오류가 발생했습니다.'
    });
  }
});

/**
 * @route   POST /api/admin/matches/delete
 * @desc    다중 매치 삭제
 * @access  Admin
 */
router.post('/matches/delete', authenticate, isAdmin, async (req, res) => {
  try {
    const { matchIds } = req.body;

    if (!matchIds || !Array.isArray(matchIds) || matchIds.length === 0) {
      return res.status(400).json({ message: '삭제할 매치 ID가 필요합니다.' });
    }

    logger.info('다중 매치 삭제 요청:', {
      adminId: req.user.id,
      matchIds,
      count: matchIds.length
    });

    // 관련 플레이어 데이터 먼저 삭제
    await global.db.MatchParticipant.destroy({
      where: {
        matchId: {
          [Op.in]: matchIds
        }
      }
    });

    // 매치 삭제
    const deletedCount = await global.db.Match.destroy({
      where: {
        id: {
          [Op.in]: matchIds
        }
      }
    });

    logger.info('다중 매치 삭제 완료:', {
      adminId: req.user.id,
      requestedCount: matchIds.length,
      deletedCount
    });

    res.json({
      success: true,
      message: `${deletedCount}개의 매치가 삭제되었습니다.`,
      deletedCount
    });

  } catch (err) {
    logger.error('다중 매치 삭제 오류:', {
      error: err.message,
      stack: err.stack,
      adminId: req.user?.id
    });
    res.status(500).json({
      error: '매치 삭제 중 오류가 발생했습니다.',
      message: process.env.NODE_ENV === 'development' ? err.message : '서버 오류가 발생했습니다.'
    });
  }
});

/**
 * @route   POST /api/admin/matches/invalidate
 * @desc    다중 매치 무효화
 * @access  Admin
 */
router.post('/matches/invalidate', authenticate, isAdmin, async (req, res) => {
  try {
    const { matchIds } = req.body;

    if (!matchIds || !Array.isArray(matchIds) || matchIds.length === 0) {
      return res.status(400).json({ message: '무효화할 매치 ID가 필요합니다.' });
    }

    logger.info('다중 매치 무효화 요청:', {
      adminId: req.user.id,
      matchIds,
      count: matchIds.length
    });

    const updatedCount = await global.db.Match.update(
      { status: 'invalidated' },
      {
        where: {
          id: {
            [Op.in]: matchIds
          }
        }
      }
    );

    logger.info('다중 매치 무효화 완료:', {
      adminId: req.user.id,
      requestedCount: matchIds.length,
      updatedCount: updatedCount[0]
    });

    res.json({
      success: true,
      message: `${updatedCount[0]}개의 매치가 무효화되었습니다.`,
      updatedCount: updatedCount[0]
    });

  } catch (err) {
    logger.error('다중 매치 무효화 오류:', {
      error: err.message,
      stack: err.stack,
      adminId: req.user?.id
    });
    res.status(500).json({
      error: '매치 무효화 중 오류가 발생했습니다.',
      message: process.env.NODE_ENV === 'development' ? err.message : '서버 오류가 발생했습니다.'
    });
  }
});

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    개별 사용자 삭제 (관리자용)
 * @access  Admin
 */
router.delete('/users/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const userId = req.params.id;

    logger.info('개별 사용자 삭제 요청:', {
      adminId: req.user.id,
      targetUserId: userId
    });

    // 삭제할 사용자 조회
    const userToDelete = await global.db.User.findByPk(userId);

    if (!userToDelete) {
      return res.status(404).json({
        success: false,
        message: '삭제할 사용자를 찾을 수 없습니다.'
      });
    }

    // 관리자 계정은 삭제하지 않도록 보호
    if (userToDelete.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: '관리자 계정은 삭제할 수 없습니다.'
      });
    }

    // 자기 자신은 삭제할 수 없도록 보호
    if (userToDelete.id === req.user.id) {
      return res.status(403).json({
        success: false,
        message: '자기 자신의 계정은 삭제할 수 없습니다.'
      });
    }

    // 관련 데이터 정리 (외래키 제약 조건 때문에)
    try {
      // 매치 참가자 데이터 삭제
      if (global.db.MatchParticipant) {
        await global.db.MatchParticipant.destroy({
          where: { userId: userId }
        });
      }

      // 매치메이킹 대기열에서 제거
      if (global.db.MatchmakingQueue) {
        await global.db.MatchmakingQueue.destroy({
          where: { userId: userId }
        });
      }

      // 사용자 로그 삭제
      if (global.db.UserLog) {
        await global.db.UserLog.destroy({
          where: { userId: userId }
        });
      }

      // 사용자가 생성한 매치들의 생성자 정보 정리
      if (global.db.Match) {
        await global.db.Match.update(
          { createdBy: null },
          { where: { createdBy: userId } }
        );
      }
    } catch (cleanupErr) {
      logger.warn('사용자 관련 데이터 정리 중 일부 오류:', cleanupErr);
    }

    // 사용자 삭제
    await userToDelete.destroy();

    logger.info('개별 사용자 삭제 완료:', {
      adminId: req.user.id,
      deletedUserId: userId,
      deletedUserBattleTag: userToDelete.battleTag
    });

    res.json({
      success: true,
      message: `사용자 ${userToDelete.battleTag}가 성공적으로 삭제되었습니다.`,
      deletedUser: {
        id: userToDelete.id,
        battleTag: userToDelete.battleTag,
        nickname: userToDelete.nickname
      }
    });

  } catch (err) {
    logger.error('개별 사용자 삭제 오류:', {
      error: err.message,
      stack: err.stack,
      adminId: req.user?.id,
      targetUserId: req.params.id
    });
    res.status(500).json({
      success: false,
      error: '사용자 삭제 중 오류가 발생했습니다.',
      message: process.env.NODE_ENV === 'development' ? err.message : '서버 오류가 발생했습니다.'
    });
  }
});

module.exports = router;
