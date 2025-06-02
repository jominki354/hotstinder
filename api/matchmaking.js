const { Sequelize, DataTypes } = require('sequelize');
const jwt = require('jsonwebtoken');

// PostgreSQL 연결 함수
const connectPostgreSQL = async () => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL 환경 변수가 설정되지 않았습니다.');
  }

  const sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    logging: false, // Vercel에서는 로깅 최소화
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  });

  // 연결 테스트
  await sequelize.authenticate();
  console.log('PostgreSQL 연결 성공');

  return sequelize;
};

// User 모델 정의
const defineUser = (sequelize) => {
  return sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    battleTag: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'battle_tag'
    },
    bnetId: {
      type: DataTypes.STRING(50),
      unique: true,
      field: 'bnet_id'
    },
    nickname: {
      type: DataTypes.STRING(255)
    },
    email: {
      type: DataTypes.STRING(255)
    },
    password: {
      type: DataTypes.STRING(255)
    },
    role: {
      type: DataTypes.STRING(50),
      defaultValue: 'user'
    },
    isProfileComplete: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_profile_complete'
    },
    preferredRoles: {
      type: DataTypes.JSONB,
      defaultValue: ['전체'],
      field: 'preferred_roles'
    },
    previousTier: {
      type: DataTypes.STRING(50),
      defaultValue: 'placement',
      field: 'previous_tier'
    },
    mmr: {
      type: DataTypes.INTEGER,
      defaultValue: 1500
    },
    wins: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    losses: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      field: 'last_login_at'
    }
  }, {
    tableName: 'users'
  });
};

// Match 모델 정의
const defineMatch = (sequelize) => {
  return sequelize.define('Match', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    status: {
      type: DataTypes.STRING(50),
      defaultValue: 'waiting'
    },
    gameMode: {
      type: DataTypes.STRING(100),
      field: 'game_mode'
    },
    mapName: {
      type: DataTypes.STRING(255),
      field: 'map_name'
    },
    maxPlayers: {
      type: DataTypes.INTEGER,
      defaultValue: 10,
      field: 'max_players'
    },
    currentPlayers: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'current_players'
    },
    averageMmr: {
      type: DataTypes.INTEGER,
      field: 'average_mmr'
    },
    createdBy: {
      type: DataTypes.UUID,
      field: 'created_by',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    startedAt: {
      type: DataTypes.DATE,
      field: 'started_at'
    },
    endedAt: {
      type: DataTypes.DATE,
      field: 'ended_at'
    },
    winner: {
      type: DataTypes.STRING(10)
    },
    gameDuration: {
      type: DataTypes.INTEGER,
      field: 'game_duration'
    },
    notes: {
      type: DataTypes.TEXT
    }
  }, {
    tableName: 'matches'
  });
};

// MatchParticipant 모델 정의
const defineMatchParticipant = (sequelize) => {
  return sequelize.define('MatchParticipant', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    matchId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'match_id',
      references: {
        model: 'matches',
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    team: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    role: {
      type: DataTypes.STRING(50)
    },
    hero: {
      type: DataTypes.STRING(100)
    },
    kills: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    deaths: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    assists: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    heroDamage: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
      field: 'hero_damage'
    },
    siegeDamage: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
      field: 'siege_damage'
    },
    healing: {
      type: DataTypes.BIGINT,
      defaultValue: 0
    },
    experienceContribution: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'experience_contribution'
    },
    mmrBefore: {
      type: DataTypes.INTEGER,
      field: 'mmr_before'
    },
    mmrAfter: {
      type: DataTypes.INTEGER,
      field: 'mmr_after'
    },
    mmrChange: {
      type: DataTypes.INTEGER,
      field: 'mmr_change'
    }
  }, {
    tableName: 'match_participants'
  });
};

// 맵 이름 번역 함수
const translateMapName = (mapName) => {
  const mapTranslations = {
    'Dragon Shire': '용의 둥지',
    'Cursed Hollow': '저주받은 골짜기',
    'Garden of Terror': '공포의 정원',
    'Sky Temple': '하늘 사원',
    'Tomb of the Spider Queen': '거미 여왕의 무덤',
    'Battlefield of Eternity': '영원의 전쟁터',
    'Infernal Shrines': '불지옥 신단',
    'Towers of Doom': '파멸의 탑',
    'Volskaya Foundry': '볼스카야 공장',
    'Alterac Pass': '알터랙 고개',
    'Blackheart\'s Bay': '검은심장 만',
    'Haunted Mines': '유령 광산',
    'Braxis Holdout': '브락시스 항전',
    'Warhead Junction': '핵탄두 격전지',
    'Hanamura Temple': '하나무라 사원'
  };
  return mapTranslations[mapName] || mapName;
};

// 영웅 이름 번역 함수
const translateHeroName = (heroName) => {
  const heroTranslations = {
    'Abathur': '아바투르',
    'Alarak': '알라라크',
    'Alexstrasza': '알렉스트라자',
    'Ana': '아나',
    'Anduin': '안두인',
    'Anub\'arak': '아눕아락',
    'Artanis': '아르타니스',
    'Arthas': '아서스',
    'Auriel': '아우리엘',
    'Azmodan': '아즈모단',
    'Blaze': '블레이즈',
    'Brightwing': '밝은날개',
    'Cassia': '카시아',
    'Chen': '첸',
    'Cho': '초',
    'Chromie': '크로미',
    'D.Va': '디바',
    'Deckard': '데커드',
    'Dehaka': '데하카',
    'Diablo': '디아블로',
    'E.T.C.': '정예 타우렌 족장',
    'Falstad': '팔스타드',
    'Fenix': '피닉스',
    'Gall': '갈',
    'Garrosh': '가로쉬',
    'Gazlowe': '가즐로',
    'Genji': '겐지',
    'Greymane': '그레이메인',
    'Gul\'dan': '굴단',
    'Hanzo': '한조',
    'Illidan': '일리단',
    'Imperius': '임페리우스',
    'Jaina': '제이나',
    'Johanna': '요한나',
    'Junkrat': '정크랫',
    'Kael\'thas': '캘타스',
    'Kel\'Thuzad': '켈투자드',
    'Kerrigan': '케리건',
    'Kharazim': '카라짐',
    'Leoric': '레오릭',
    'Li Li': '리리',
    'Li-Ming': '리밍',
    'Lt. Morales': '모랄레스 중위',
    'Lucio': '루시우',
    'Lunara': '루나라',
    'Maiev': '마이에브',
    'Mal\'Ganis': '말가니스',
    'Malfurion': '말퓨리온',
    'Malthael': '말티엘',
    'Medivh': '메디브',
    'Mephisto': '메피스토',
    'Muradin': '무라딘',
    'Murky': '머키',
    'Nazeebo': '나지보',
    'Nova': '노바',
    'Orphea': '오르피아',
    'Probius': '탐사정',
    'Qhira': '키라',
    'Ragnaros': '라그나로스',
    'Raynor': '레이너',
    'Rehgar': '렉가르',
    'Rexxar': '렉사르',
    'Samuro': '사무로',
    'Sgt. Hammer': '해머 상사',
    'Sonya': '소냐',
    'Stitches': '스티치스',
    'Stukov': '스투코프',
    'Sylvanas': '실바나스',
    'Tassadar': '태사다르',
    'The Butcher': '도살자',
    'The Lost Vikings': '길 잃은 바이킹',
    'Thrall': '스랄',
    'Tracer': '트레이서',
    'Tychus': '타이커스',
    'Tyrael': '티리엘',
    'Tyrande': '티란데',
    'Uther': '우서',
    'Valeera': '발리라',
    'Valla': '발라',
    'Varian': '바리안',
    'Whitemane': '화이트메인',
    'Xul': '줄',
    'Yrel': '이렐',
    'Zagara': '자가라',
    'Zarya': '자리야',
    'Zeratul': '제라툴',
    'Zuljin': '줄진'
  };
  return heroTranslations[heroName] || heroName;
};

// 캐시 서비스 (메모리 캐시 사용)
const cacheService = {
  cache: new Map(),

  async get(key) {
    return this.cache.get(key);
  },

  async set(key, value, ttl = 300) {
    this.cache.set(key, value);
    // TTL 구현 (간단한 버전)
    setTimeout(() => {
      this.cache.delete(key);
    }, ttl * 1000);
  },

  async del(key) {
    return this.cache.delete(key);
  },

  async exists(key) {
    return this.cache.has(key);
  },

  async keys(pattern) {
    const keys = [];
    for (const key of this.cache.keys()) {
      if (key.startsWith(pattern.replace('*', ''))) {
        keys.push(key);
      }
    }
    return keys;
  }
};

module.exports = async function handler(req, res) {
  // 요청 타임아웃 설정 (Vercel Functions 최대 시간)
  const timeoutId = setTimeout(() => {
    if (!res.headersSent) {
      console.error('API 타임아웃 발생');
      res.status(504).json({
        error: '요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.',
        timeout: true
      });
    }
  }, 25000); // 25초 타임아웃

  try {
    console.log('Vercel /api/matchmaking 요청 처리:', req.method, req.url);

    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'https://hotstinder.vercel.app');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // OPTIONS 요청 처리
    if (req.method === 'OPTIONS') {
      clearTimeout(timeoutId);
      return res.status(200).end();
    }

    // PostgreSQL 연결 (타임아웃 포함)
    console.log('PostgreSQL 연결 시도 중...');
    const sequelize = await Promise.race([
      connectPostgreSQL(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('PostgreSQL 연결 타임아웃')), 15000)
      )
    ]);
    console.log('PostgreSQL 연결 완료');

    // 모델 정의
    const User = defineUser(sequelize);
    const Match = defineMatch(sequelize);
    const MatchParticipant = defineMatchParticipant(sequelize);

    // 관계 설정
    Match.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
    MatchParticipant.belongsTo(Match, { foreignKey: 'match_id', as: 'match' });
    MatchParticipant.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
    Match.hasMany(MatchParticipant, { foreignKey: 'match_id', as: 'participants' });

    const { pathname } = new URL(req.url, `http://${req.headers.host}`);
    const pathParts = pathname.split('/').filter(Boolean);

    // JWT 토큰 검증 함수
    const verifyToken = (authHeader) => {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('인증 토큰이 필요합니다');
      }

      const token = authHeader.substring(7);

      try {
        return jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
      } catch (err) {
        throw new Error('유효하지 않은 토큰입니다');
      }
    };

    // /api/matchmaking/join - 대기열 참가
    if (pathParts[2] === 'join' && req.method === 'POST') {
      console.log('=== 매치찾기 JOIN 요청 시작 ===');

      try {
        console.log('1. 토큰 검증 시작');
        const decoded = verifyToken(req.headers.authorization);
        const tokenId = decoded.id;
        console.log('1. 토큰 검증 성공:', { tokenId, decodedKeys: Object.keys(decoded) });

        console.log('2. 사용자 정보 조회 시작');
        // 사용자 정보 조회 (UUID 우선, bnetId fallback)
        let user = await User.findByPk(tokenId);
        console.log('2-1. UUID 조회 결과:', { found: !!user, tokenId });

        if (!user) {
          console.log('2-2. bnetId로 재시도');
          user = await User.findOne({ where: { bnetId: tokenId } });
          console.log('2-2. bnetId 조회 결과:', { found: !!user, tokenId });
        }

        if (!user) {
          console.error('2. 사용자 조회 실패:', { tokenId });
          clearTimeout(timeoutId);
          return res.status(404).json({ success: false, error: '사용자를 찾을 수 없습니다' });
        }

        console.log('2. 사용자 정보 조회 성공:', {
          userId: user.id,
          battleTag: user.battleTag,
          isProfileComplete: user.isProfileComplete,
          preferredRoles: user.preferredRoles,
          mmr: user.mmr,
          userDataKeys: Object.keys(user.dataValues || {})
        });

        const userId = user.id;

        console.log('3. 프로필 완성도 검증 시작');
        // 프로필 완성도 검증 완화 - 경고만 표시하고 진행 허용
        if (!user.isProfileComplete) {
          console.warn('3. 프로필 미완성 사용자의 매치찾기 시도:', {
            userId: user.id,
            battleTag: user.battleTag,
            isProfileComplete: user.isProfileComplete,
            nodeEnv: process.env.NODE_ENV
          });

          // 개발 환경에서는 경고만 하고 진행
          if (process.env.NODE_ENV !== 'production') {
            console.log('3. 개발 환경: 프로필 미완성이지만 매치찾기 허용');
          } else {
            // 프로덕션에서는 여전히 차단
            console.log('3. 프로덕션 환경: 프로필 미완성으로 차단');
            clearTimeout(timeoutId);
            return res.status(400).json({
              success: false,
              error: '프로필 설정을 완료해야 매치메이킹에 참가할 수 있습니다',
              redirectTo: '/profile/setup',
              userInfo: {
                isProfileComplete: user.isProfileComplete,
                preferredRoles: user.preferredRoles,
                battleTag: user.battleTag
              }
            });
          }
        } else {
          console.log('3. 프로필 완성도 검증 통과');
        }

        console.log('4. 기존 대기열 상태 확인 시작');
        // 이미 대기열에 있는지 확인
        const existingQueue = await cacheService.get(`queue:${userId}`);
        console.log('4. 기존 대기열 상태:', {
          hasExisting: !!existingQueue,
          userId,
          cacheKey: `queue:${userId}`
        });

        if (existingQueue) {
          console.log('4. 이미 대기열에 있는 사용자:', { userId, existingQueue });
          clearTimeout(timeoutId);
          return res.json({
            success: true,
            message: '이미 대기열에 참가되어 있습니다',
            inQueue: true,
            queueTime: Math.floor((Date.now() - new Date(existingQueue.joinedAt).getTime()) / 1000),
            joinedAt: existingQueue.joinedAt
          });
        }

        console.log('5. 대기열 참가 데이터 생성 시작');
        // 대기열 참가
        const queueData = {
          userId,
          bnetId: user.bnetId,
          battletag: user.battleTag,
          mmr: user.mmr || 1500,
          preferredRoles: user.preferredRoles || ['전체'],
          joinedAt: new Date().toISOString()
        };
        console.log('5. 대기열 데이터 생성 완료:', queueData);

        console.log('6. 캐시에 대기열 데이터 저장 시작');
        await cacheService.set(`queue:${userId}`, queueData, 3600);
        console.log('6. 캐시 저장 완료');

        console.log('7. 응답 데이터 준비');
        const responseData = {
          success: true,
          message: '대기열에 참가했습니다',
          inQueue: true,
          queueTime: 0,
          joinedAt: queueData.joinedAt
        };
        console.log('7. 응답 데이터:', responseData);

        console.log(`8. 사용자 ${user.battleTag} (${userId}) 대기열 참가 성공`);

        clearTimeout(timeoutId);
        console.log('=== 매치찾기 JOIN 요청 완료 ===');
        return res.json(responseData);

      } catch (error) {
        console.error('=== 매치찾기 JOIN 오류 발생 ===');
        console.error('오류 상세:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        clearTimeout(timeoutId);
        return res.status(400).json({
          success: false,
          error: error.message,
          errorType: error.name,
          timestamp: new Date().toISOString()
        });
      }
    }

    // /api/matchmaking/leave - 대기열 탈퇴
    if (pathParts[2] === 'leave' && req.method === 'POST') {
      try {
        const decoded = verifyToken(req.headers.authorization);
        const tokenId = decoded.id;

        // 사용자 정보 조회 (UUID 우선, bnetId fallback)
        let user = await User.findByPk(tokenId);
        if (!user) {
          user = await User.findOne({ where: { bnetId: tokenId } });
        }

        if (!user) {
          clearTimeout(timeoutId);
          return res.status(404).json({ success: false, error: '사용자를 찾을 수 없습니다' });
        }

        const userId = user.id;

        // 대기열에서 제거
        await cacheService.del(`queue:${userId}`);

        console.log(`사용자 ${user.battleTag} (${userId}) 대기열 탈퇴`);

        clearTimeout(timeoutId);
        return res.json({
          success: true,
          message: '대기열에서 나왔습니다',
          inQueue: false
        });

      } catch (error) {
        console.error('대기열 탈퇴 오류:', error);
        clearTimeout(timeoutId);
        return res.status(400).json({ success: false, error: error.message });
      }
    }

    // /api/matchmaking/status - 대기열 상태 확인
    if (pathParts[2] === 'status' && req.method === 'GET') {
      try {
        const decoded = verifyToken(req.headers.authorization);
        const tokenId = decoded.id;

        // 사용자 정보 조회 (UUID 우선, bnetId fallback)
        let user = await User.findByPk(tokenId);
        if (!user) {
          user = await User.findOne({ where: { bnetId: tokenId } });
        }

        if (!user) {
          clearTimeout(timeoutId);
          return res.status(404).json({ success: false, error: '사용자를 찾을 수 없습니다' });
        }

        const userId = user.id;

        // 대기열 상태 확인
        const queueData = await cacheService.get(`queue:${userId}`);
        const matchData = await cacheService.get(`match:${userId}`);

        let response = {
          success: true,
          inQueue: !!queueData,
          matchInProgress: !!matchData,
          currentPlayers: 0,
          totalInQueue: 0,
          queuePosition: 0,
          estimatedWaitTime: 0,
          queueTime: 0,
          joinedAt: null,
          matchInfo: null,
          serverTime: new Date().toISOString()
        };

        if (queueData) {
          const joinedAt = new Date(queueData.joinedAt);
          const queueTimeSeconds = Math.floor((Date.now() - joinedAt.getTime()) / 1000);

          // 실제 대기열 통계 계산 (캐시 기반)
          const allQueueKeys = await cacheService.keys('queue:*');
          const totalInQueue = allQueueKeys.length;

          response.queueTime = queueTimeSeconds;
          response.joinedAt = queueData.joinedAt;
          response.currentPlayers = Math.min(totalInQueue, 10); // 실제 대기열 인원
          response.totalInQueue = totalInQueue;
          response.queuePosition = Math.max(1, totalInQueue - 5); // 대략적인 순서
          response.estimatedWaitTime = Math.max(30, (10 - totalInQueue) * 15); // 예상 대기시간

          // MMR 정보
          response.mmrRange = {
            current: user.mmr || 1500,
            min: Math.max(0, (user.mmr || 1500) - 200),
            max: Math.min(5000, (user.mmr || 1500) + 200)
          };
        }

        if (matchData) {
          response.matchInfo = matchData;
        }

        clearTimeout(timeoutId);
        return res.json(response);

      } catch (error) {
        console.error('대기열 상태 확인 오류:', error);
        clearTimeout(timeoutId);
        return res.status(400).json({
          success: false,
          error: error.message,
          inQueue: false,
          matchInProgress: false,
          currentPlayers: 0,
          serverTime: new Date().toISOString()
        });
      }
    }

    // /api/matchmaking/simulate - 시뮬레이션 매치 생성 (개발용으로 명확히 구분)
    if (pathParts[2] === 'simulate' && req.method === 'POST') {
      try {
        const decoded = verifyToken(req.headers.authorization);
        const tokenId = decoded.id;

        // 개발 환경에서만 허용
        if (process.env.NODE_ENV === 'production') {
          clearTimeout(timeoutId);
          return res.status(403).json({
            success: false,
            error: '시뮬레이션은 개발 환경에서만 사용할 수 있습니다'
          });
        }

        // 사용자 정보 조회 (UUID 우선, bnetId fallback)
        let user = await User.findByPk(tokenId);
        if (!user) {
          user = await User.findOne({ where: { bnetId: tokenId } });
        }

        if (!user) {
          clearTimeout(timeoutId);
          return res.status(404).json({ success: false, error: '사용자를 찾을 수 없습니다' });
        }

        const userId = user.id;

        // 기존 대기열 상태 정리
        await cacheService.del(`queue:${userId}`);

        // 실제 DB에서 사용자들 가져오기 (현재 사용자 포함)
        const allUsers = await User.findAll({
          where: {
            isProfileComplete: true,
            battleTag: { [Sequelize.Op.ne]: null }
          },
          order: [['mmr', 'DESC']],
          limit: 50 // 상위 50명 중에서 선택
        });

        console.log(`시뮬레이션용 사용자 ${allUsers.length}명 조회됨`);

        // 현재 사용자를 포함하여 10명 선택
        let selectedUsers = [];

        // 현재 사용자 먼저 추가
        selectedUsers.push(user);

        // 나머지 9명을 다른 사용자들 중에서 선택
        const otherUsers = allUsers.filter(u => u.id !== user.id);
        const shuffledUsers = otherUsers.sort(() => Math.random() - 0.5);
        selectedUsers = selectedUsers.concat(shuffledUsers.slice(0, 9));

        // 10명이 안 되면 현재 사용자 기반으로 가상 사용자 생성
        while (selectedUsers.length < 10) {
          const baseUser = selectedUsers[Math.floor(Math.random() * selectedUsers.length)];
          selectedUsers.push({
            id: `sim_${Date.now()}_${selectedUsers.length}`,
            battleTag: `SimPlayer${selectedUsers.length}#${Math.floor(Math.random() * 9999)}`,
            nickname: `SimPlayer${selectedUsers.length}`,
            mmr: baseUser.mmr + Math.floor(Math.random() * 200) - 100, // ±100 MMR 범위
            preferredRoles: baseUser.preferredRoles || ['전체']
          });
        }

        // MMR 기반 팀 밸런싱
        const sortedUsers = selectedUsers.sort((a, b) => (b.mmr || 1500) - (a.mmr || 1500));

        const blueTeam = [];
        const redTeam = [];

        // 스네이크 드래프트 방식으로 팀 분배
        for (let i = 0; i < 10; i++) {
          if (i % 4 < 2) {
            if (blueTeam.length < 5) {
              blueTeam.push(sortedUsers[i]);
            } else {
              redTeam.push(sortedUsers[i]);
            }
          } else {
            if (redTeam.length < 5) {
              redTeam.push(sortedUsers[i]);
            } else {
              blueTeam.push(sortedUsers[i]);
            }
          }
        }

        // 팀 정보 포맷팅
        const formatTeam = (team) => {
          return team.map((player, index) => ({
            id: player.id,
            name: player.battleTag || player.nickname || `Player${index + 1}`,
            nickname: player.nickname || (player.battleTag ? player.battleTag.split('#')[0] : `Player${index + 1}`),
            mmr: player.mmr || 1500,
            role: player.preferredRoles?.[0] || '전체',
            isCurrentUser: player.id === user.id
          }));
        };

        // 시뮬레이션 매치 생성
        const maps = ['용의 둥지', '저주받은 골짜기', '공포의 정원', '하늘 사원', '거미 여왕의 무덤', '영원의 전쟁터', '불지옥 신단', '파멸의 탑', '볼스카야 공장', '알터랙 고개'];
        const randomMap = maps[Math.floor(Math.random() * maps.length)];

        const simulationMatch = {
          matchId: `dev_sim_${Date.now()}`, // 개발용 시뮬레이션임을 명시
          map: randomMap,
          gameMode: '개발용 시뮬레이션',
          isSimulation: true,
          isDevelopment: true,
          blueTeam: formatTeam(blueTeam),
          redTeam: formatTeam(redTeam),
          createdAt: new Date().toISOString(),
          realUserCount: allUsers.length,
          selectedUserCount: selectedUsers.filter(u => !u.id.toString().startsWith('sim_')).length
        };

        // 매치 정보 캐시에 저장
        await cacheService.set(`match:${userId}`, simulationMatch, 1800); // 30분 TTL

        console.log(`개발용 시뮬레이션 매치 생성: ${simulationMatch.matchId} (사용자: ${user.battleTag})`);
        console.log(`실제 DB 사용자: ${simulationMatch.selectedUserCount}명, 전체: ${selectedUsers.length}명`);
        console.log(`블루팀 평균 MMR: ${Math.round(blueTeam.reduce((sum, p) => sum + (p.mmr || 1500), 0) / blueTeam.length)}`);
        console.log(`레드팀 평균 MMR: ${Math.round(redTeam.reduce((sum, p) => sum + (p.mmr || 1500), 0) / redTeam.length)}`);

        clearTimeout(timeoutId);
        return res.json({
          success: true,
          message: '개발용 시뮬레이션 매치가 생성되었습니다',
          matchInfo: simulationMatch,
          isSimulation: true
        });

      } catch (error) {
        console.error('시뮬레이션 매치 생성 오류:', error);
        clearTimeout(timeoutId);
        return res.status(400).json({ success: false, error: error.message });
      }
    }

    // /api/matchmaking/recent-games
    if (pathParts[2] === 'recent-games' && req.method === 'GET') {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 30;
      const offset = (page - 1) * limit;

      try {
        // 전체 완료된 게임 수 조회
        const totalCount = await Match.count({ where: { status: 'completed' } });

        // 페이지네이션을 적용한 쿼리
        const recentGames = await Match.findAll({
          where: { status: 'completed' },
          order: [['created_at', 'DESC']],
          offset,
          limit,
          include: [
            {
              model: MatchParticipant,
              as: 'participants',
              include: [
                {
                  model: User,
                  as: 'user',
                  attributes: ['id', 'battleTag', 'nickname', 'mmr']
                }
              ]
            }
          ]
        });

        // 전체 게임 수를 헤더에 추가
        res.set('X-Total-Count', totalCount.toString());

        // 클라이언트에 맞는 형식으로 변환
        const formattedGames = recentGames.map(game => {
          // 게임 시간 형식화
          const gameDate = new Date(game.createdAt);
          const formattedDate = `${gameDate.getFullYear()}년 ${gameDate.getMonth() + 1}월 ${gameDate.getDate()}일`;
          const hours = gameDate.getHours().toString().padStart(2, '0');
          const minutes = gameDate.getMinutes().toString().padStart(2, '0');
          const formattedTime = `${hours}:${minutes}`;

          // 게임 시간 형식화 (분:초)
          const duration = game.gameDuration || 0;
          const durationMinutes = Math.floor(duration / 60);
          const durationSeconds = duration % 60;
          const formattedDuration = `${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}`;

          // 팀별 참가자 분류
          const blueTeam = game.participants?.filter(p => p.team === 'blue') || [];
          const redTeam = game.participants?.filter(p => p.team === 'red') || [];

          // 평균 MMR 계산 함수
          const calcAvgMmr = (teamPlayers) => {
            if (!teamPlayers || teamPlayers.length === 0) return 1500;
            const validPlayers = teamPlayers.filter(p => p.user && p.user.mmr);
            if (validPlayers.length === 0) return 1500;
            const totalMmr = validPlayers.reduce((sum, p) => sum + (p.user.mmr || 1500), 0);
            return Math.round(totalMmr / validPlayers.length);
          };

          // 플레이어 정보 변환 함수
          const formatPlayers = (teamPlayers) => {
            if (!teamPlayers || !Array.isArray(teamPlayers)) return [];

            return teamPlayers.map(participant => {
              const userInfo = participant.user;
              const nickname = userInfo?.nickname ||
                (userInfo?.battleTag ? userInfo.battleTag.split('#')[0] : '알 수 없음');

              return {
                id: userInfo?.id || 'unknown',
                nickname: nickname,
                role: participant.role || '알 수 없음',
                hero: translateHeroName(participant.hero) || '알 수 없음',
                kills: participant.kills || 0,
                deaths: participant.deaths || 0,
                assists: participant.assists || 0,
                heroDamage: participant.heroDamage || 0,
                siegeDamage: participant.siegeDamage || 0,
                healing: participant.healing || 0,
                experienceContribution: participant.experienceContribution || 0,
                mmrBefore: participant.mmrBefore || 1500,
                mmrAfter: participant.mmrAfter || 1500,
                mmrChange: participant.mmrChange || 0
              };
            });
          };

          return {
            id: game.id,
            title: `매치 ${game.id.substring(0, 8)}`,
            map: translateMapName(game.mapName) || '알 수 없는 맵',
            gameMode: game.gameMode || '일반 게임',
            date: formattedDate,
            time: formattedTime,
            duration: formattedDuration,
            winner: game.winner || 'none',
            blueTeam: {
              name: '블루팀',
              avgMmr: calcAvgMmr(blueTeam),
              players: formatPlayers(blueTeam)
            },
            redTeam: {
              name: '레드팀',
              avgMmr: calcAvgMmr(redTeam),
              players: formatPlayers(redTeam)
            }
          };
        });

        console.log(`최근 게임 ${formattedGames.length}개 반환 (총 ${totalCount}개)`);
        clearTimeout(timeoutId);
        return res.json(formattedGames);
      } catch (err) {
        console.error('최근 게임 조회 오류:', err);
        clearTimeout(timeoutId);
        return res.json([]);
      }
    }

    // 지원하지 않는 경로
    clearTimeout(timeoutId);
    return res.status(404).json({ error: '요청한 리소스를 찾을 수 없습니다' });

  } catch (error) {
    console.error('/api/matchmaking 오류:', error);
    clearTimeout(timeoutId);
    return res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
};
