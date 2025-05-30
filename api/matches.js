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
    preferredRoles: {
      type: DataTypes.JSONB,
      defaultValue: ['전체'],
      field: 'preferred_roles'
    },
    role: {
      type: DataTypes.STRING(50),
      defaultValue: 'user'
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
    console.log('Vercel /api/matches 요청 처리:', req.method, req.url);

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

    // GET /api/matches - 매치 목록 조회
    if (req.method === 'GET' && pathParts.length === 2) {
      try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const status = req.query.status || 'all';

        let whereCondition = {};
        if (status !== 'all') {
          whereCondition.status = status;
        }

        const { count, rows: matches } = await Match.findAndCountAll({
          where: whereCondition,
          order: [['created_at', 'DESC']],
          offset,
          limit,
          include: [
            {
              model: User,
              as: 'creator',
              attributes: ['id', 'battleTag', 'nickname']
            },
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

        clearTimeout(timeoutId);
        return res.json({
          success: true,
          data: matches,
          pagination: {
            page,
            limit,
            total: count,
            totalPages: Math.ceil(count / limit)
          }
        });

      } catch (error) {
        console.error('매치 목록 조회 오류:', error);
        clearTimeout(timeoutId);
        return res.status(500).json({ success: false, error: error.message });
      }
    }

    // GET /api/matches/:id - 특정 매치 조회
    if (req.method === 'GET' && pathParts.length === 3) {
      try {
        const matchId = pathParts[2];

        const match = await Match.findOne({
          where: { id: matchId },
          include: [
            {
              model: User,
              as: 'creator',
              attributes: ['id', 'battleTag', 'nickname']
            },
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

        if (!match) {
          clearTimeout(timeoutId);
          return res.status(404).json({ success: false, error: '매치를 찾을 수 없습니다' });
        }

        clearTimeout(timeoutId);
        return res.json({
          success: true,
          data: match
        });

      } catch (error) {
        console.error('매치 조회 오류:', error);
        clearTimeout(timeoutId);
        return res.status(500).json({ success: false, error: error.message });
      }
    }

    // POST /api/matches - 새 매치 생성
    if (req.method === 'POST' && pathParts.length === 2) {
      try {
        const decoded = verifyToken(req.headers.authorization);
        const { gameMode, mapName, maxPlayers } = req.body;

        // 사용자 정보 조회
        const user = await User.findOne({ where: { bnetId: decoded.id } });
        if (!user) {
          clearTimeout(timeoutId);
          return res.status(404).json({ success: false, error: '사용자를 찾을 수 없습니다' });
        }

        // 새 매치 생성
        const newMatch = await Match.create({
          gameMode: gameMode || '일반 게임',
          mapName: mapName || '랜덤',
          maxPlayers: maxPlayers || 10,
          currentPlayers: 0,
          createdBy: user.id,
          status: 'waiting'
        });

        clearTimeout(timeoutId);
        return res.json({
          success: true,
          message: '매치가 생성되었습니다',
          data: newMatch
        });

      } catch (error) {
        console.error('매치 생성 오류:', error);
        clearTimeout(timeoutId);
        return res.status(401).json({ success: false, error: error.message });
      }
    }

    // PUT /api/matches/:id - 매치 정보 수정
    if (req.method === 'PUT' && pathParts.length === 3) {
      try {
        const decoded = verifyToken(req.headers.authorization);
        const matchId = pathParts[2];

        const match = await Match.findOne({ where: { id: matchId } });
        if (!match) {
          clearTimeout(timeoutId);
          return res.status(404).json({ success: false, error: '매치를 찾을 수 없습니다' });
        }

        // 매치 생성자 또는 관리자만 수정 가능
        const user = await User.findOne({ where: { bnetId: decoded.id } });
        if (!user || (match.createdBy !== user.id && decoded.role !== 'admin')) {
          clearTimeout(timeoutId);
          return res.status(403).json({ success: false, error: '권한이 없습니다' });
        }

        const { status, winner, gameDuration, notes } = req.body;

        // 업데이트할 필드들
        const updateData = {};
        if (status !== undefined) updateData.status = status;
        if (winner !== undefined) updateData.winner = winner;
        if (gameDuration !== undefined) updateData.gameDuration = gameDuration;
        if (notes !== undefined) updateData.notes = notes;

        if (status === 'in_progress' && !match.startedAt) {
          updateData.startedAt = new Date();
        }
        if (status === 'completed' && !match.endedAt) {
          updateData.endedAt = new Date();
        }

        await match.update(updateData);

        clearTimeout(timeoutId);
        return res.json({
          success: true,
          message: '매치 정보가 업데이트되었습니다',
          data: match
        });

      } catch (error) {
        console.error('매치 수정 오류:', error);
        clearTimeout(timeoutId);
        return res.status(401).json({ success: false, error: error.message });
      }
    }

    // DELETE /api/matches/:id - 매치 삭제
    if (req.method === 'DELETE' && pathParts.length === 3) {
      try {
        const decoded = verifyToken(req.headers.authorization);
        const matchId = pathParts[2];

        const match = await Match.findOne({ where: { id: matchId } });
        if (!match) {
          clearTimeout(timeoutId);
          return res.status(404).json({ success: false, error: '매치를 찾을 수 없습니다' });
        }

        // 매치 생성자 또는 관리자만 삭제 가능
        const user = await User.findOne({ where: { bnetId: decoded.id } });
        if (!user || (match.createdBy !== user.id && decoded.role !== 'admin')) {
          clearTimeout(timeoutId);
          return res.status(403).json({ success: false, error: '권한이 없습니다' });
        }

        // 관련 참가자 데이터도 함께 삭제
        await MatchParticipant.destroy({ where: { matchId: match.id } });
        await match.destroy();

        clearTimeout(timeoutId);
        return res.json({
          success: true,
          message: '매치가 삭제되었습니다'
        });

      } catch (error) {
        console.error('매치 삭제 오류:', error);
        clearTimeout(timeoutId);
        return res.status(401).json({ success: false, error: error.message });
      }
    }

    // 지원하지 않는 경로
    clearTimeout(timeoutId);
    return res.status(404).json({ error: '요청한 리소스를 찾을 수 없습니다' });

  } catch (error) {
    console.error('/api/matches 오류:', error);
    clearTimeout(timeoutId);
    return res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
};
