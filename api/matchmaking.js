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
      try {
        const decoded = verifyToken(req.headers.authorization);
        const userId = decoded.id;

        // 사용자 정보 조회
        const user = await User.findOne({ where: { bnetId: userId } });
        if (!user) {
          clearTimeout(timeoutId);
          return res.status(404).json({ success: false, error: '사용자를 찾을 수 없습니다' });
        }

        // 이미 대기열에 있는지 확인
        const existingQueue = await cacheService.get(`queue:${userId}`);
        if (existingQueue) {
          clearTimeout(timeoutId);
          return res.json({
            success: true,
            message: '이미 대기열에 참가되어 있습니다',
            inQueue: true,
            queueTime: Math.floor((Date.now() - new Date(existingQueue.joinedAt).getTime()) / 1000),
            joinedAt: existingQueue.joinedAt
          });
        }

        // 대기열 참가
        const queueData = {
          userId,
          battletag: user.battleTag,
          mmr: user.mmr || 1500,
          preferredRoles: user.preferredRoles || [],
          joinedAt: new Date().toISOString()
        };

        await cacheService.set(`queue:${userId}`, queueData, 3600); // 1시간 TTL

        console.log(`사용자 ${user.battleTag} 대기열 참가`);

        clearTimeout(timeoutId);
        return res.json({
          success: true,
          message: '대기열에 참가했습니다',
          inQueue: true,
          queueTime: 0,
          joinedAt: queueData.joinedAt
        });

      } catch (error) {
        console.error('대기열 참가 오류:', error);
        clearTimeout(timeoutId);
        return res.status(401).json({ success: false, error: error.message });
      }
    }

    // /api/matchmaking/leave - 대기열 탈퇴
    if (pathParts[2] === 'leave' && req.method === 'POST') {
      try {
        const decoded = verifyToken(req.headers.authorization);
        const userId = decoded.id;

        // 대기열에서 제거
        await cacheService.del(`queue:${userId}`);

        console.log(`사용자 ${userId} 대기열 탈퇴`);

        clearTimeout(timeoutId);
        return res.json({
          success: true,
          message: '대기열에서 나왔습니다',
          inQueue: false
        });

      } catch (error) {
        console.error('대기열 탈퇴 오류:', error);
        clearTimeout(timeoutId);
        return res.status(401).json({ success: false, error: error.message });
      }
    }

    // /api/matchmaking/status - 대기열 상태 확인
    if (pathParts[2] === 'status' && req.method === 'GET') {
      try {
        const decoded = verifyToken(req.headers.authorization);
        const userId = decoded.id;

        // 대기열 상태 확인
        const queueData = await cacheService.get(`queue:${userId}`);
        const matchData = await cacheService.get(`match:${userId}`);

        let response = {
          success: true,
          inQueue: !!queueData,
          matchInProgress: !!matchData,
          queueTime: 0,
          joinedAt: null,
          matchInfo: null,
          serverTime: new Date().toISOString()
        };

        if (queueData) {
          const joinedAt = new Date(queueData.joinedAt);
          response.queueTime = Math.floor((Date.now() - joinedAt.getTime()) / 1000);
          response.joinedAt = queueData.joinedAt;
        }

        if (matchData) {
          response.matchInfo = matchData;
        }

        clearTimeout(timeoutId);
        return res.json(response);

      } catch (error) {
        console.error('대기열 상태 확인 오류:', error);
        clearTimeout(timeoutId);
        return res.status(401).json({ success: false, error: error.message });
      }
    }

    // /api/matchmaking/simulate - 시뮬레이션 매치 생성
    if (pathParts[2] === 'simulate' && req.method === 'POST') {
      try {
        const decoded = verifyToken(req.headers.authorization);

        // 시뮬레이션 매치 생성
        const maps = ['용의 둥지', '저주받은 골짜기', '공포의 정원', '하늘 사원', '거미 여왕의 무덤'];
        const randomMap = maps[Math.floor(Math.random() * maps.length)];

        const simulationMatch = {
          matchId: `sim_${Date.now()}`,
          map: randomMap,
          blueTeam: [
            { nickname: '시뮬플레이어1', mmr: 1500 },
            { nickname: '시뮬플레이어2', mmr: 1520 },
            { nickname: '시뮬플레이어3', mmr: 1480 },
            { nickname: '시뮬플레이어4', mmr: 1510 },
            { nickname: '시뮬플레이어5', mmr: 1490 }
          ],
          redTeam: [
            { nickname: '시뮬플레이어6', mmr: 1505 },
            { nickname: '시뮬플레이어7', mmr: 1515 },
            { nickname: '시뮬플레이어8', mmr: 1485 },
            { nickname: '시뮬플레이어9', mmr: 1495 },
            { nickname: '시뮬플레이어10', mmr: 1500 }
          ],
          createdAt: new Date().toISOString()
        };

        // 매치 정보 캐시에 저장
        await cacheService.set(`match:${decoded.id}`, simulationMatch, 1800); // 30분 TTL

        console.log(`시뮬레이션 매치 생성: ${simulationMatch.matchId}`);

        clearTimeout(timeoutId);
        return res.json({
          success: true,
          message: '시뮬레이션 매치가 생성되었습니다',
          matchInfo: simulationMatch
        });

      } catch (error) {
        console.error('시뮬레이션 매치 생성 오류:', error);
        clearTimeout(timeoutId);
        return res.status(401).json({ success: false, error: error.message });
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
