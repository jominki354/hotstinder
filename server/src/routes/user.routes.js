const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

// 미들웨어: 인증 확인 (선택적) - 인증 실패해도 게스트로 계속
const authenticateOptional = async (req, res, next) => {
  try {
    // API URL 경로 확인 - 리더보드 또는 전체 사용자 목록에 대한 요청은 인증 없이 처리
    const path = req.path.toLowerCase();
    if (path.includes('leaderboard') || path.includes('all')) {
      logger.debug('공개 API 요청 감지, 권한 검사 건너뜀');
      req.isGuest = true;
      return next();
    }

    const authHeader = req.headers.authorization;
    // 인증 토큰이 없으면 건너뛰고 게스트로 처리 (공개 API 용)
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.debug('인증 토큰 없음, 게스트로 계속');
      req.isGuest = true;
      return next();
    }

    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // PostgreSQL에서 사용자 조회
      if (global.db && global.db.User) {
        try {
          const user = await global.db.User.findByPk(decoded.id);
          if (!user) {
            logger.warn(`PostgreSQL 사용자를 찾을 수 없음: ${decoded.id}`);
            req.isGuest = true;
            return next();
          }
          req.user = user;
          req.isGuest = false;
          return next();
        } catch (dbErr) {
          logger.error('PostgreSQL 사용자 조회 오류:', dbErr);
          req.isGuest = true;
          return next();
        }
      } else {
        logger.error('데이터베이스가 초기화되지 않았습니다');
        req.isGuest = true;
        return next();
      }
    } catch (tokenErr) {
      logger.error('토큰 처리 오류:', tokenErr);
      req.isGuest = true;
      next();
    }
  } catch (err) {
    logger.error('인증 처리 중 예상치 못한 오류:', err);
    req.isGuest = true;
    next();
  }
};

// 미들웨어: 인증 강제
const requireAuth = (req, res, next) => {
  // 공개 API 접근인 경우 인증 체크 건너뛰기
  const path = req.path.toLowerCase();
  if (path.includes('leaderboard') || path.includes('all')) {
    logger.debug('공개 API에 대한 인증 요구 건너뜀');
    return next();
  }

  if (req.isGuest) {
    return res.status(401).json({ message: '인증이 필요합니다' });
  }
  next();
};

// 미들웨어: 관리자 확인
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: '관리자 권한이 필요합니다' });
  }
  next();
};

/**
 * @route   GET /api/leaderboard
 * @desc    리더보드 조회 (호환성을 위한 별칭)
 * @access  Public
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);

    logger.debug('리더보드 조회 요청:', { limit });

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
      _id: user.id,
      battletag: user.battleTag,
      battleTag: user.battleTag,
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

/**
 * @route   GET /api/users/profile/:id
 * @desc    특정 사용자 프로필 조회
 * @access  Public
 */
router.get('/profile/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    if (!global.db || !global.db.User) {
      return res.status(500).json({ message: '데이터베이스가 초기화되지 않았습니다' });
    }

    const user = await global.db.User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다' });
    }

    // 사용자 정보 반환 (비밀번호 제외)
    const userProfile = {
      id: user.id,
      battleTag: user.battleTag,
      nickname: user.nickname,
      mmr: user.mmr,
      wins: user.wins,
      losses: user.losses,
      winRate: user.getWinRate(),
      preferredRoles: user.preferredRoles,
      previousTier: user.previousTier,
      isProfileComplete: user.isProfileComplete,
      lastLoginAt: user.lastLoginAt
    };

    res.json({ user: userProfile });

  } catch (error) {
    logger.error('사용자 프로필 조회 중 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * @route   PUT /api/users/profile
 * @desc    사용자 프로필 업데이트
 * @access  Private
 */
router.put('/profile', authenticateOptional, requireAuth, async (req, res) => {
  try {
    const { nickname, preferredRoles, previousTier } = req.body;

    // 데이터 검증
    if (!preferredRoles || !Array.isArray(preferredRoles) || preferredRoles.length === 0) {
      return res.status(400).json({ message: '선호하는 역할은 필수 항목입니다' });
    }

    // 사용자 정보 업데이트
    await req.user.update({
      nickname: nickname || req.user.nickname,
      preferredRoles: preferredRoles,
      previousTier: previousTier || 'placement',
      isProfileComplete: true
    });

    // 로그 기록
    try {
      if (global.db && global.db.UserLog) {
        await global.db.UserLog.create({
          userId: req.user.id,
          action: 'profile_update',
          details: {
            nickname,
            preferredRoles,
            previousTier
          },
          ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
          userAgent: req.headers['user-agent']
        });
      }
    } catch (logErr) {
      logger.error('프로필 업데이트 로그 생성 중 오류:', logErr);
    }

    // 업데이트된 사용자 정보 반환
    const updatedUser = await global.db.User.findByPk(req.user.id);

    res.json({
      success: true,
      message: '프로필이 성공적으로 업데이트되었습니다',
      user: {
        id: updatedUser.id,
        battleTag: updatedUser.battleTag,
        nickname: updatedUser.nickname,
        preferredRoles: updatedUser.preferredRoles,
        previousTier: updatedUser.previousTier,
        isProfileComplete: updatedUser.isProfileComplete
      }
    });

  } catch (error) {
    logger.error('프로필 업데이트 중 오류:', error);
    res.status(500).json({
      success: false,
      message: '프로필 업데이트 중 오류가 발생했습니다'
    });
  }
});

/**
 * @route   GET /api/users/all
 * @desc    모든 사용자 목록 조회 (관리자용)
 * @access  Admin
 */
router.get('/all', authenticateOptional, isAdmin, async (req, res) => {
  try {
    if (!global.db || !global.db.User) {
      return res.status(500).json({ message: '데이터베이스가 초기화되지 않았습니다' });
    }

    const users = await global.db.User.findAll({
      order: [['createdAt', 'DESC']]
    });

    const userList = users.map(user => ({
      id: user.id,
      battleTag: user.battleTag,
      nickname: user.nickname,
      role: user.role,
      mmr: user.mmr,
      wins: user.wins,
      losses: user.losses,
      winRate: user.getWinRate(),
      isProfileComplete: user.isProfileComplete,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt
    }));

    res.json({ users: userList });

  } catch (error) {
    logger.error('사용자 목록 조회 중 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router;
