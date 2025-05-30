const { Sequelize, DataTypes } = require('sequelize');

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
    console.log('Vercel /api/sample-data 요청 처리:', req.method);

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

    // 샘플 데이터 조회
    const users = await User.findAll({
      attributes: ['id', 'battleTag', 'nickname', 'mmr', 'wins', 'losses', 'preferredRoles', 'previousTier'],
      order: [['mmr', 'DESC']],
      limit: 50
    });

    // 샘플 매치 데이터 생성
    const sampleMatches = [
      {
        id: 'match_1',
        map: '용의 둥지',
        gameMode: '영웅 리그',
        date: '2024년 1월 15일',
        time: '14:30',
        duration: '18:45',
        winner: 'blue',
        blueTeam: {
          name: '블루팀',
          avgMmr: 1650,
          players: users.slice(0, 5).map((user, index) => ({
            id: user.id,
            nickname: user.nickname || user.battleTag?.split('#')[0] || `플레이어${index + 1}`,
            role: ['탱커', '힐러', '원거리 암살자', '근접 암살자', '지원가'][index],
            hero: ['무라딘', '우서', '발라', '일리단', '타사다르'][index],
            kills: [2, 1, 8, 12, 3][index],
            deaths: [3, 2, 1, 4, 2][index],
            assists: [15, 18, 12, 8, 20][index],
            heroDamage: [25000, 5000, 45000, 38000, 15000][index],
            siegeDamage: [35000, 8000, 25000, 20000, 12000][index],
            healing: [0, 35000, 0, 0, 8000][index],
            experienceContribution: [15000, 12000, 18000, 16000, 14000][index],
            mmrBefore: user.mmr,
            mmrAfter: user.mmr + 25,
            mmrChange: 25
          }))
        },
        redTeam: {
          name: '레드팀',
          avgMmr: 1620,
          players: users.slice(5, 10).map((user, index) => ({
            id: user.id,
            nickname: user.nickname || user.battleTag?.split('#')[0] || `플레이어${index + 6}`,
            role: ['탱커', '힐러', '원거리 암살자', '근접 암살자', '지원가'][index],
            hero: ['아서스', '렉가르', '레이너', '제라툴', '타이커스'][index],
            kills: [1, 2, 6, 8, 4][index],
            deaths: [4, 3, 2, 5, 3][index],
            assists: [12, 15, 10, 6, 16][index],
            heroDamage: [22000, 8000, 42000, 35000, 28000][index],
            siegeDamage: [30000, 6000, 28000, 18000, 22000][index],
            healing: [0, 32000, 0, 0, 5000][index],
            experienceContribution: [14000, 11000, 17000, 15000, 16000][index],
            mmrBefore: user.mmr,
            mmrAfter: user.mmr - 25,
            mmrChange: -25
          }))
        }
      },
      {
        id: 'match_2',
        map: '저주받은 골짜기',
        gameMode: '영웅 리그',
        date: '2024년 1월 15일',
        time: '15:45',
        duration: '22:15',
        winner: 'red',
        blueTeam: {
          name: '블루팀',
          avgMmr: 1580,
          players: users.slice(10, 15).map((user, index) => ({
            id: user.id,
            nickname: user.nickname || user.battleTag?.split('#')[0] || `플레이어${index + 11}`,
            role: ['탱커', '힐러', '원거리 암살자', '근접 암살자', '지원가'][index],
            hero: ['디아블로', '리리', '제이나', '케리건', '아바투르'][index],
            kills: [3, 0, 7, 9, 2][index],
            deaths: [5, 4, 3, 6, 2][index],
            assists: [10, 16, 14, 8, 18][index],
            heroDamage: [28000, 3000, 48000, 41000, 12000][index],
            siegeDamage: [32000, 5000, 22000, 25000, 18000][index],
            healing: [0, 28000, 0, 0, 6000][index],
            experienceContribution: [16000, 13000, 19000, 17000, 20000][index],
            mmrBefore: user.mmr,
            mmrAfter: user.mmr - 20,
            mmrChange: -20
          }))
        },
        redTeam: {
          name: '레드팀',
          avgMmr: 1610,
          players: users.slice(15, 20).map((user, index) => ({
            id: user.id,
            nickname: user.nickname || user.battleTag?.split('#')[0] || `플레이어${index + 16}`,
            role: ['탱커', '힐러', '원거리 암살자', '근접 암살자', '지원가'][index],
            hero: ['요한나', '말퓨리온', '발라', '소냐', '태사다르'][index],
            kills: [2, 1, 11, 8, 5][index],
            deaths: [2, 1, 2, 4, 1][index],
            assists: [18, 22, 15, 12, 24][index],
            heroDamage: [26000, 6000, 52000, 44000, 18000][index],
            siegeDamage: [38000, 8000, 30000, 28000, 15000][index],
            healing: [0, 38000, 0, 0, 9000][index],
            experienceContribution: [17000, 15000, 21000, 19000, 18000][index],
            mmrBefore: user.mmr,
            mmrAfter: user.mmr + 20,
            mmrChange: 20
          }))
        }
      }
    ];

    console.log(`샘플 데이터 조회 완료: 사용자 ${users.length}명, 매치 ${sampleMatches.length}개`);

    clearTimeout(timeoutId);
    return res.json({
      success: true,
      data: {
        users: users.map(user => ({
          id: user.id,
          battleTag: user.battleTag,
          nickname: user.nickname,
          mmr: user.mmr,
          wins: user.wins,
          losses: user.losses,
          preferredRoles: user.preferredRoles,
          previousTier: user.previousTier
        })),
        matches: sampleMatches,
        stats: {
          totalUsers: users.length,
          totalMatches: sampleMatches.length,
          avgMmr: Math.round(users.reduce((sum, user) => sum + user.mmr, 0) / users.length) || 1500
        }
      }
    });

  } catch (error) {
    console.error('/api/sample-data 오류:', error);
    clearTimeout(timeoutId);
    return res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
};
