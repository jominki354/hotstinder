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
    console.log('Vercel /api/init-data 요청 처리:', req.method);

    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'https://hotstinder.vercel.app');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      clearTimeout(timeoutId);
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
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

    // 더미 사용자 데이터 생성
    const dummyUsers = [
      {
        bnetId: 'dummy_1',
        battleTag: '테스트유저1#1234',
        nickname: '테스트유저1',
        mmr: 1600,
        wins: 15,
        losses: 10,
        preferredRoles: ['탱커', '힐러'],
        previousTier: 'gold',
        isProfileComplete: true
      },
      {
        bnetId: 'dummy_2',
        battleTag: '테스트유저2#5678',
        nickname: '테스트유저2',
        mmr: 1450,
        wins: 8,
        losses: 12,
        preferredRoles: ['원거리 암살자'],
        previousTier: 'silver',
        isProfileComplete: true
      },
      {
        bnetId: 'dummy_3',
        battleTag: '테스트유저3#9012',
        nickname: '테스트유저3',
        mmr: 1750,
        wins: 25,
        losses: 8,
        preferredRoles: ['근접 암살자', '브루저'],
        previousTier: 'platinum',
        isProfileComplete: true
      },
      {
        bnetId: 'dummy_4',
        battleTag: '테스트유저4#3456',
        nickname: '테스트유저4',
        mmr: 1300,
        wins: 5,
        losses: 15,
        preferredRoles: ['지원가'],
        previousTier: 'bronze',
        isProfileComplete: true
      },
      {
        bnetId: 'dummy_5',
        battleTag: '테스트유저5#7890',
        nickname: '테스트유저5',
        mmr: 1850,
        wins: 30,
        losses: 12,
        preferredRoles: ['탱커', '브루저'],
        previousTier: 'diamond',
        isProfileComplete: true
      }
    ];

    let createdCount = 0;
    let existingCount = 0;

    for (const userData of dummyUsers) {
      try {
        // 이미 존재하는 사용자인지 확인
        const existingUser = await User.findOne({ where: { bnetId: userData.bnetId } });

        if (existingUser) {
          existingCount++;
          console.log(`사용자 ${userData.battleTag} 이미 존재함`);
        } else {
          // 새 사용자 생성
          await User.create(userData);
          createdCount++;
          console.log(`사용자 ${userData.battleTag} 생성 완료`);
        }
      } catch (error) {
        console.error(`사용자 ${userData.battleTag} 생성 실패:`, error.message);
      }
    }

    console.log(`더미 데이터 초기화 완료: 생성 ${createdCount}개, 기존 ${existingCount}개`);

    clearTimeout(timeoutId);
    return res.json({
      success: true,
      message: '더미 데이터 초기화가 완료되었습니다',
      stats: {
        created: createdCount,
        existing: existingCount,
        total: dummyUsers.length
      }
    });

  } catch (error) {
    console.error('/api/init-data 오류:', error);
    clearTimeout(timeoutId);
    return res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
};
