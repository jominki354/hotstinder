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

    const user = await global.db.User.findByPk(decoded.id);
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

/**
 * @route   POST /api/matchmaking/join
 * @desc    매치메이킹 대기열 참가
 * @access  Private
 */
router.post('/join', authenticate, async (req, res) => {
  try {
    const { preferredRole, gameMode } = req.body;

      // 이미 대기열에 있는지 확인
    const existingQueue = await global.db.MatchmakingQueue.findOne({
      where: { userId: req.user.id }
    });

    if (existingQueue) {
      return res.status(400).json({
        message: '이미 매치메이킹 대기열에 참가하고 있습니다',
        queueEntry: existingQueue
      });
    }

    // 진행 중인 매치가 있는지 확인
    const activeMatch = await global.db.MatchParticipant.findOne({
      where: { userId: req.user.id },
      include: [{
        model: global.db.Match,
        as: 'match',
        where: {
          status: {
            [Op.in]: ['waiting', 'ready', 'in_progress']
          }
        }
      }]
    });

    if (activeMatch) {
      return res.status(400).json({
        message: '이미 진행 중인 매치가 있습니다',
        matchId: activeMatch.match.id
      });
    }

    // 대기열에 추가
    const queueEntry = await global.db.MatchmakingQueue.create({
      userId: req.user.id,
      preferredRole: preferredRole || null,
      gameMode: gameMode || 'Storm League',
      mmr: req.user.mmr,
      queueTime: new Date(),
      status: 'waiting'
    });

    // 로그 기록
    try {
      if (global.db && global.db.UserLog) {
        await global.db.UserLog.create({
          userId: req.user.id,
          action: 'matchmaking_joined',
          details: {
            preferredRole,
            gameMode,
            mmr: req.user.mmr
          },
          ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
          userAgent: req.headers['user-agent']
        });
      }
    } catch (logErr) {
      logger.error('매치메이킹 참가 로그 기록 오류:', logErr);
    }

    // 매치메이킹 시도
    setTimeout(() => {
      tryMatchmaking(req.user.id);
    }, 1000);

    logger.info('매치메이킹 대기열 참가:', {
      userId: req.user.id,
      battleTag: req.user.battleTag,
      preferredRole,
      gameMode,
      mmr: req.user.mmr
    });

    res.json({
      success: true,
      message: '매치메이킹 대기열에 참가했습니다',
      queueEntry: {
        id: queueEntry.id,
        preferredRole: queueEntry.preferredRole,
        gameMode: queueEntry.gameMode,
        queueTime: queueEntry.queueTime,
        status: queueEntry.status
      }
    });

  } catch (err) {
    logger.error('매치메이킹 참가 오류:', err);
    res.status(500).json({ message: '매치메이킹 참가에 실패했습니다' });
  }
});

/**
 * @route   POST /api/matchmaking/leave
 * @desc    매치메이킹 대기열 나가기
 * @access  Private
 */
router.post('/leave', authenticate, async (req, res) => {
  try {
    const queueEntry = await global.db.MatchmakingQueue.findOne({
      where: { userId: req.user.id }
    });

    if (!queueEntry) {
      return res.status(400).json({ message: '매치메이킹 대기열에 참가하고 있지 않습니다' });
    }

    // 대기열에서 제거
    await queueEntry.destroy();

    // 로그 기록
    try {
      if (global.db && global.db.UserLog) {
        await global.db.UserLog.create({
          userId: req.user.id,
          action: 'matchmaking_left',
          details: {
            queueTime: queueEntry.queueTime,
            waitTime: Date.now() - new Date(queueEntry.queueTime).getTime()
          },
          ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
          userAgent: req.headers['user-agent']
        });
      }
    } catch (logErr) {
      logger.error('매치메이킹 나가기 로그 기록 오류:', logErr);
    }

    logger.info('매치메이킹 대기열 나가기:', {
      userId: req.user.id,
      battleTag: req.user.battleTag
    });

    res.json({
      success: true,
      message: '매치메이킹 대기열에서 나갔습니다'
    });

  } catch (err) {
    logger.error('매치메이킹 나가기 오류:', err);
    res.status(500).json({ message: '매치메이킹 나가기에 실패했습니다' });
  }
});

/**
 * @route   GET /api/matchmaking/status
 * @desc    매치메이킹 상태 조회
 * @access  Private
 */
router.get('/status', authenticate, async (req, res) => {
  try {
    // 사용자의 대기열 상태 확인
    const queueEntry = await global.db.MatchmakingQueue.findOne({
      where: { userId: req.user.id }
    });

    if (!queueEntry) {
      return res.json({
        inQueue: false,
        currentPlayers: 0,
        requiredPlayers: 10,
        estimatedTime: '00:00'
      });
    }

    // 전체 대기열 인원 수 조회
    const totalInQueue = await global.db.MatchmakingQueue.count({
      where: {
        gameMode: queueEntry.gameMode,
        status: 'waiting'
      }
    });

    // 대기 시간 계산
    const waitTime = Date.now() - new Date(queueEntry.queueTime).getTime();
    const waitMinutes = Math.floor(waitTime / 60000);
    const waitSeconds = Math.floor((waitTime % 60000) / 1000);
    const formattedWaitTime = `${waitMinutes.toString().padStart(2, '0')}:${waitSeconds.toString().padStart(2, '0')}`;

    // 예상 대기 시간 계산 (간단한 추정)
    const estimatedMinutes = Math.max(0, Math.ceil((10 - totalInQueue) * 0.5));
    const estimatedTime = `${estimatedMinutes.toString().padStart(2, '0')}:00`;

    res.json({
      inQueue: true,
      currentPlayers: totalInQueue,
      requiredPlayers: 10,
      estimatedTime: estimatedTime,
      waitTime: formattedWaitTime,
      queueEntry: {
        id: queueEntry.id,
        preferredRole: queueEntry.preferredRole,
        gameMode: queueEntry.gameMode,
        queueTime: queueEntry.queueTime,
        status: queueEntry.status
      }
    });

  } catch (err) {
    logger.error('매치메이킹 상태 조회 오류:', err);
    res.status(500).json({ message: '매치메이킹 상태 조회에 실패했습니다' });
  }
});

/**
 * 매치메이킹 로직
 */
async function tryMatchmaking(userId) {
  try {
    // 대기열에서 10명 찾기
    const queueEntries = await global.db.MatchmakingQueue.findAll({
      where: { status: 'waiting' },
      include: [{
        model: global.db.User,
        as: 'user',
        attributes: ['id', 'battleTag', 'mmr']
      }],
      order: [['queueTime', 'ASC']],
      limit: 10
    });

    if (queueEntries.length >= 10) {
      logger.info('매치메이킹 성공: 10명 모집 완료');

      // 새 매치 생성
      const match = await global.db.Match.create({
        gameMode: queueEntries[0].gameMode,
        mapName: '랜덤',
        maxPlayers: 10,
        currentPlayers: 10,
        createdBy: queueEntries[0].userId,
        status: 'ready',
        averageMmr: Math.round(queueEntries.reduce((sum, entry) => sum + entry.user.mmr, 0) / 10)
      });

      // 참가자 추가
      const participants = queueEntries.map(entry => ({
        matchId: match.id,
        userId: entry.userId,
        role: entry.preferredRole,
        joinedAt: new Date()
      }));

      await global.db.MatchParticipant.bulkCreate(participants);

      // 대기열에서 제거
      const userIds = queueEntries.map(entry => entry.userId);
      await global.db.MatchmakingQueue.destroy({
        where: {
          userId: {
            [Op.in]: userIds
          }
        }
      });

      logger.info('매치 생성 완료:', {
        matchId: match.id,
        participants: userIds.length,
        averageMmr: match.averageMmr
      });

      // TODO: 실시간으로 클라이언트에 매치 찾음 알림 (WebSocket)
    }

  } catch (err) {
    logger.error('매치메이킹 처리 오류:', err);
  }
}

module.exports = router;
