const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { Op } = require('sequelize');
const cacheService = require('../services/cacheService');

// 미들웨어: 인증 확인
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    // Authorization 헤더 검증
    if (!authHeader) {
      logger.warn('인증 실패: Authorization 헤더 없음', {
        headers: Object.keys(req.headers),
        userAgent: req.headers['user-agent']
      });
      return res.status(401).json({ message: '인증 토큰이 필요합니다' });
    }

    if (!authHeader.startsWith('Bearer ')) {
      logger.warn('인증 실패: Bearer 형식이 아님', {
        authHeader: authHeader.substring(0, 20) + '...',
        userAgent: req.headers['user-agent']
      });
      return res.status(401).json({ message: '올바른 토큰 형식이 아닙니다' });
    }

    const token = authHeader.split(' ')[1];
    
    // 토큰 기본 검증
    if (!token || token.length < 10) {
      logger.warn('인증 실패: 토큰이 너무 짧거나 없음', {
        tokenLength: token ? token.length : 0,
        tokenStart: token ? token.substring(0, 10) : 'null'
      });
      return res.status(401).json({ message: '유효하지 않은 토큰입니다' });
    }

    // JWT 토큰 검증
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      logger.warn('JWT 토큰 검증 실패', {
        error: jwtError.message,
        tokenStart: token.substring(0, 20),
        jwtSecret: process.env.JWT_SECRET ? 'exists' : 'missing'
      });
      
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ message: '토큰이 만료되었습니다' });
      } else if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: '잘못된 토큰 형식입니다' });
      } else {
        return res.status(401).json({ message: '토큰 검증에 실패했습니다' });
      }
    }

    // 데이터베이스 연결 확인
    if (!global.db || !global.db.User) {
      logger.error('데이터베이스 초기화 오류', {
        hasGlobalDb: !!global.db,
        hasUserModel: !!(global.db && global.db.User)
      });
      return res.status(500).json({ message: '데이터베이스가 초기화되지 않았습니다' });
    }

    // JWT에서 받은 ID로 사용자 찾기 (UUID 우선, bnetId fallback)
    let user = await global.db.User.findByPk(decoded.id);

    // UUID로 찾지 못한 경우 bnetId로 시도 (기존 토큰 호환성)
    if (!user && decoded.id) {
      user = await global.db.User.findOne({ where: { bnetId: decoded.id } });
      if (user) {
        logger.info('기존 bnetId 기반 토큰 사용됨', {
          bnetId: decoded.id,
          userId: user.id,
          battleTag: user.battleTag
        });
      }
    }

    if (!user) {
      logger.warn('사용자를 찾을 수 없음', {
        decodedId: decoded.id,
        decodedData: decoded
      });
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
 * @desc    매치메이킹 대기열 참가 (캐시 및 WebSocket 통합)
 * @access  Private
 */
router.post('/join', authenticate, async (req, res) => {
  logger.info('=== 서버 매치찾기 JOIN 요청 시작 ===');

  try {
    const { preferredRole, gameMode } = req.body;

    logger.info('1. 요청 데이터 파싱 완료:', {
      userId: req.user.id,
      battleTag: req.user.battleTag,
      preferredRole,
      gameMode,
      isProfileComplete: req.user.isProfileComplete,
      preferredRoles: req.user.preferredRoles,
      mmr: req.user.mmr,
      userKeys: Object.keys(req.user.dataValues || {})
    });

    logger.info('2. 프로필 완성도 검증 시작');
    // 프로필 완성도 검증 완화 - 경고만 표시하고 진행 허용
    if (!req.user.isProfileComplete) {
      logger.warn('2. 프로필 미완성 사용자의 매치찾기 시도:', {
        userId: req.user.id,
        battleTag: req.user.battleTag,
        isProfileComplete: req.user.isProfileComplete,
        nodeEnv: process.env.NODE_ENV
      });

      // 개발 환경에서는 경고만 하고 진행
      if (process.env.NODE_ENV !== 'production') {
        logger.info('2. 개발 환경: 프로필 미완성이지만 매치찾기 허용');
      } else {
        // 프로덕션에서는 여전히 차단
        logger.info('2. 프로덕션 환경: 프로필 미완성으로 차단');
        return res.status(400).json({
          message: '프로필 설정을 완료해야 매치메이킹에 참가할 수 있습니다',
          redirectTo: '/profile/setup',
          userInfo: {
            isProfileComplete: req.user.isProfileComplete,
            preferredRoles: req.user.preferredRoles,
            battleTag: req.user.battleTag
          }
        });
      }
    } else {
      logger.info('2. 프로필 완성도 검증 통과');
    }

    logger.info('3. MMR 유효성 검증 시작');
    // MMR 유효성 검증
    const userMmr = req.user.mmr || 1500;
    logger.info('3. MMR 값:', { userMmr, originalMmr: req.user.mmr });

    if (userMmr < 0 || userMmr > 5000) {
      logger.warn('3. MMR 값이 유효하지 않음:', { userMmr });
      return res.status(400).json({
        message: 'MMR 값이 유효하지 않습니다',
        currentMmr: userMmr
      });
    }
    logger.info('3. MMR 유효성 검증 통과');

    logger.info('4. 캐시에서 기존 대기열 상태 확인 시작');
    // 캐시에서 기존 대기열 상태 확인
    const cacheKey = cacheService.getQueueCacheKey(req.user.id);
    logger.info('4. 캐시 키 생성:', { cacheKey });

    const cachedQueue = await cacheService.get(cacheKey);
    logger.info('4. 캐시 조회 결과:', { hasCachedQueue: !!cachedQueue });

    if (cachedQueue) {
      const waitTime = Math.floor((Date.now() - new Date(cachedQueue.queueTime).getTime()) / 1000);
      logger.info('4. 캐시에서 기존 대기열 발견:', { waitTime, cachedQueue });
      return res.status(400).json({
        message: '이미 매치메이킹 대기열에 참가하고 있습니다',
        queueEntry: {
          ...cachedQueue,
          waitTime: waitTime
        }
      });
    }

    logger.info('5. 데이터베이스에서 기존 대기열 확인 시작');
    // 이미 대기열에 있는지 확인
    const existingQueue = await global.db.MatchmakingQueue.findOne({
      where: { userId: req.user.id }
    });
    logger.info('5. DB 대기열 조회 결과:', { hasExistingQueue: !!existingQueue });

    if (existingQueue) {
      logger.info('5. DB에서 기존 대기열 발견, 캐시에 저장');
      // 캐시에 저장
      await cacheService.set(cacheKey, existingQueue.toJSON(), 300);

      const waitTime = Math.floor((Date.now() - new Date(existingQueue.queueTime).getTime()) / 1000);
      logger.info('5. 기존 대기열 응답 준비:', { waitTime });
      return res.status(400).json({
        message: '이미 매치메이킹 대기열에 참가하고 있습니다',
        queueEntry: {
          ...existingQueue.toJSON(),
          waitTime: waitTime
        }
      });
    }

    logger.info('6. 진행 중인 매치 확인 시작');
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
    logger.info('6. 진행 중인 매치 조회 결과:', { hasActiveMatch: !!activeMatch });

    if (activeMatch) {
      logger.info('6. 진행 중인 매치 발견:', { matchId: activeMatch.match.id });
      return res.status(400).json({
        message: '이미 진행 중인 매치가 있습니다',
        matchId: activeMatch.match.id,
        redirectTo: '/match-details'
      });
    }

    logger.info('7. 대기열 크기 제한 확인 시작');
    // 대기열 크기 제한 (캐시 활용)
    const statsKey = cacheService.getMatchmakingStatsKey(gameMode || 'Storm League');
    logger.info('7. 통계 캐시 키:', { statsKey });

    let queueStats = await cacheService.get(statsKey);
    logger.info('7. 통계 캐시 조회 결과:', { hasQueueStats: !!queueStats });

    if (!queueStats) {
      logger.info('7. 통계 캐시 없음, DB에서 조회');
      const currentQueueSize = await global.db.MatchmakingQueue.count({
        where: {
          gameMode: gameMode || 'Storm League',
          status: 'waiting'
        }
      });

      queueStats = { currentQueueSize };
      await cacheService.set(statsKey, queueStats, 30); // 30초 캐시
      logger.info('7. 새로운 통계 생성 및 캐시 저장:', queueStats);
    }

    const maxQueueSize = process.env.MAX_QUEUE_SIZE || 1000;
    logger.info('7. 대기열 크기 확인:', {
      currentSize: queueStats.currentQueueSize,
      maxSize: maxQueueSize
    });

    if (queueStats.currentQueueSize >= maxQueueSize) {
      logger.warn('7. 대기열이 가득 참');
      return res.status(503).json({
        message: '현재 대기열이 가득 찼습니다. 잠시 후 다시 시도해주세요',
        currentQueueSize: queueStats.currentQueueSize,
        maxQueueSize: maxQueueSize
      });
    }

    logger.info('8. 대기열 엔트리 생성 시작');
    // 대기열에 추가
    const queueEntry = await global.db.MatchmakingQueue.create({
      userId: req.user.id,
      preferredRole: preferredRole || null,
      gameMode: gameMode || 'Storm League',
      mmr: userMmr,
      queueTime: new Date(),
      status: 'waiting'
    });
    logger.info('8. 대기열 엔트리 생성 완료:', {
      queueEntryId: queueEntry.id,
      userId: req.user.id
    });

    logger.info('9. 캐시에 대기열 엔트리 저장 시작');
    // 캐시에 저장
    await cacheService.set(cacheKey, queueEntry.toJSON(), 600); // 10분 캐시
    logger.info('9. 캐시 저장 완료');

    logger.info('10. 통계 캐시 무효화');
    // 통계 캐시 무효화
    await cacheService.del(statsKey);

    logger.info('11. 응답 데이터 준비');
    const responseData = {
      success: true,
      message: '매치메이킹 대기열에 참가했습니다',
      queueEntry: {
        id: queueEntry.id,
        preferredRole: queueEntry.preferredRole,
        gameMode: queueEntry.gameMode,
        queueTime: queueEntry.queueTime,
        status: queueEntry.status,
        estimatedWaitTime: Math.max(30, Math.ceil((10 - (queueStats.currentQueueSize % 10)) * 15))
      },
      queueInfo: {
        currentSize: queueStats.currentQueueSize + 1,
        maxSize: maxQueueSize,
        mmrRange: {
          min: Math.max(0, userMmr - 200),
          max: Math.min(5000, userMmr + 200),
          current: userMmr
        }
      }
    };

    logger.info('12. 매치메이킹 대기열 참가 성공:', {
      userId: req.user.id,
      battleTag: req.user.battleTag,
      preferredRole,
      gameMode: gameMode || 'Storm League',
      mmr: userMmr,
      queueSize: queueStats.currentQueueSize + 1
    });

    logger.info('=== 서버 매치찾기 JOIN 요청 완료 ===');
    res.json(responseData);

  } catch (err) {
    logger.error('=== 서버 매치찾기 JOIN 오류 발생 ===');
    logger.error('오류 상세:', {
      message: err.message,
      stack: err.stack,
      name: err.name,
      userId: req.user?.id,
      battleTag: req.user?.battleTag
    });
    res.status(500).json({
      message: '매치메이킹 참가에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      errorType: err.name,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route   POST /api/matchmaking/leave
 * @desc    매치메이킹 대기열 나가기 (캐시 및 WebSocket 통합)
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

    // 캐시에서 제거
    const cacheKey = cacheService.getQueueCacheKey(req.user.id);
    await cacheService.del(cacheKey);

    // 통계 캐시 무효화
    const statsKey = cacheService.getMatchmakingStatsKey(queueEntry.gameMode);
    await cacheService.del(statsKey);

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
 * @desc    매치메이킹 상태 조회 (캐시 최적화)
 * @access  Private
 */
router.get('/status', authenticate, async (req, res) => {
  try {
    // 캐시에서 사용자 대기열 상태 확인
    const cacheKey = cacheService.getQueueCacheKey(req.user.id);
    let queueEntry = await cacheService.get(cacheKey);

    if (!queueEntry) {
      // 캐시에 없으면 DB에서 조회
      const dbQueueEntry = await global.db.MatchmakingQueue.findOne({
        where: { userId: req.user.id }
      });

      if (!dbQueueEntry) {
        return res.json({
          inQueue: false,
          currentPlayers: 0,
          requiredPlayers: 10,
          estimatedTime: '00:00',
          waitTime: 0,
          joinedAt: null,
          serverTime: new Date().toISOString()
        });
      }

      queueEntry = dbQueueEntry.toJSON();
      // 캐시에 저장
      await cacheService.set(cacheKey, queueEntry, 300);
    }

    // 통계 캐시에서 대기열 정보 조회
    const statsKey = cacheService.getMatchmakingStatsKey(queueEntry.gameMode);
    let queueStats = await cacheService.get(statsKey);

    if (!queueStats) {
      // 전체 대기열 인원 수 조회
      const totalInQueue = await global.db.MatchmakingQueue.count({
        where: {
          gameMode: queueEntry.gameMode,
          status: 'waiting'
        }
      });

      // MMR 기반 매칭 풀 크기 계산
      const userMmr = req.user.mmr || 1500;
      const queueStartTime = new Date(queueEntry.queueTime);
      const currentTime = new Date();
      const waitTimeMs = currentTime.getTime() - queueStartTime.getTime();
      const waitTimeSeconds = Math.max(0, Math.floor(waitTimeMs / 1000));
      const mmrRange = Math.min(200, 50 + (waitTimeSeconds * 2));

      const mmrMatchPool = await global.db.MatchmakingQueue.count({
        where: {
          gameMode: queueEntry.gameMode,
          status: 'waiting',
          mmr: {
            [Op.between]: [userMmr - mmrRange, userMmr + mmrRange]
          }
        }
      });

      // 대기열 내 순서 계산
      const queuePosition = await global.db.MatchmakingQueue.count({
        where: {
          gameMode: queueEntry.gameMode,
          status: 'waiting',
          queueTime: {
            [Op.lt]: queueEntry.queueTime
          }
        }
      }) + 1;

      queueStats = {
        totalInQueue,
        mmrMatchPool,
        queuePosition,
        waitTimeSeconds,
        mmrRange: {
          min: userMmr - mmrRange,
          max: userMmr + mmrRange,
          current: userMmr
        }
      };

      // 캐시에 저장 (짧은 TTL)
      await cacheService.set(statsKey, queueStats, 10);
    }

    // 예상 대기 시간 계산
    let estimatedSeconds = 0;
    if (queueStats.mmrMatchPool >= 10) {
      estimatedSeconds = Math.max(0, 30 - queueStats.waitTimeSeconds);
    } else {
      const playersNeeded = 10 - queueStats.mmrMatchPool;
      const avgJoinRate = Math.max(1, queueStats.totalInQueue / 60);
      estimatedSeconds = Math.ceil(playersNeeded / avgJoinRate) * 60;
      estimatedSeconds = Math.min(estimatedSeconds, 600);
    }

    res.json({
      inQueue: true,
      currentPlayers: queueStats.mmrMatchPool,
      totalInQueue: queueStats.totalInQueue,
      requiredPlayers: 10,
      queuePosition: queueStats.queuePosition,
      estimatedWaitTime: estimatedSeconds,
      waitTime: queueStats.waitTimeSeconds,
      joinedAt: queueEntry.queueTime,
      serverTime: new Date().toISOString(),
      mmrRange: queueStats.mmrRange,
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
    res.status(500).json({
      message: '매치메이킹 상태 조회에 실패했습니다',
      inQueue: false,
      currentPlayers: 0,
      waitTime: 0,
      serverTime: new Date().toISOString()
    });
  }
});

/**
 * 개선된 매치메이킹 로직 (MMR 기반 + 확장성 + WebSocket 알림)
 */
async function tryMatchmaking(userId) {
  try {
    // 트리거한 사용자의 정보 조회
    const triggerUser = await global.db.User.findByPk(userId);
    if (!triggerUser) {
      logger.warn('매치메이킹 트리거 사용자를 찾을 수 없음:', userId);
      return;
    }

    // 대기열에서 사용자들 조회 (MMR 기준 정렬)
    const queueEntries = await global.db.MatchmakingQueue.findAll({
      where: { status: 'waiting' },
      include: [{
        model: global.db.User,
        as: 'user',
        attributes: ['id', 'battleTag', 'mmr', 'preferredRoles']
      }],
      order: [['queueTime', 'ASC']] // 대기 시간 순
    });

    if (queueEntries.length < 10) {
      logger.info(`매치메이킹 대기: 현재 ${queueEntries.length}명, 10명 필요`);
      return;
    }

    // MMR 기반 매칭 그룹 생성
    const matchGroups = createBalancedMatches(queueEntries);

    if (matchGroups.length === 0) {
      logger.info('매치메이킹 실패: 밸런스된 매치를 생성할 수 없음');
      return;
    }

    // 첫 번째 매치 그룹으로 매치 생성
    const selectedGroup = matchGroups[0];

    logger.info('매치메이킹 성공:', {
      participants: selectedGroup.length,
      avgMmr: Math.round(selectedGroup.reduce((sum, entry) => sum + entry.user.mmr, 0) / selectedGroup.length),
      mmrRange: {
        min: Math.min(...selectedGroup.map(e => e.user.mmr)),
        max: Math.max(...selectedGroup.map(e => e.user.mmr))
      }
    });

    // 새 매치 생성
    const match = await global.db.Match.create({
      gameMode: selectedGroup[0].gameMode,
      mapName: getRandomMap(),
      maxPlayers: 10,
      currentPlayers: 10,
      createdBy: selectedGroup[0].userId,
      status: 'ready',
      averageMmr: Math.round(selectedGroup.reduce((sum, entry) => sum + entry.user.mmr, 0) / 10)
    });

    // 팀 분배 (MMR 밸런싱)
    const teams = balanceTeams(selectedGroup);

    // 참가자 추가 (팀 정보 포함)
    const participants = selectedGroup.map((entry, index) => ({
      matchId: match.id,
      userId: entry.userId,
      role: entry.preferredRole,
      team: teams.team1.includes(entry) ? 0 : 1, // 0: 블루팀, 1: 레드팀
      joinedAt: new Date()
    }));

    await global.db.MatchParticipant.bulkCreate(participants);

    // 대기열에서 제거
    const userIds = selectedGroup.map(entry => entry.userId);
    await global.db.MatchmakingQueue.destroy({
      where: {
        userId: {
          [Op.in]: userIds
        }
      }
    });

    // 캐시에서 사용자들의 대기열 상태 제거
    for (const userId of userIds) {
      const cacheKey = cacheService.getQueueCacheKey(userId);
      await cacheService.del(cacheKey);
    }

    // 통계 캐시 무효화
    const statsKey = cacheService.getMatchmakingStatsKey(selectedGroup[0].gameMode);
    await cacheService.del(statsKey);

    // 매치 로그 기록
    try {
      if (global.db && global.db.UserLog) {
        const logPromises = userIds.map(userId =>
          global.db.UserLog.create({
            userId: userId,
            action: 'match_found',
            details: {
              matchId: match.id,
              averageMmr: match.averageMmr,
              gameMode: match.gameMode
            }
          })
        );
        await Promise.all(logPromises);
      }
    } catch (logErr) {
      logger.error('매치 찾음 로그 기록 오류:', logErr);
    }

    logger.info('매치 생성 완료:', {
      matchId: match.id,
      participants: userIds.length,
      averageMmr: match.averageMmr,
      team1Mmr: Math.round(teams.team1.reduce((sum, e) => sum + e.user.mmr, 0) / 5),
      team2Mmr: Math.round(teams.team2.reduce((sum, e) => sum + e.user.mmr, 0) / 5)
    });

  } catch (err) {
    logger.error('매치메이킹 처리 오류:', err);
  }
}

/**
 * MMR 기반 밸런스된 매치 그룹 생성
 */
function createBalancedMatches(queueEntries) {
  const matches = [];
  const used = new Set();

  // MMR 순으로 정렬
  const sortedEntries = [...queueEntries].sort((a, b) => b.user.mmr - a.user.mmr);

  for (let i = 0; i < sortedEntries.length - 9; i++) {
    if (used.has(sortedEntries[i].userId)) continue;

    const anchor = sortedEntries[i];
    const group = [anchor];
    used.add(anchor.userId);

    // 앵커 MMR 기준으로 적절한 범위 내의 플레이어들 선택
    const mmrRange = Math.max(100, anchor.user.mmr * 0.1); // MMR의 10% 또는 최소 100

    for (let j = i + 1; j < sortedEntries.length && group.length < 10; j++) {
      const candidate = sortedEntries[j];

      if (used.has(candidate.userId)) continue;

      const mmrDiff = Math.abs(anchor.user.mmr - candidate.user.mmr);

      if (mmrDiff <= mmrRange) {
        group.push(candidate);
        used.add(candidate.userId);
      }
    }

    if (group.length === 10) {
      matches.push(group);
    } else {
      // 그룹이 완성되지 않으면 사용된 플레이어들 해제
      group.forEach(entry => used.delete(entry.userId));
    }
  }

  return matches;
}

/**
 * 팀 밸런싱 (MMR 기반)
 */
function balanceTeams(players) {
  // MMR 순으로 정렬
  const sortedPlayers = [...players].sort((a, b) => b.user.mmr - a.user.mmr);

  const team1 = [];
  const team2 = [];

  // 스네이크 드래프트 방식으로 팀 분배
  for (let i = 0; i < sortedPlayers.length; i++) {
    if (i % 4 < 2) {
      if (team1.length < 5) {
        team1.push(sortedPlayers[i]);
      } else {
        team2.push(sortedPlayers[i]);
      }
    } else {
      if (team2.length < 5) {
        team2.push(sortedPlayers[i]);
      } else {
        team1.push(sortedPlayers[i]);
      }
    }
  }

  return { team1, team2 };
}

/**
 * 랜덤 맵 선택
 */
function getRandomMap() {
  const maps = [
    '용의 둥지',
    '저주받은 골짜기',
    '공포의 정원',
    '하늘사원',
    '거미 여왕의 무덤',
    '영원의 전쟁터',
    '불지옥 신단',
    '파멸의 탑',
    '브락식스 항전',
    '볼스카야 공장',
    '알터랙 고개'
  ];

  return maps[Math.floor(Math.random() * maps.length)];
}

/**
 * @route   GET /api/matchmaking/recent-games
 * @desc    최근 게임 목록 조회
 * @access  Public
 */
router.get('/recent-games', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50); // 최대 50개
    const offset = (page - 1) * limit;

    logger.info('최근 게임 목록 조회 요청:', {
      page,
      limit,
      offset
    });

    // 최근 완료된 매치들 조회 (간단한 버전)
    const { count, rows: matches } = await global.db.Match.findAndCountAll({
      where: {
        status: 'completed'
      },
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    // 매치 데이터 포맷팅 (참가자 정보는 별도로 조회)
    const recentGames = [];

    for (const match of matches) {
      // 각 매치의 참가자 정보 조회
      const participants = await global.db.MatchParticipant.findAll({
        where: { matchId: match.id },
        include: [
          {
            model: global.db.User,
            as: 'user',
            attributes: ['id', 'battleTag', 'nickname']
          }
        ]
      });

      // 팀별로 플레이어 분류
      const redTeam = [];
      const blueTeam = [];

      console.log(`[DEBUG] 매치 ${match.id} - 총 참가자: ${participants.length}명`);

      participants.forEach(participant => {
        // DB 사용자 정보가 있는 경우와 없는 경우 모두 처리
        const isDbUser = !!participant.user;
        const battleTag = participant.user?.battleTag || participant.playerBattleTag || 'Unknown';
        const nickname = participant.user?.nickname ||
                        participant.user?.battleTag?.split('#')[0] ||
                        participant.playerBattleTag?.split('#')[0] ||
                        '알 수 없음';

        const playerData = {
          id: participant.id,
          userId: participant.userId,
          battletag: battleTag,
          nickname: nickname,
          hero: participant.hero || '알 수 없음',
          role: participant.role || '알 수 없음',
          kills: participant.kills || 0,
          deaths: participant.deaths || 0,
          assists: participant.assists || 0,
          heroDamage: participant.heroDamage || 0,
          siegeDamage: participant.siegeDamage || 0,
          healing: participant.healing || 0,
          experience: participant.experienceContribution || 0,
          mmrBefore: participant.mmrBefore || 1500,
          mmrAfter: participant.mmrAfter || 1500,
          mmrChange: participant.mmrChange || 0,
          isDbUser: isDbUser, // DB 등록 사용자 여부
          battleTag: participant.playerBattleTag // 리플레이에서 추출된 배틀태그
        };

        console.log(`[DEBUG] 플레이어 ${playerData.nickname} (${playerData.battletag}) - 팀: "${participant.team}" (타입: ${typeof participant.team}), DB사용자: ${isDbUser}`);

        // 팀 분류 로직 개선 - 모든 가능한 형태 처리
        const teamValue = String(participant.team).toLowerCase();

        if (teamValue === 'red' || teamValue === '1') {
          redTeam.push(playerData);
          console.log(`[DEBUG] ${playerData.nickname} → 레드팀 추가 (팀값: "${participant.team}")`);
        } else if (teamValue === 'blue' || teamValue === '0') {
          blueTeam.push(playerData);
          console.log(`[DEBUG] ${playerData.nickname} → 블루팀 추가 (팀값: "${participant.team}")`);
        } else {
          console.log(`[DEBUG] ${playerData.nickname} → 팀 분류 실패 (팀값: "${participant.team}", 변환값: "${teamValue}")`);
          // 기본적으로 블루팀에 추가
          blueTeam.push(playerData);
          console.log(`[DEBUG] ${playerData.nickname} → 기본값으로 블루팀에 추가`);
        }
      });

      console.log(`[DEBUG] 매치 ${match.id} - 최종 팀 구성: 블루팀 ${blueTeam.length}명, 레드팀 ${redTeam.length}명`);

      // 팀 평균 MMR 계산
      const calculateAvgMmr = (team) => {
        if (team.length === 0) return 1500;
        const totalMmr = team.reduce((sum, player) => sum + (player.mmrAfter || 1500), 0);
        return Math.round(totalMmr / team.length);
      };

      // 승리팀 결정 (문자열과 숫자 모두 처리)
      let winner = 'none';
      if (match.winner === 'red' || match.winner === '1' || match.winner === 1) {
        winner = 'red';
      } else if (match.winner === 'blue' || match.winner === '0' || match.winner === 0) {
        winner = 'blue';
      }

      console.log(`[DEBUG] 매치 ${match.id} - 원본 winner: ${match.winner} (타입: ${typeof match.winner}), 변환된 winner: ${winner}`);

      recentGames.push({
        id: match.id,
        map: match.mapName || '알 수 없는 맵',
        gameMode: match.gameMode || 'Storm League',
        winner: winner,
        gameDuration: match.gameDuration || 0,
        status: match.status,
        createdAt: match.createdAt,
        date: match.createdAt ? new Date(match.createdAt).toLocaleDateString('ko-KR') : '알 수 없음',
        time: match.createdAt ? new Date(match.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : '알 수 없음',
        redTeam: {
          name: '레드팀',
          avgMmr: calculateAvgMmr(redTeam),
          players: redTeam
        },
        blueTeam: {
          name: '블루팀',
          avgMmr: calculateAvgMmr(blueTeam),
          players: blueTeam
        },
        playerCount: participants.length
      });
    }

    logger.info('최근 게임 목록 조회 성공:', {
      totalCount: count,
      returnedCount: recentGames.length,
      page,
      totalPages: Math.ceil(count / limit)
    });

    // 첫 번째 게임의 구조 디버깅
    if (recentGames.length > 0) {
      const firstGame = recentGames[0];
      console.log('[DEBUG] 서버에서 보내는 첫 번째 게임 구조:', {
        id: firstGame.id,
        redTeamPlayersCount: firstGame.redTeam?.players?.length || 0,
        blueTeamPlayersCount: firstGame.blueTeam?.players?.length || 0,
        redTeamSample: firstGame.redTeam?.players?.[0] || 'no players',
        blueTeamSample: firstGame.blueTeam?.players?.[0] || 'no players'
      });
    }

    res.json({
      games: recentGames,
      pagination: {
        total: count,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        limit
      }
    });

  } catch (err) {
    logger.error('최근 게임 목록 조회 오류:', {
      error: err.message,
      stack: err.stack
    });
    res.status(500).json({
      message: '최근 게임 데이터를 가져오는데 실패했습니다.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

/**
 * 배치 매치메이킹 (확장성을 위한 최적화)
 */
async function tryBatchMatchmaking() {
  try {
    logger.info('배치 매치메이킹 시작');

    // 모든 대기 중인 사용자 조회
    const allQueueEntries = await global.db.MatchmakingQueue.findAll({
      where: { status: 'waiting' },
      include: [{
        model: global.db.User,
        as: 'user',
        attributes: ['id', 'battleTag', 'mmr', 'preferredRoles']
      }],
      order: [['queueTime', 'ASC']]
    });

    if (allQueueEntries.length < 10) {
      logger.info(`배치 매치메이킹: 대기열 부족 (${allQueueEntries.length}명)`);
      return;
    }

    // 여러 매치 그룹 생성 시도
    const matchGroups = createBalancedMatches(allQueueEntries);

    logger.info(`배치 매치메이킹: ${matchGroups.length}개 매치 그룹 생성 가능`);

    if (matchGroups.length === 0) {
      logger.info('배치 매치메이킹: 밸런스된 매치 그룹을 생성할 수 없음');
      return;
    }

    // 모든 가능한 매치 생성
    const createdMatches = [];
    for (const group of matchGroups) {
      try {
        const match = await createMatchFromGroup(group);
        if (match) {
          createdMatches.push(match);
        }
      } catch (err) {
        logger.error('배치 매치 그룹 생성 오류:', err);
      }
    }

    if (createdMatches.length > 0) {
      logger.info(`배치 매치메이킹 완료: ${createdMatches.length}개 매치 생성`);
    }

  } catch (err) {
    logger.error('배치 매치메이킹 오류:', err);
  }
}

/**
 * 매치 그룹으로부터 실제 매치 생성
 */
async function createMatchFromGroup(selectedGroup) {
  try {
    // 새 매치 생성
    const match = await global.db.Match.create({
      gameMode: selectedGroup[0].gameMode,
      mapName: getRandomMap(),
      maxPlayers: 10,
      currentPlayers: 10,
      createdBy: selectedGroup[0].userId,
      status: 'ready',
      averageMmr: Math.round(selectedGroup.reduce((sum, entry) => sum + entry.user.mmr, 0) / 10)
    });

    // 팀 분배
    const teams = balanceTeams(selectedGroup);

    // 참가자 추가
    const participants = selectedGroup.map((entry) => ({
      matchId: match.id,
      userId: entry.userId,
      role: entry.preferredRole,
      team: teams.team1.includes(entry) ? 0 : 1,
      joinedAt: new Date()
    }));

    await global.db.MatchParticipant.bulkCreate(participants);

    // 대기열에서 제거
    const userIds = selectedGroup.map(entry => entry.userId);
    await global.db.MatchmakingQueue.destroy({
      where: {
        userId: { [Op.in]: userIds }
      }
    });

    // 캐시에서 사용자들의 대기열 상태 제거
    for (const userId of userIds) {
      const cacheKey = cacheService.getQueueCacheKey(userId);
      await cacheService.del(cacheKey);
    }

    // 통계 캐시 무효화
    const statsKey = cacheService.getMatchmakingStatsKey(selectedGroup[0].gameMode);
    await cacheService.del(statsKey);

    logger.info('배치 매치 생성 완료:', {
      matchId: match.id,
      participants: userIds.length,
      averageMmr: match.averageMmr,
      team1Mmr: Math.round(teams.team1.reduce((sum, e) => sum + e.user.mmr, 0) / 5),
      team2Mmr: Math.round(teams.team2.reduce((sum, e) => sum + e.user.mmr, 0) / 5)
    });

    return match;

  } catch (err) {
    logger.error('매치 그룹 생성 오류:', err);
    throw err;
  }
}

/**
 * @route   POST /api/matchmaking/simulate
 * @desc    개발용 매치 시뮬레이션 (실제 DB 유저 데이터 사용)
 * @access  Private
 */
router.post('/simulate', authenticate, async (req, res) => {
  try {
    // 개발 환경에서만 허용
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: '시뮬레이션은 개발 환경에서만 사용할 수 있습니다.'
      });
    }

    logger.info('🔧 개발용 매치 시뮬레이션 시작 (실제 DB 유저 사용):', {
      userId: req.user.id,
      battleTag: req.user.battleTag
    });

    // 실제 DB에서 유저 데이터 가져오기
    const realUsers = await global.db.User.findAll({
      where: {
        id: {
          [Op.ne]: req.user.id // 현재 사용자 제외
        }
      },
      attributes: ['id', 'battleTag', 'mmr', 'preferredRoles'],
      limit: 20, // 충분한 수의 유저 가져오기
      order: [['mmr', 'DESC']] // MMR 순으로 정렬
    });

    logger.info('🔧 실제 DB 유저 조회 결과:', {
      totalUsers: realUsers.length,
      userSample: realUsers.slice(0, 3).map(u => ({
        id: u.id,
        battleTag: u.battleTag,
        mmr: u.mmr,
        preferredRoles: u.preferredRoles,
        preferredRolesType: typeof u.preferredRoles
      }))
    });

    // 시뮬레이션 매치 정보 생성
    const maps = [
      '저주받은 골짜기', '용의 둥지', '불지옥 신단', '하늘 사원',
      '거미 여왕의 무덤', '영원의 전쟁터', '파멸의 탑', '브락식스 항전',
      '볼스카야 공장', '알터랙 고개', '공포의 정원'
    ];

    const roles = ['탱커', '브루저', '원거리 딜러', '근접 딜러', '지원가', '힐러'];

    // 역할별 영웅 매핑
    const heroesByRole = {
      '탱커': ['Muradin', 'Johanna', 'Diablo', 'Arthas', 'E.T.C.', 'Garrosh'],
      '브루저': ['Sonya', 'Thrall', 'Artanis', 'Leoric', 'Malthael', 'Yrel'],
      '원거리 딜러': ['Valla', 'Raynor', 'Tychus', 'Jaina', 'Kael\'thas', 'Li-Ming'],
      '근접 딜러': ['Illidan', 'Kerrigan', 'Zeratul', 'Greymane', 'Alarak', 'Maiev'],
      '지원가': ['Tassadar', 'Tyrande', 'Abathur', 'Medivh', 'Zarya', 'Ana'],
      '힐러': ['Uther', 'Rehgar', 'Malfurion', 'Brightwing', 'Lt. Morales', 'Stukov']
    };

    // 안전한 역할 추출 함수
    const getSafeRole = (preferredRoles) => {
      try {
        if (!preferredRoles) return roles[Math.floor(Math.random() * roles.length)];

        // 배열인 경우
        if (Array.isArray(preferredRoles) && preferredRoles.length > 0) {
          return preferredRoles[0];
        }

        // 문자열인 경우 (JSON 파싱 시도)
        if (typeof preferredRoles === 'string') {
          try {
            const parsed = JSON.parse(preferredRoles);
            if (Array.isArray(parsed) && parsed.length > 0) {
              return parsed[0];
            }
          } catch (parseError) {
            // JSON 파싱 실패 시 문자열 자체를 역할로 사용
            return preferredRoles;
          }
        }

        // 기본값 반환
        return roles[Math.floor(Math.random() * roles.length)];
      } catch (error) {
        logger.warn('역할 추출 중 오류:', { preferredRoles, error: error.message });
        return roles[Math.floor(Math.random() * roles.length)];
      }
    };

    // 10명의 플레이어 생성 (현재 사용자 + 9명의 실제 DB 유저)
    const baseMMR = req.user.mmr || 1500;
    const players = [];

    // 현재 사용자 추가 (임시로 랜덤 역할 사용)
    const currentUserRole = roles[Math.floor(Math.random() * roles.length)];
    players.push({
      id: req.user.id,
      name: req.user.battleTag,
      battleTag: req.user.battleTag,
      mmr: baseMMR,
      role: currentUserRole,
      hero: heroesByRole[currentUserRole][Math.floor(Math.random() * heroesByRole[currentUserRole].length)],
      isCurrentUser: true
    });

    // 실제 DB 유저들 중에서 9명 선택
    let selectedUsers = [];
    if (realUsers.length >= 9) {
      // MMR 기준으로 현재 사용자와 비슷한 유저들 우선 선택
      const sortedByMmrDiff = realUsers.sort((a, b) => {
        const diffA = Math.abs(a.mmr - baseMMR);
        const diffB = Math.abs(b.mmr - baseMMR);
        return diffA - diffB;
      });
      selectedUsers = sortedByMmrDiff.slice(0, 9);
    } else {
      // 실제 유저가 부족하면 모든 실제 유저 사용
      selectedUsers = realUsers;
    }

    // 실제 DB 유저들을 플레이어로 변환 (임시로 랜덤 역할 사용)
    selectedUsers.forEach(user => {
      const userRole = roles[Math.floor(Math.random() * roles.length)];
      players.push({
        id: user.id,
        name: user.battleTag,
        battleTag: user.battleTag,
        mmr: user.mmr || 1500,
        role: userRole,
        hero: heroesByRole[userRole][Math.floor(Math.random() * heroesByRole[userRole].length)],
        isCurrentUser: false
      });
    });

    // 10명이 안 되면 더미 플레이어로 채우기
    while (players.length < 10) {
      const dummyRole = roles[Math.floor(Math.random() * roles.length)];
      const mmrVariation = Math.floor(Math.random() * 400) - 200; // ±200 MMR 범위
      players.push({
        id: `dummy_${Date.now()}_${players.length}`,
        name: `더미플레이어${players.length}#${Math.floor(Math.random() * 9999)}`,
        battleTag: `더미플레이어${players.length}#${Math.floor(Math.random() * 9999)}`,
        mmr: Math.max(1000, Math.min(3000, baseMMR + mmrVariation)),
        role: dummyRole,
        hero: heroesByRole[dummyRole][Math.floor(Math.random() * heroesByRole[dummyRole].length)],
        isCurrentUser: false,
        isDummy: true
      });
    }

    // 팀 분배 (MMR 기반 밸런싱)
    const sortedPlayers = [...players].sort((a, b) => b.mmr - a.mmr);
    const blueTeam = [];
    const redTeam = [];

    // 스네이크 드래프트 방식으로 팀 분배
    for (let i = 0; i < 10; i++) {
      if (i % 4 < 2) {
        if (blueTeam.length < 5) {
          blueTeam.push(sortedPlayers[i]);
        } else {
          redTeam.push(sortedPlayers[i]);
        }
      } else {
        if (redTeam.length < 5) {
          redTeam.push(sortedPlayers[i]);
        } else {
          blueTeam.push(sortedPlayers[i]);
        }
      }
    }

    // 매치 정보 생성
    const matchInfo = {
      matchId: `dev_sim_${Date.now()}`,
      map: maps[Math.floor(Math.random() * maps.length)],
      gameMode: '개발용 시뮬레이션 (실제 유저)',
      estimatedDuration: '15-20분 (시뮬레이션)',
      blueTeam,
      redTeam,
      createdAt: new Date().toISOString(),
      isSimulation: true,
      isDevelopment: true,
      isDevelopmentMatch: true,
      totalPlayers: 10,
      averageMmr: Math.round(players.reduce((sum, p) => sum + p.mmr, 0) / 10),
      realUserCount: players.filter(p => !p.isDummy).length,
      dummyUserCount: players.filter(p => p.isDummy).length
    };

    logger.info('🔧 개발용 매치 시뮬레이션 완료 (실제 DB 유저):', {
      matchId: matchInfo.matchId,
      map: matchInfo.map,
      blueTeamAvgMmr: Math.round(blueTeam.reduce((sum, p) => sum + p.mmr, 0) / 5),
      redTeamAvgMmr: Math.round(redTeam.reduce((sum, p) => sum + p.mmr, 0) / 5),
      currentUserTeam: blueTeam.find(p => p.isCurrentUser) ? 'blue' : 'red',
      realUserCount: matchInfo.realUserCount,
      dummyUserCount: matchInfo.dummyUserCount
    });

    res.json({
      success: true,
      isSimulation: true,
      message: '개발용 매치 시뮬레이션이 생성되었습니다 (실제 DB 유저 사용)',
      matchInfo
    });

  } catch (err) {
    logger.error('개발용 매치 시뮬레이션 오류:', err);
    res.status(500).json({
      success: false,
      message: '시뮬레이션 생성 중 오류가 발생했습니다',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

module.exports = router;
