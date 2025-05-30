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
    console.log('Vercel /api/users 요청 처리:', req.method, req.url);

    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'https://hotstinder.vercel.app');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      clearTimeout(timeoutId);
      return res.status(200).end();
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

    // GET /api/users - 사용자 목록 조회
    if (req.method === 'GET' && pathParts.length === 2) {
      try {
        const decoded = verifyToken(req.headers.authorization);

        // 관리자 권한 확인
        if (decoded.role !== 'admin') {
          clearTimeout(timeoutId);
          return res.status(403).json({ success: false, error: '관리자 권한이 필요합니다' });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const { count, rows: users } = await User.findAndCountAll({
          attributes: ['id', 'battleTag', 'nickname', 'mmr', 'wins', 'losses', 'role', 'createdAt', 'lastLoginAt'],
          order: [['createdAt', 'DESC']],
          offset,
          limit
        });

        clearTimeout(timeoutId);
        return res.json({
          success: true,
          data: users,
          pagination: {
            page,
            limit,
            total: count,
            totalPages: Math.ceil(count / limit)
          }
        });

      } catch (error) {
        console.error('사용자 목록 조회 오류:', error);
        clearTimeout(timeoutId);
        return res.status(401).json({ success: false, error: error.message });
      }
    }

    // GET /api/users/:id - 특정 사용자 조회
    if (req.method === 'GET' && pathParts.length === 3) {
      try {
        const decoded = verifyToken(req.headers.authorization);
        const userId = pathParts[2];

        // 본인 또는 관리자만 조회 가능
        if (decoded.id !== userId && decoded.role !== 'admin') {
          clearTimeout(timeoutId);
          return res.status(403).json({ success: false, error: '권한이 없습니다' });
        }

        const user = await User.findOne({
          where: { bnetId: userId },
          attributes: ['id', 'battleTag', 'nickname', 'mmr', 'wins', 'losses', 'preferredRoles', 'previousTier', 'role', 'createdAt', 'lastLoginAt']
        });

        if (!user) {
          clearTimeout(timeoutId);
          return res.status(404).json({ success: false, error: '사용자를 찾을 수 없습니다' });
        }

        clearTimeout(timeoutId);
        return res.json({
          success: true,
          data: user
        });

      } catch (error) {
        console.error('사용자 조회 오류:', error);
        clearTimeout(timeoutId);
        return res.status(401).json({ success: false, error: error.message });
      }
    }

    // PUT /api/users/:id - 사용자 정보 수정
    if (req.method === 'PUT' && pathParts.length === 3) {
      try {
        const decoded = verifyToken(req.headers.authorization);
        const userId = pathParts[2];

        // 본인 또는 관리자만 수정 가능
        if (decoded.id !== userId && decoded.role !== 'admin') {
          clearTimeout(timeoutId);
          return res.status(403).json({ success: false, error: '권한이 없습니다' });
        }

        const { nickname, preferredRoles, previousTier } = req.body;

        const user = await User.findOne({ where: { bnetId: userId } });
        if (!user) {
          clearTimeout(timeoutId);
          return res.status(404).json({ success: false, error: '사용자를 찾을 수 없습니다' });
        }

        // 업데이트할 필드들
        const updateData = {};
        if (nickname !== undefined) updateData.nickname = nickname;
        if (preferredRoles !== undefined) updateData.preferredRoles = preferredRoles;
        if (previousTier !== undefined) updateData.previousTier = previousTier;

        await user.update(updateData);

        clearTimeout(timeoutId);
        return res.json({
          success: true,
          message: '사용자 정보가 업데이트되었습니다',
          data: user
        });

      } catch (error) {
        console.error('사용자 정보 수정 오류:', error);
        clearTimeout(timeoutId);
        return res.status(401).json({ success: false, error: error.message });
      }
    }

    // DELETE /api/users/:id - 사용자 삭제 (관리자 전용)
    if (req.method === 'DELETE' && pathParts.length === 3) {
      try {
        const decoded = verifyToken(req.headers.authorization);

        // 관리자 권한 확인
        if (decoded.role !== 'admin') {
          clearTimeout(timeoutId);
          return res.status(403).json({ success: false, error: '관리자 권한이 필요합니다' });
        }

        const userId = pathParts[2];

        const user = await User.findOne({ where: { bnetId: userId } });
        if (!user) {
          clearTimeout(timeoutId);
          return res.status(404).json({ success: false, error: '사용자를 찾을 수 없습니다' });
        }

        await user.destroy();

        clearTimeout(timeoutId);
        return res.json({
          success: true,
          message: '사용자가 삭제되었습니다'
        });

      } catch (error) {
        console.error('사용자 삭제 오류:', error);
        clearTimeout(timeoutId);
        return res.status(401).json({ success: false, error: error.message });
      }
    }

    // 지원하지 않는 경로
    clearTimeout(timeoutId);
    return res.status(404).json({ error: '요청한 리소스를 찾을 수 없습니다' });

  } catch (error) {
    console.error('/api/users 오류:', error);
    clearTimeout(timeoutId);
    return res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
};
