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
 * @route   GET /api/matches
 * @desc    매치 목록 조회
 * @access  Private
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status || 'all';

    let whereClause = {};
    if (status !== 'all') {
      whereClause.status = status;
    }

    const { count, rows: matches } = await global.db.Match.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: global.db.User,
          as: 'creator',
          attributes: ['id', 'battleTag', 'nickname']
        },
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
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    const matchList = matches.map(match => ({
      id: match.id,
      status: match.status,
      gameMode: match.gameMode,
      mapName: match.mapName,
      maxPlayers: match.maxPlayers,
      currentPlayers: match.currentPlayers,
      averageMmr: match.averageMmr,
      creator: match.creator,
      participants: match.participants,
      createdAt: match.createdAt,
      startedAt: match.startedAt,
      endedAt: match.endedAt
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
    logger.error('매치 목록 조회 오류:', err);
    res.status(500).json({ message: '매치 목록 조회에 실패했습니다' });
  }
});

/**
 * @route   POST /api/matches
 * @desc    새 매치 생성
 * @access  Private
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { gameMode, mapName, maxPlayers = 10 } = req.body;

    // 입력 검증
    if (!gameMode) {
      return res.status(400).json({ message: '게임 모드는 필수입니다' });
    }

    // 새 매치 생성
    const match = await global.db.Match.create({
      gameMode,
      mapName: mapName || '랜덤',
      maxPlayers,
      currentPlayers: 1,
      createdBy: req.user.id,
      status: 'waiting'
    });

    // 매치 생성자를 첫 번째 참가자로 추가
    await global.db.MatchParticipant.create({
      matchId: match.id,
      userId: req.user.id,
      joinedAt: new Date()
    });

    // 생성된 매치 정보 조회 (관계 포함)
    const createdMatch = await global.db.Match.findByPk(match.id, {
      include: [
        {
          model: global.db.User,
          as: 'creator',
          attributes: ['id', 'battleTag', 'nickname']
        },
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

    // 로그 기록
    try {
      if (global.db && global.db.UserLog) {
        await global.db.UserLog.create({
          userId: req.user.id,
          action: 'match_created',
          details: {
            matchId: match.id,
            gameMode,
            mapName,
            maxPlayers
          },
          ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
          userAgent: req.headers['user-agent']
        });
      }
    } catch (logErr) {
      logger.error('매치 생성 로그 기록 오류:', logErr);
    }

    logger.info('새 매치 생성됨:', {
      matchId: match.id,
      createdBy: req.user.battleTag,
      gameMode,
      mapName
    });

    res.status(201).json({
      success: true,
      message: '매치가 성공적으로 생성되었습니다',
      match: createdMatch
    });

  } catch (err) {
    logger.error('매치 생성 오류:', err);
    res.status(500).json({ message: '매치 생성에 실패했습니다' });
  }
});

/**
 * @route   GET /api/matches/:id
 * @desc    특정 매치 정보 조회
 * @access  Private
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const matchId = req.params.id;

    const match = await global.db.Match.findByPk(matchId, {
      include: [
        {
          model: global.db.User,
          as: 'creator',
          attributes: ['id', 'battleTag', 'nickname']
        },
        {
          model: global.db.MatchParticipant,
          as: 'participants',
          include: [
            {
              model: global.db.User,
              as: 'user',
              attributes: ['id', 'battleTag', 'nickname', 'mmr', 'preferredRoles']
            }
          ]
        }
      ]
    });

    if (!match) {
      return res.status(404).json({ message: '매치를 찾을 수 없습니다' });
    }

    res.json({
      success: true,
      match
    });

  } catch (err) {
    logger.error('매치 조회 오류:', err);
    res.status(500).json({ message: '매치 정보 조회에 실패했습니다' });
  }
});

/**
 * @route   POST /api/matches/:id/join
 * @desc    매치 참가
 * @access  Private
 */
router.post('/:id/join', authenticate, async (req, res) => {
  try {
    const matchId = req.params.id;
    const { role, hero } = req.body;

    // 매치 조회
    const match = await global.db.Match.findByPk(matchId, {
      include: [
        {
          model: global.db.MatchParticipant,
          as: 'participants'
        }
      ]
    });

    if (!match) {
      return res.status(404).json({ message: '매치를 찾을 수 없습니다' });
    }

    // 매치 상태 확인
    if (match.status !== 'waiting') {
      return res.status(400).json({ message: '참가할 수 없는 매치입니다' });
    }

    // 이미 참가했는지 확인
    const existingParticipant = await global.db.MatchParticipant.findOne({
      where: {
        matchId: matchId,
        userId: req.user.id
      }
    });

    if (existingParticipant) {
      return res.status(400).json({ message: '이미 참가한 매치입니다' });
    }

    // 매치가 가득 찼는지 확인
    if (match.currentPlayers >= match.maxPlayers) {
      return res.status(400).json({ message: '매치가 가득 찼습니다' });
    }

    // 매치 참가
    await global.db.MatchParticipant.create({
      matchId: matchId,
      userId: req.user.id,
      role: role || null,
      hero: hero || null,
      joinedAt: new Date()
    });

    // 현재 플레이어 수 업데이트
    const newCurrentPlayers = match.currentPlayers + 1;
    await match.update({
      currentPlayers: newCurrentPlayers,
      // 매치가 가득 찼으면 상태를 'ready'로 변경
      status: newCurrentPlayers >= match.maxPlayers ? 'ready' : 'waiting'
    });

    // 로그 기록
    try {
      if (global.db && global.db.UserLog) {
        await global.db.UserLog.create({
          userId: req.user.id,
          action: 'match_joined',
          details: {
            matchId: matchId,
            role,
            hero,
            currentPlayers: newCurrentPlayers
          },
          ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
          userAgent: req.headers['user-agent']
        });
      }
    } catch (logErr) {
      logger.error('매치 참가 로그 기록 오류:', logErr);
    }

    logger.info('매치 참가:', {
      matchId,
      userId: req.user.id,
      battleTag: req.user.battleTag,
      currentPlayers: newCurrentPlayers,
      maxPlayers: match.maxPlayers
    });

    res.json({
      success: true,
      message: '매치에 성공적으로 참가했습니다',
      currentPlayers: newCurrentPlayers,
      maxPlayers: match.maxPlayers,
      status: newCurrentPlayers >= match.maxPlayers ? 'ready' : 'waiting'
    });

  } catch (err) {
    logger.error('매치 참가 오류:', err);
    res.status(500).json({ message: '매치 참가에 실패했습니다' });
  }
});

/**
 * @route   POST /api/matches/:id/leave
 * @desc    매치 나가기
 * @access  Private
 */
router.post('/:id/leave', authenticate, async (req, res) => {
  try {
    const matchId = req.params.id;

    // 매치 조회
    const match = await global.db.Match.findByPk(matchId);

    if (!match) {
      return res.status(404).json({ message: '매치를 찾을 수 없습니다' });
    }

    // 참가자 확인
    const participant = await global.db.MatchParticipant.findOne({
      where: {
        matchId: matchId,
        userId: req.user.id
      }
    });

    if (!participant) {
      return res.status(400).json({ message: '참가하지 않은 매치입니다' });
    }

    // 매치가 이미 시작되었는지 확인
    if (match.status === 'in_progress' || match.status === 'completed') {
      return res.status(400).json({ message: '진행 중이거나 완료된 매치에서는 나갈 수 없습니다' });
    }

    // 참가자 제거
    await participant.destroy();

    // 현재 플레이어 수 업데이트
    const newCurrentPlayers = Math.max(0, match.currentPlayers - 1);
    await match.update({
      currentPlayers: newCurrentPlayers,
      status: 'waiting' // 누군가 나가면 다시 대기 상태로
    });

    // 로그 기록
    try {
      if (global.db && global.db.UserLog) {
        await global.db.UserLog.create({
          userId: req.user.id,
          action: 'match_left',
          details: {
            matchId: matchId,
            currentPlayers: newCurrentPlayers
          },
          ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
          userAgent: req.headers['user-agent']
        });
      }
    } catch (logErr) {
      logger.error('매치 나가기 로그 기록 오류:', logErr);
    }

    logger.info('매치 나가기:', {
      matchId,
      userId: req.user.id,
      battleTag: req.user.battleTag,
      currentPlayers: newCurrentPlayers
    });

    res.json({
      success: true,
      message: '매치에서 성공적으로 나갔습니다',
      currentPlayers: newCurrentPlayers
    });

  } catch (err) {
    logger.error('매치 나가기 오류:', err);
    res.status(500).json({ message: '매치 나가기에 실패했습니다' });
  }
});

module.exports = router;
