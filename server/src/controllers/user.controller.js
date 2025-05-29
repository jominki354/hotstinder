const logger = require('../utils/logger');

// 유저 리스트 가져오기
exports.getAllUsers = async (req, res) => {
  try {
    const users = await global.db.User.findAll();
    if (!users) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    return res.status(200).json(users);
  } catch (error) {
    logger.error('사용자 목록 조회 중 예외 발생:', error);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

// 특정 유저 정보 가져오기
exports.getUserById = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await global.db.User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    return res.status(200).json(user);
  } catch (error) {
    logger.error(`사용자(${userId}) 조회 중 예외 발생:`, error);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

// 배틀태그로 유저 정보 가져오기
exports.getUserByBattletag = async (req, res) => {
  const { battletag } = req.params;

  try {
    const user = await global.db.User.findOne({
      where: { battleTag: battletag }
    });
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    return res.status(200).json(user);
  } catch (error) {
    logger.error(`배틀태그(${battletag}) 조회 중 예외 발생:`, error);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

// 유저 프로필 업데이트
exports.updateUserProfile = async (req, res) => {
  const { userId } = req.params;
  const updates = req.body;

  try {
    // 중요한 필드 보호
    delete updates.id;
    delete updates.bnetId;
    delete updates.battleTag;
    delete updates.role;

    const [updatedRowsCount, updatedUsers] = await global.db.User.update(
      updates,
      {
        where: { id: userId },
        returning: true
      }
    );

    if (updatedRowsCount === 0) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    return res.status(200).json(updatedUsers[0]);
  } catch (error) {
    logger.error(`사용자(${userId}) 프로필 업데이트 중 예외 발생:`, error);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

// 리더보드 데이터 가져오기
exports.getLeaderboard = async (req, res) => {
  try {
    const users = await global.db.User.findAll({
      order: [['mmr', 'DESC']],
      attributes: ['id', 'nickname', 'battleTag', 'mmr', 'wins', 'losses', 'preferredRoles']
    });

    if (!users || users.length === 0) {
      return res.status(404).json({ message: '리더보드 데이터가 없습니다.' });
    }

    // 리더보드 데이터 가공
    const leaderboard = users.map((user, index) => {
      const totalGames = (user.wins || 0) + (user.losses || 0);
      const winRate = totalGames > 0 ?
        Math.round((user.wins / totalGames) * 100 * 10) / 10 : 0;

      return {
        rank: index + 1,
        id: user.id,
        nickname: user.nickname,
        battleTag: user.battleTag,
        mmr: user.mmr || 0,
        wins: user.wins || 0,
        losses: user.losses || 0,
        winRate: winRate,
        mainRole: user.preferredRoles && user.preferredRoles.length > 0 ?
          user.preferredRoles[0] : '미지정',
        tier: getTier(user.mmr || 0),
        totalGames: totalGames
      };
    });

    return res.status(200).json(leaderboard);
  } catch (error) {
    logger.error('리더보드 데이터 조회 중 오류:', error);
    return res.status(500).json({ message: '리더보드 데이터를 가져오는 중 오류가 발생했습니다.' });
  }
};

// MMR 기반 티어 계산
function getTier(mmr) {
  if (mmr >= 2200) return '마스터';
  if (mmr >= 2000) return '다이아몬드';
  if (mmr >= 1800) return '플래티넘';
  if (mmr >= 1600) return '골드';
  if (mmr >= 1400) return '실버';
  return '브론즈';
}

// 더미 사용자 추가 (개발 및 테스트용)
exports.addDummyUsers = async (req, res) => {
  try {
    if (global.useMongoDB && global.mongoConnected) {
      // MongoDB 사용
      const dummyUsers = [
        {
          bnetId: `dummy${Date.now()}1`,
          battletag: `더미유저1#${Math.floor(1000 + Math.random() * 9000)}`,
          nickname: '더미유저1',
          mmr: 1500 + Math.floor(Math.random() * 700),
          wins: Math.floor(Math.random() * 20),
          losses: Math.floor(Math.random() * 10),
          preferredRoles: ['원거리 암살자'],
          isDummy: true
        },
        {
          bnetId: `dummy${Date.now()}2`,
          battletag: `더미유저2#${Math.floor(1000 + Math.random() * 9000)}`,
          nickname: '더미유저2',
          mmr: 1500 + Math.floor(Math.random() * 700),
          wins: Math.floor(Math.random() * 20),
          losses: Math.floor(Math.random() * 10),
          preferredRoles: ['근접 암살자'],
          isDummy: true
        }
      ];

      const createdUsers = [];
      for (const dummyUser of dummyUsers) {
        const createdUser = await global.db.users.create(dummyUser);
        createdUsers.push(createdUser);
      }

      return res.status(201).json({
        message: '더미 사용자가 추가되었습니다.',
        users: createdUsers
      });
    } else {
      // NeDB 사용
      const dummyUsers = [
        {
          _id: `dummy${Date.now()}1`,
          bnetId: `dummy${Date.now()}1`,
          battletag: `더미유저1#${Math.floor(1000 + Math.random() * 9000)}`,
          nickname: '더미유저1',
          mmr: 1500 + Math.floor(Math.random() * 700),
          wins: Math.floor(Math.random() * 20),
          losses: Math.floor(Math.random() * 10),
          preferredRoles: ['원거리 암살자'],
          isDummy: true,
          createdAt: new Date()
        },
        {
          _id: `dummy${Date.now()}2`,
          bnetId: `dummy${Date.now()}2`,
          battletag: `더미유저2#${Math.floor(1000 + Math.random() * 9000)}`,
          nickname: '더미유저2',
          mmr: 1500 + Math.floor(Math.random() * 700),
          wins: Math.floor(Math.random() * 20),
          losses: Math.floor(Math.random() * 10),
          preferredRoles: ['근접 암살자'],
          isDummy: true,
          createdAt: new Date()
        }
      ];

      // 병렬로 더미 유저 추가
      Promise.all(dummyUsers.map(user => {
        return new Promise((resolve, reject) => {
          global.db.users.insert(user, (err, newDoc) => {
            if (err) {
              logger.error(`더미 유저 추가 실패 (${user.nickname}):`, err);
              reject(err);
            } else {
              logger.info(`더미 유저 추가됨: ${user.nickname}`);
              resolve(newDoc);
            }
          });
        });
      }))
        .then(insertedUsers => {
          return res.status(201).json({
            message: '더미 사용자가 추가되었습니다.',
            users: insertedUsers
          });
        })
        .catch(error => {
          logger.error('더미 유저 추가 중 오류:', error);
          return res.status(500).json({ message: '더미 사용자 추가 중 오류가 발생했습니다.' });
        });
    }
  } catch (error) {
    logger.error('더미 유저 추가 중 예외 발생:', error);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};
