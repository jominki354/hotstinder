const bcrypt = require('bcryptjs');
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
    console.log('Vercel /api/auth/admin-login 요청 처리:', req.method);

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

    const { email, password } = req.body;

    if (!email || !password) {
      clearTimeout(timeoutId);
      return res.status(400).json({ error: '이메일과 비밀번호를 입력해주세요' });
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

    // 관리자 계정 조회
    const user = await User.findOne({
      where: {
        email: email,
        role: 'admin'
      }
    });

    if (!user) {
      clearTimeout(timeoutId);
      return res.status(401).json({ error: '관리자 계정을 찾을 수 없습니다' });
    }

    // 비밀번호 확인
    if (!user.password) {
      clearTimeout(timeoutId);
      return res.status(401).json({ error: '비밀번호가 설정되지 않은 계정입니다' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      clearTimeout(timeoutId);
      return res.status(401).json({ error: '비밀번호가 일치하지 않습니다' });
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      {
        id: user.bnetId || user.id,
        email: user.email,
        role: user.role,
        battleTag: user.battleTag
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    // 마지막 로그인 시간 업데이트
    await user.update({ lastLoginAt: new Date() });

    console.log(`관리자 로그인 성공: ${user.email}`);

    clearTimeout(timeoutId);
    return res.json({
      success: true,
      message: '관리자 로그인 성공',
      token,
      user: {
        id: user.bnetId || user.id,
        email: user.email,
        battleTag: user.battleTag,
        nickname: user.nickname,
        role: user.role,
        lastLoginAt: user.lastLoginAt
      }
    });

  } catch (error) {
    console.error('/api/auth/admin-login 오류:', error);
    clearTimeout(timeoutId);
    return res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
};
