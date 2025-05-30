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
    logging: false,
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

module.exports = async function handler(req, res) {
  const timeoutId = setTimeout(() => {
    if (!res.headersSent) {
      console.error('API 타임아웃 발생');
      res.status(504).json({
        error: '요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.',
        timeout: true
      });
    }
  }, 25000);

  try {
    console.log('Vercel /api/auth/dashboard 요청 처리:', req.method);

    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'https://hotstinder.vercel.app');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      clearTimeout(timeoutId);
      return res.status(200).end();
    }

    if (req.method !== 'GET') {
      clearTimeout(timeoutId);
      return res.status(405).json({ error: '지원하지 않는 메서드입니다' });
    }

    // JWT 토큰 검증
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      clearTimeout(timeoutId);
      return res.status(401).json({ error: '인증 토큰이 필요합니다' });
    }

    const token = authHeader.substring(7);
    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    } catch (err) {
      clearTimeout(timeoutId);
      return res.status(401).json({ error: '유효하지 않은 토큰입니다' });
    }

    // 관리자 권한 확인
    if (decoded.role !== 'admin') {
      clearTimeout(timeoutId);
      return res.status(403).json({ error: '관리자 권한이 필요합니다' });
    }

    // PostgreSQL 연결
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

    // 대시보드 통계 수집
    const [
      totalUsers,
      totalMatches,
      completedMatches,
      activeMatches,
      recentUsers,
      recentMatches
    ] = await Promise.all([
      // 전체 사용자 수
      User.count(),

      // 전체 매치 수
      Match.count(),

      // 완료된 매치 수
      Match.count({ where: { status: 'completed' } }),

      // 진행 중인 매치 수
      Match.count({ where: { status: 'in_progress' } }),

      // 최근 가입한 사용자 (최근 7일)
      User.count({
        where: {
          createdAt: {
            [sequelize.Sequelize.Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),

      // 최근 매치 (최근 24시간)
      Match.count({
        where: {
          createdAt: {
            [sequelize.Sequelize.Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    // 최근 활동 조회
    const recentActivity = await Match.findAll({
      limit: 10,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['battleTag', 'nickname']
        }
      ],
      attributes: ['id', 'status', 'gameMode', 'mapName', 'createdAt']
    });

    // 사용자 통계 (MMR 분포)
    const userStats = await User.findAll({
      attributes: [
        [sequelize.fn('AVG', sequelize.col('mmr')), 'avgMmr'],
        [sequelize.fn('MAX', sequelize.col('mmr')), 'maxMmr'],
        [sequelize.fn('MIN', sequelize.col('mmr')), 'minMmr']
      ],
      raw: true
    });

    const dashboardData = {
      stats: {
        totalUsers,
        totalMatches,
        completedMatches,
        activeMatches,
        recentUsers,
        recentMatches,
        avgMmr: Math.round(userStats[0]?.avgMmr || 1500),
        maxMmr: userStats[0]?.maxMmr || 1500,
        minMmr: userStats[0]?.minMmr || 1500
      },
      recentActivity: recentActivity.map(match => ({
        id: match.id,
        type: 'match',
        status: match.status,
        gameMode: match.gameMode,
        mapName: match.mapName,
        creator: match.creator?.battleTag || match.creator?.nickname || '알 수 없음',
        createdAt: match.createdAt
      })),
      serverInfo: {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0'
      }
    };

    console.log('대시보드 데이터 조회 완료:', {
      totalUsers,
      totalMatches,
      completedMatches,
      activeMatches
    });

    clearTimeout(timeoutId);
    return res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('/api/auth/dashboard 오류:', error);
    clearTimeout(timeoutId);
    return res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
};
