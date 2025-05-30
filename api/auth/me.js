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
    console.log('Vercel /api/auth/me 요청 처리:', req.method);

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

    // 사용자 정보 조회
    const user = await User.findOne({
      where: { bnetId: decoded.id },
      attributes: ['id', 'battleTag', 'nickname', 'email', 'role', 'mmr', 'wins', 'losses', 'preferredRoles', 'previousTier', 'isProfileComplete', 'createdAt', 'lastLoginAt']
    });

    if (!user) {
      clearTimeout(timeoutId);
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    // 사용자 정보 반환
    clearTimeout(timeoutId);
    return res.json({
      success: true,
      user: {
        id: user.bnetId || user.id,
        battleTag: user.battleTag,
        nickname: user.nickname,
        email: user.email,
        role: user.role,
        mmr: user.mmr,
        wins: user.wins,
        losses: user.losses,
        preferredRoles: user.preferredRoles,
        previousTier: user.previousTier,
        isProfileComplete: user.isProfileComplete,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      }
    });

  } catch (error) {
    console.error('/api/auth/me 오류:', error);
    clearTimeout(timeoutId);
    return res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
};
