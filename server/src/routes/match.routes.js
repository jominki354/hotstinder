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
      _id: match.id,
      status: match.status,
      gameMode: match.gameMode,
      mapName: match.mapName,
      maxPlayers: match.maxPlayers,
      currentPlayers: match.currentPlayers,
      averageMmr: match.averageMmr,
      creator: match.creator ? {
        id: match.creator.id,
        _id: match.creator.id,
        battleTag: match.creator.battleTag,
        battletag: match.creator.battleTag,
        nickname: match.creator.nickname
      } : null,
      participants: match.participants ? match.participants.map(p => ({
        id: p.id,
        _id: p.id,
        userId: p.userId,
        user: p.user ? {
          id: p.user.id,
          _id: p.user.id,
          battleTag: p.user.battleTag,
          battletag: p.user.battleTag,
          nickname: p.user.nickname,
          mmr: p.user.mmr
        } : null
      })) : [],
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

/**
 * @route   POST /api/matches/:id/complete
 * @desc    매치 완료
 * @access  Private
 */
router.post('/:id/complete', authenticate, async (req, res) => {
  try {
    const matchId = req.params.id;
    const { replayData, winningTeam, gameLength, playerStats, isSimulation } = req.body;

    logger.info('[매치 완료] 요청 수신:', {
      matchId,
      winningTeam,
      gameLength,
      playerStatsCount: playerStats?.length || 0,
      isSimulation
    });

    // 받은 플레이어 통계 상세 로깅
    if (playerStats && Array.isArray(playerStats)) {
      logger.info('[매치 완료] 받은 플레이어 통계 상세:', {
        totalPlayers: playerStats.length,
        blueTeamCount: playerStats.filter(p => p.team === 'blue').length,
        redTeamCount: playerStats.filter(p => p.team === 'red').length,
        playersWithStats: playerStats.map(p => ({
          battletag: p.battletag,
          team: p.team,
          hero: p.hero,
          kills: p.kills,
          deaths: p.deaths,
          assists: p.assists,
          heroDamage: p.heroDamage,
          siegeDamage: p.siegeDamage,
          healing: p.healing,
          experience: p.experienceContribution,
          hasNonZeroStats: (p.kills > 0 || p.deaths > 0 || p.assists > 0 || p.heroDamage > 0 || p.siegeDamage > 0 || p.healing > 0)
        }))
      });

      // 실제 통계가 있는지 확인
      const playersWithRealStats = playerStats.filter(p =>
        p.kills > 0 || p.deaths > 0 || p.assists > 0 ||
        p.heroDamage > 0 || p.siegeDamage > 0 || p.healing > 0
      );

      logger.info('[매치 완료] 실제 통계 분석:', {
        totalPlayers: playerStats.length,
        playersWithRealStats: playersWithRealStats.length,
        hasRealStats: playersWithRealStats.length > 0,
        statsBreakdown: {
          totalKills: playerStats.reduce((sum, p) => sum + (p.kills || 0), 0),
          totalDeaths: playerStats.reduce((sum, p) => sum + (p.deaths || 0), 0),
          totalAssists: playerStats.reduce((sum, p) => sum + (p.assists || 0), 0),
          totalHeroDamage: playerStats.reduce((sum, p) => sum + (p.heroDamage || 0), 0),
          totalSiegeDamage: playerStats.reduce((sum, p) => sum + (p.siegeDamage || 0), 0),
          totalHealing: playerStats.reduce((sum, p) => sum + (p.healing || 0), 0)
        }
      });
    } else {
      logger.warn('[매치 완료] 플레이어 통계가 없거나 배열이 아님:', typeof playerStats);
    }

    // 시뮬레이션 매치 여부 확인 (ID 패턴으로 판단)
    const isSimulationMatch = isSimulation || matchId.includes('dev_') || matchId.includes('sim_');

    let match;

    if (isSimulationMatch) {
      // 시뮬레이션 매치인 경우 새로 생성하여 저장
      logger.info('[매치 완료] 시뮬레이션 매치 생성 및 저장');

      // 리플레이 데이터에서 맵 이름 추출
      const mapName = replayData?.basic?.mapName || '알 수 없음';

      match = await global.db.Match.create({
        gameMode: '시뮬레이션',
        mapName: mapName,
        maxPlayers: 10,
        currentPlayers: 10,
        createdBy: req.user.id,
        status: 'completed',
        winner: winningTeam,
        gameDuration: Math.round(gameLength || 0),
        startedAt: new Date(),
        endedAt: new Date(),
        notes: `시뮬레이션 매치 (원본 ID: ${matchId})`
      });

      logger.info('[매치 완료] 시뮬레이션 매치 DB 저장 완료:', match.id);
    } else {
      // 실제 매치인 경우 데이터베이스에서 조회
      match = await global.db.Match.findByPk(matchId);
      if (!match) {
        logger.error('[매치 완료] 매치를 찾을 수 없음:', matchId);
        return res.status(404).json({ success: false, error: '매치를 찾을 수 없습니다' });
      }

      // 매치 완료 처리
      const updateData = {
        status: 'completed',
        winner: winningTeam,
        gameDuration: Math.round(gameLength || 0),
        endedAt: new Date()
      };

      if (!match.startedAt) {
        updateData.startedAt = new Date();
      }

      await match.update(updateData);
      logger.info('[매치 완료] 실제 매치 상태 업데이트 완료');
    }

    // 플레이어 통계 저장 (모든 매치)
    if (playerStats && Array.isArray(playerStats)) {
      logger.info('[매치 완료] 플레이어 통계 저장 시작:', {
        playerStatsCount: playerStats.length,
        samplePlayerStat: playerStats[0]
      });

      for (const playerStat of playerStats) {
        try {
          logger.info(`[매치 완료] 플레이어 처리 중: ${playerStat.battletag} (팀: ${playerStat.team})`);
          logger.info(`[매치 완료] 플레이어 통계 상세: K:${playerStat.kills} D:${playerStat.deaths} A:${playerStat.assists} HD:${playerStat.heroDamage} SD:${playerStat.siegeDamage} H:${playerStat.healing}`);

          // 사용자 조회 개선 (배틀태그와 플레이어 이름으로 모두 시도)
          let user = null;
          if (playerStat.battletag && !playerStat.battletag.startsWith('blue_') && !playerStat.battletag.startsWith('red_')) {
            // 1. 정확한 배틀태그로 먼저 시도
            user = await global.db.User.findOne({
              where: {
                battleTag: playerStat.battletag
              }
            });

            // 2. 배틀태그로 찾지 못한 경우, 배틀태그의 이름 부분만으로 시도
            if (!user && playerStat.battletag.includes('#')) {
              const playerName = playerStat.battletag.split('#')[0];
              user = await global.db.User.findOne({
                where: {
                  battleTag: {
                    [Op.like]: `${playerName}#%`
                  }
                }
              });
            }

            // 3. 여전히 찾지 못한 경우, 플레이어 이름으로 시도 (닉네임 포함)
            if (!user) {
              const playerName = playerStat.battletag.includes('#')
                ? playerStat.battletag.split('#')[0]
                : playerStat.battletag;

              user = await global.db.User.findOne({
                where: {
                  [Op.or]: [
                    { nickname: playerName },
                    { battleTag: { [Op.like]: `${playerName}#%` } }
                  ]
                }
              });
            }

            if (user) {
              logger.info(`[매치 완료] 사용자 매칭 성공: ${playerStat.battletag} → ${user.battleTag} (${user.id})`);
            } else {
              logger.warn(`[매치 완료] 사용자 매칭 실패: ${playerStat.battletag}`);
            }
          }

          // MatchParticipant 생성 데이터 준비
          const participantData = {
            matchId: match.id,
            userId: user?.id || null,
            playerBattleTag: playerStat.battletag, // DB에 없는 사용자를 위한 배틀태그 저장
            team: playerStat.team,
            hero: playerStat.hero,
            kills: playerStat.kills || 0,
            deaths: playerStat.deaths || 0,
            assists: playerStat.assists || 0,
            heroDamage: playerStat.heroDamage || 0,
            siegeDamage: playerStat.siegeDamage || 0,
            healing: playerStat.healing || 0,
            experience: playerStat.experienceContribution || 0,
            mmrChange: 0
          };

          logger.info(`[매치 완료] MatchParticipant 생성 데이터:`, participantData);

          // MatchParticipant 생성 (모든 매치에 대해)
          const participant = await global.db.MatchParticipant.create(participantData);

          logger.info(`[매치 완료] MatchParticipant 생성 성공: ID ${participant.id}`);

          // 사용자 승/패 기록 업데이트 (실제 매치만)
          if (user && !isSimulationMatch) {
            const isWinner = playerStat.team === winningTeam;
            const updateUserData = {};

            if (isWinner) {
              updateUserData.wins = (user.wins || 0) + 1;
            } else {
              updateUserData.losses = (user.losses || 0) + 1;
            }

            await user.update(updateUserData);
            logger.info(`[매치 완료] 사용자 ${user.battleTag} 통계 업데이트: ${isWinner ? '승리' : '패배'}`);
          } else if (user && isSimulationMatch) {
            logger.info(`[매치 완료] 시뮬레이션 매치 - 사용자 ${user.battleTag} 개인 통계 업데이트 생략`);
          }

        } catch (playerError) {
          logger.error('[매치 완료] 플레이어 통계 저장 오류:', {
            playerStat,
            error: playerError.message,
            stack: playerError.stack
          });
          // 개별 플레이어 오류는 전체 프로세스를 중단하지 않음
        }
      }

      logger.info('[매치 완료] 플레이어 통계 저장 완료');
    } else {
      logger.info('[매치 완료] 플레이어 통계 없음');
    }

    // 로그 기록 (모든 매치)
    try {
      if (global.db && global.db.UserLog) {
        await global.db.UserLog.create({
          userId: req.user.id,
          action: 'match_completed',
          details: {
            matchId: match.id,
            originalMatchId: isSimulationMatch ? matchId : match.id,
            winner: winningTeam,
            gameDuration: Math.round(gameLength || 0),
            isSimulation: isSimulationMatch
          },
          ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
          userAgent: req.headers['user-agent']
        });
      }
    } catch (logErr) {
      logger.error('매치 완료 로그 기록 오류:', logErr);
    }

    res.json({
      success: true,
      message: isSimulationMatch ? '시뮬레이션 매치가 완료되고 기록되었습니다' : '매치가 완료되었습니다',
      data: {
        matchId: match.id,
        originalMatchId: isSimulationMatch ? matchId : match.id,
        status: 'completed',
        winner: winningTeam,
        gameDuration: Math.round(gameLength || 0),
        isSimulation: isSimulationMatch
      }
    });

  } catch (error) {
    logger.error('[매치 완료] 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
