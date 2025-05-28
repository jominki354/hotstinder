const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
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

      // NeDB 사용 시 또는 MongoDB 사용 시
      if (global.useNeDB) {
        // NeDB 데이터베이스가 초기화되었는지 확인
        if (!global.db || !global.db.users) {
          logger.error('NeDB 데이터베이스가 초기화되지 않았습니다');
          req.isGuest = true;
          return next();
        }

        // NeDB에서 사용자 조회
        try {
          global.db.users.findOne({ _id: decoded.id }, (err, user) => {
            if (err || !user) {
              logger.warn(`NeDB 사용자를 찾을 수 없음: ${decoded.id}`);
              req.isGuest = true;
              return next();
            }
            req.user = user;
            req.isGuest = false;
            return next();
          });
        } catch (dbErr) {
          logger.error('NeDB 사용자 조회 오류:', dbErr);
          req.isGuest = true;
          return next();
        }
      } else {
        // MongoDB 사용 시 ObjectId 형식 검증
        if (!mongoose.Types.ObjectId.isValid(decoded.id)) {
          logger.warn(`유효하지 않은 ObjectId 형식: ${decoded.id}`);
          req.isGuest = true;
          return next();
        }

        // 유저 찾기
        const user = await User.findById(decoded.id);
        if (!user) {
          logger.warn(`MongoDB 사용자를 찾을 수 없음: ${decoded.id}`);
          req.isGuest = true;
          return next();
        }

        req.user = user;
        req.isGuest = false;
        next();
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
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: '관리자 권한이 필요합니다' });
  }
  next();
};

/**
 * @route   GET /api/users/leaderboard
 * @desc    유저 리더보드 조회
 * @access  Public
 */
router.get('/leaderboard', async (req, res) => {
  try {
    // 최소 게임 수 필터 (기본값: 10)
    const minGames = parseInt(req.query.minGames) || 1; // 최소 게임 수를 1로 낮춤
    const limit = parseInt(req.query.limit) || 100;

    if (global.useNeDB) {
      try {
        // NeDB 데이터베이스가 초기화되었는지 확인
        if (!global.db || !global.db.users) {
          logger.error('NeDB 데이터베이스가 초기화되지 않았습니다');
          return res.json([]);
        }

        // 데이터베이스가 아직 로드 중이면 빈 결과 반환
        if (global.dbReady === false) {
          logger.warn('데이터베이스가 아직 로드 중입니다, 잠시 후 다시 시도하세요');
          return res.json([]);
        }

        // NeDB에서 더미 사용자 포함한 모든 사용자 데이터 가져오기
        global.db.users.find({}, (err, docs) => {
          if (err) {
            logger.error('NeDB 사용자 조회 오류:', err);
            return res.json([]);
          }

          let users = docs || [];
          logger.debug(`리더보드용 사용자 ${users.length}명 조회됨`);

          // 유효한 사용자만 필터링 (최소 게임 수 이상의 게임을 플레이한 사용자)
          users = users.filter(user => {
            const totalGames = (user.wins || 0) + (user.losses || 0);
            return totalGames >= minGames;
          });

          // MMR 기준으로 정렬
          users.sort((a, b) => (b.mmr || 0) - (a.mmr || 0));

          // 제한된 수의 사용자만 반환
          users = users.slice(0, limit);

          // 리더보드 정보로 변환
          const leaderboard = users.map((user, index) => {
            const wins = user.wins || 0;
            const losses = user.losses || 0;
            const totalGames = wins + losses;
            const winRate = totalGames > 0 ? ((wins / totalGames) * 100).toFixed(1) : '0.0';

            // 배틀태그 필드 이름 통일 (battletag 또는 battleTag)
            const btag = user.battletag || user.battleTag || '';

            // 주요 역할 결정 (안전하게 접근)
            let mainRole = '없음';
            if (user.preferredRoles && Array.isArray(user.preferredRoles) && user.preferredRoles.length > 0) {
              mainRole = user.preferredRoles[0];
            }

            // 티어 계산
            let tier = '브론즈';
            const mmr = user.mmr || 1500;
            if (mmr >= 2500) tier = '그랜드마스터';
            else if (mmr >= 2200) tier = '마스터';
            else if (mmr >= 2000) tier = '다이아몬드';
            else if (mmr >= 1800) tier = '플래티넘';
            else if (mmr >= 1600) tier = '골드';
            else if (mmr >= 1400) tier = '실버';

            // isDummy 필드 추가
            const isDummy = user.isDummy || false;

            return {
              rank: index + 1,
              id: user._id || `user-${index}`,
              nickname: user.nickname || (btag ? btag.split('#')[0] : `유저${index+1}`),
              battletag: btag,
              mmr: mmr,
              wins: wins,
              losses: losses,
              winRate: parseFloat(winRate),
              mainRole: mainRole,
              tier: tier,
              totalGames: totalGames,
              isDummy: isDummy
            };
          });

          logger.debug(`리더보드 데이터 ${leaderboard.length}개 반환`);
          return res.json(leaderboard);
        });
      } catch (nedbErr) {
        logger.error('NeDB 리더보드 조회 오류:', nedbErr);
        // 오류 발생 시 빈 배열 반환
        return res.json([]);
      }
    } else {
      // MongoDB 사용 시 코드
      try {
        logger.debug('MongoDB를 사용하여 리더보드 데이터 조회 중...');

        // MongoDB에서 사용자 데이터 가져오기
        const users = await User.find({})
          .lean()
          .exec();

        if (!users || users.length === 0) {
          logger.warn('MongoDB: 리더보드에 표시할 사용자 데이터가 없습니다');
          return res.json([]);
        }

        logger.debug(`MongoDB: 리더보드용 사용자 ${users.length}명 조회됨`);

        // 유효한 사용자만 필터링 (최소 게임 수 이상의 게임을 플레이한 사용자)
        let filteredUsers = users.filter(user => {
          const totalGames = (user.wins || 0) + (user.losses || 0);
          return totalGames >= minGames;
        });

        // MMR 기준으로 정렬
        filteredUsers.sort((a, b) => (b.mmr || 0) - (a.mmr || 0));

        // 제한된 수의 사용자만 반환
        filteredUsers = filteredUsers.slice(0, limit);

        // 리더보드 정보로 변환
        const leaderboard = filteredUsers.map((user, index) => {
          const wins = user.wins || 0;
          const losses = user.losses || 0;
          const totalGames = wins + losses;
          const winRate = totalGames > 0 ? ((wins / totalGames) * 100).toFixed(1) : '0.0';

          // 배틀태그 필드 이름 통일 (battletag 또는 battleTag)
          const btag = user.battletag || user.battleTag || '';

          // 주요 역할 결정 (안전하게 접근)
          let mainRole = '없음';
          if (user.preferredRoles && Array.isArray(user.preferredRoles) && user.preferredRoles.length > 0) {
            mainRole = user.preferredRoles[0];
          }

          // 티어 계산
          let tier = '브론즈';
          const mmr = user.mmr || 1500;
          if (mmr >= 2500) tier = '그랜드마스터';
          else if (mmr >= 2200) tier = '마스터';
          else if (mmr >= 2000) tier = '다이아몬드';
          else if (mmr >= 1800) tier = '플래티넘';
          else if (mmr >= 1600) tier = '골드';
          else if (mmr >= 1400) tier = '실버';

          // isDummy 필드 추가
          const isDummy = user.isDummy || false;

          return {
            rank: index + 1,
            id: user._id || `user-${index}`,
            nickname: user.nickname || (btag ? btag.split('#')[0] : `유저${index+1}`),
            battletag: btag,
            mmr: mmr,
            wins: wins,
            losses: losses,
            winRate: parseFloat(winRate),
            mainRole: mainRole,
            tier: tier,
            totalGames: totalGames,
            isDummy: isDummy
          };
        });

        logger.debug(`MongoDB: 리더보드 데이터 ${leaderboard.length}개 반환`);
        return res.json(leaderboard);
      } catch (mongoErr) {
        logger.error('MongoDB 리더보드 조회 오류:', mongoErr);
        // 오류 발생 시 빈 배열 반환
        return res.json([]);
      }
    }
  } catch (err) {
    logger.error('리더보드 조회 오류:', err);
    // 오류 발생 시 빈 배열 반환하여 프론트엔드 에러 방지
    return res.json([]);
  }
});

/**
 * @route   GET /api/users/all
 * @desc    모든 사용자 목록 조회 (공개용)
 * @access  Public
 */
router.get('/all', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;

    if (global.useNeDB) {
      try {
        // NeDB 데이터베이스가 초기화되었는지 확인
        if (!global.db || !global.db.users) {
          logger.error('NeDB 데이터베이스가 초기화되지 않았습니다');
          return res.json([]);
        }

        // 데이터베이스가 아직 로드 중이면 빈 결과 반환
        if (global.dbReady === false) {
          logger.warn('데이터베이스가 아직 로드 중입니다, 잠시 후 다시 시도하세요');
          return res.json([]);
        }

        // NeDB에서 모든 사용자 데이터 가져오기 (일반 콜백 방식)
        global.db.users.find({}, (err, docs) => {
          if (err) {
            logger.error('NeDB 사용자 조회 오류:', err);
            return res.json([]);
          }

          let users = docs || [];
          logger.debug(`전체 사용자 ${users.length}명 조회됨`);

          // MMR 기준으로 정렬
          users.sort((a, b) => (b.mmr || 0) - (a.mmr || 0));

          // 제한된 수의 사용자만 반환
          users = users.slice(0, limit);

          // 사용자 정보로 변환
          const userList = users.map((user, index) => {
            // 기본값 설정으로 undefined 방지
            const wins = user.wins || 0;
            const losses = user.losses || 0;
            const mmr = user.mmr || 1500;
            const totalGames = wins + losses;
            const winRate = totalGames > 0 ? ((wins / totalGames) * 100).toFixed(1) : '0.0';

            // 배틀태그 필드 이름 통일 (battletag 또는 battleTag)
            const btag = user.battletag || user.battleTag || '';

            // 주요 역할 결정 (안전하게 접근)
            let mainRole = '없음';
            if (user.preferredRoles && Array.isArray(user.preferredRoles) && user.preferredRoles.length > 0) {
              mainRole = user.preferredRoles[0];
            }

            // 랭크 계산 (기본값은 MMR로 정렬한 인덱스 기반)
            let tier = '브론즈';
            if (mmr >= 2500) tier = '그랜드마스터';
            else if (mmr >= 2200) tier = '마스터';
            else if (mmr >= 2000) tier = '다이아몬드';
            else if (mmr >= 1800) tier = '플래티넘';
            else if (mmr >= 1600) tier = '골드';
            else if (mmr >= 1400) tier = '실버';

            // isDummy 필드 추가
            const isDummy = user.isDummy || false;

            return {
              rank: index + 1,
              id: user._id || `user-${index}`, // ID가 없는 경우 기본값 제공
              nickname: user.nickname || (btag ? btag.split('#')[0] : `유저${index+1}`),
              battletag: btag,
              mmr: mmr,
              wins: wins,
              losses: losses,
              winRate: parseFloat(winRate),
              mainRole: mainRole,
              tier: tier,
              totalGames: totalGames,
              isDummy: isDummy
            };
          });

          logger.debug(`전체 사용자 목록 ${userList.length}개 반환`);
          return res.json(userList);
        });
      } catch (nedbErr) {
        logger.error('NeDB 사용자 조회 오류:', nedbErr);
        // 오류 발생 시 빈 배열 반환
        return res.json([]);
      }
    } else {
      // MongoDB 사용 시 코드
      try {
        logger.debug('MongoDB를 사용하여 모든 사용자 데이터 조회 중...');

        // MongoDB에서 모든 사용자 데이터 가져오기
        const users = await User.find({})
          .lean()
          .exec();

        if (!users || users.length === 0) {
          logger.warn('MongoDB: 사용자 데이터가 없습니다');
          return res.json([]);
        }

        logger.debug(`MongoDB: 전체 사용자 ${users.length}명 조회됨`);

        // MMR 기준으로 정렬
        const sortedUsers = [...users].sort((a, b) => (b.mmr || 0) - (a.mmr || 0));

        // 제한된 수의 사용자만 반환
        const limitedUsers = sortedUsers.slice(0, limit);

        // 사용자 정보로 변환
        const userList = limitedUsers.map((user, index) => {
          // 기본값 설정으로 undefined 방지
          const wins = user.wins || 0;
          const losses = user.losses || 0;
          const mmr = user.mmr || 1500;
          const totalGames = wins + losses;
          const winRate = totalGames > 0 ? ((wins / totalGames) * 100).toFixed(1) : '0.0';

          // 배틀태그 필드 이름 통일 (battletag 또는 battleTag)
          const btag = user.battletag || user.battleTag || '';

          // 주요 역할 결정 (안전하게 접근)
          let mainRole = '없음';
          if (user.preferredRoles && Array.isArray(user.preferredRoles) && user.preferredRoles.length > 0) {
            mainRole = user.preferredRoles[0];
          }

          // 랭크 계산 (기본값은 MMR로 정렬한 인덱스 기반)
          let tier = '브론즈';
          if (mmr >= 2500) tier = '그랜드마스터';
          else if (mmr >= 2200) tier = '마스터';
          else if (mmr >= 2000) tier = '다이아몬드';
          else if (mmr >= 1800) tier = '플래티넘';
          else if (mmr >= 1600) tier = '골드';
          else if (mmr >= 1400) tier = '실버';

          // isDummy 필드 추가
          const isDummy = user.isDummy || false;

          return {
            rank: index + 1,
            id: user._id || `user-${index}`, // ID가 없는 경우 기본값 제공
            nickname: user.nickname || (btag ? btag.split('#')[0] : `유저${index+1}`),
            battletag: btag,
            mmr: mmr,
            wins: wins,
            losses: losses,
            winRate: parseFloat(winRate),
            mainRole: mainRole,
            tier: tier,
            totalGames: totalGames,
            isDummy: isDummy
          };
        });

        logger.debug(`MongoDB: 전체 사용자 목록 ${userList.length}개 반환`);
        return res.json(userList);
      } catch (mongoErr) {
        logger.error('MongoDB 사용자 조회 오류:', mongoErr);
        // 오류 발생 시 빈 배열 반환
        return res.json([]);
      }
    }
  } catch (err) {
    logger.error('사용자 목록 조회 오류:', err);
    // 오류 발생 시 빈 배열 반환하여 프론트엔드 에러 방지
    return res.json([]);
  }
});

/**
 * @route   GET /api/users/profile
 * @desc    자신의 프로필 정보 조회
 * @access  Private
 */
router.get('/profile', authenticateOptional, requireAuth, (req, res) => {
  const user = req.user;

  // 승률 직접 계산
  const totalGames = user.wins + user.losses;
  const winRate = totalGames > 0 ? Math.round((user.wins / totalGames) * 100 * 10) / 10 : 0;

  res.json({
    id: user._id,
    battleTag: user.battleTag || user.battletag,
    nickname: user.nickname || (user.battletag ? user.battletag.split('#')[0] : (user.battleTag ? user.battleTag.split('#')[0] : '')),
    email: user.email,
    profilePicture: user.profilePicture,
    preferredRoles: user.preferredRoles || [],
    favoriteHeroes: user.favoriteHeroes || [],
    mmr: user.mmr || 1500,
    wins: user.wins || 0,
    losses: user.losses || 0,
    winRate: winRate,
    createdAt: user.createdAt
  });
});

/**
 * @route   PUT /api/users/profile
 * @desc    프로필 정보 업데이트
 * @access  Private
 */
router.put('/profile', authenticateOptional, requireAuth, async (req, res) => {
  try {
    const { nickname, preferredHeroes, profilePicture } = req.body;
    const user = req.user;

    // 업데이트할 필드 설정
    if (nickname) user.nickname = nickname;
    if (profilePicture) user.profilePicture = profilePicture;
    if (preferredHeroes) user.preferredHeroes = preferredHeroes;

    // 저장
    await user.save();

    res.json({
      message: '프로필이 업데이트되었습니다',
      user: {
        id: user._id,
        battleTag: user.battleTag,
        nickname: user.nickname,
        profilePicture: user.profilePicture,
        preferredHeroes: user.preferredHeroes
      }
    });
  } catch (err) {
    console.error('프로필 업데이트 오류:', err);
    res.status(500).json({ message: '프로필 업데이트에 실패했습니다' });
  }
});

/**
 * @route   GET /api/users/search/:query
 * @desc    사용자 검색
 * @access  Private
 */
router.get('/search/:query', authenticateOptional, requireAuth, async (req, res) => {
  try {
    const searchQuery = req.params.query;
    let users;

    // 배틀태그로 검색
    if (searchQuery.includes('#')) {
      users = await User.find({ battleTag: new RegExp(searchQuery, 'i') })
        .select('_id battleTag nickname profilePicture playerStats')
        .limit(10);
    } else {
      // 닉네임으로 검색
      users = await User.find({
        $or: [
          { nickname: new RegExp(searchQuery, 'i') },
          { battleTag: new RegExp(searchQuery, 'i') }
        ]
      })
        .select('_id battleTag nickname profilePicture playerStats')
        .limit(10);
    }

    // 검색 결과 반환
    res.json(users.map(user => ({
      id: user._id,
      battleTag: user.battleTag,
      nickname: user.nickname || user.battleTag.split('#')[0],
      profilePicture: user.profilePicture,
      mmr: user.playerStats?.mmr || 1500
    })));
  } catch (err) {
    console.error('사용자 검색 오류:', err);
    res.status(500).json({ message: '사용자 검색에 실패했습니다' });
  }
});

/**
 * @route   GET /api/users/admin/all
 * @desc    모든 사용자 목록 조회 (관리자용)
 * @access  Admin
 */
router.get('/admin/all', authenticateOptional, requireAuth, isAdmin, async (req, res) => {
  try {
    const users = await User.find()
      .select('-accessToken -refreshToken')
      .sort('-createdAt');

    res.json(users);
  } catch (err) {
    console.error('사용자 목록 조회 오류:', err);
    res.status(500).json({ message: '사용자 목록 조회에 실패했습니다' });
  }
});

/**
 * @route   GET /api/users/:id
 * @desc    특정 사용자 정보 조회
 * @access  Private
 */
router.get('/:id', authenticateOptional, requireAuth, async (req, res) => {
  try {
    // ObjectId 형식인지 확인
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: '유효하지 않은 사용자 ID 형식입니다' });
    }

    const user = await User.findById(req.params.id)
      .select('-accessToken -refreshToken -email');

    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다' });
    }

    // 승률 직접 계산
    const totalGames = user.wins + user.losses;
    const winRate = totalGames > 0 ? Math.round((user.wins / totalGames) * 100 * 10) / 10 : 0;

    res.json({
      user: {
        id: user._id,
        battletag: user.battletag || user.battleTag || '',
        nickname: user.nickname || (user.battletag ? user.battletag.split('#')[0] : ''),
        profilePicture: user.profilePicture,
        preferredRoles: user.preferredRoles || [],
        favoriteHeroes: user.favoriteHeroes || [],
        mmr: user.mmr || 1500,
        wins: user.wins || 0,
        losses: user.losses || 0,
        winRate: winRate,
        isAdmin: user.isAdmin || false,
        isProfileComplete: user.isProfileComplete || false,
        previousTier: user.previousTier || 'placement'
      }
    });
  } catch (err) {
    console.error('사용자 조회 오류:', err);
    res.status(500).json({ message: '사용자 정보 조회에 실패했습니다' });
  }
});

module.exports = router;