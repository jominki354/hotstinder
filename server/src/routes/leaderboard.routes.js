const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

/**
 * @route   GET /api/leaderboard
 * @desc    리더보드 조회
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);

    logger.debug('리더보드 조회 요청:', { limit });

    if (!global.db || !global.db.User) {
      logger.error('데이터베이스가 초기화되지 않았습니다');
      return res.status(500).json({ message: '데이터베이스 연결 오류' });
    }

    const users = await global.db.User.findAll({
      attributes: [
        'id',
        'battleTag',
        'nickname',
        'mmr',
        'wins',
        'losses',
        'previousTier'
      ],
      order: [['mmr', 'DESC']],
      limit
    });

    logger.debug(`리더보드용 사용자 ${users.length}명 조회됨`);

    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      id: user.id,
      battletag: user.battleTag,
      nickname: user.nickname,
      mmr: user.mmr || 0,
      wins: user.wins || 0,
      losses: user.losses || 0,
      winRate: user.wins > 0 ? ((user.wins / (user.wins + user.losses)) * 100).toFixed(1) : '0.0',
      tier: user.previousTier || 'Unranked'
    }));

    logger.info(`리더보드 조회 성공: ${leaderboard.length}명`);

    res.json(leaderboard);
  } catch (err) {
    logger.error('리더보드 조회 오류:', {
      error: err.message,
      stack: err.stack
    });
    res.status(500).json({
      message: '리더보드 데이터를 가져오는데 실패했습니다.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

module.exports = router;
