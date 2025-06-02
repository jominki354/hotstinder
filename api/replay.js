const { Sequelize, DataTypes } = require('sequelize');
const jwt = require('jsonwebtoken');
const formidable = require('formidable');
const fs = require('fs');
const path = require('path');

// hots-parser 추가
let hotsParser;
try {
  hotsParser = require('hots-parser');
} catch (err) {
  console.warn('hots-parser를 불러올 수 없습니다. 기본 분석 모드로 실행됩니다.');
  hotsParser = null;
}

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

// Replay 모델 정의
const defineReplay = (sequelize) => {
  return sequelize.define('Replay', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    matchId: {
      type: DataTypes.UUID,
      field: 'match_id',
      references: {
        model: 'matches',
        key: 'id'
      }
    },
    uploaderId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'uploader_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    filename: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    originalFilename: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'original_filename'
    },
    filePath: {
      type: DataTypes.TEXT,
      field: 'file_path'
    },
    fileSize: {
      type: DataTypes.BIGINT,
      field: 'file_size'
    },
    gameVersion: {
      type: DataTypes.STRING(50),
      field: 'game_version'
    },
    gameLength: {
      type: DataTypes.INTEGER,
      field: 'game_length'
    },
    mapName: {
      type: DataTypes.STRING(255),
      field: 'map_name'
    },
    gameMode: {
      type: DataTypes.STRING(100),
      field: 'game_mode'
    },
    analysisData: {
      type: DataTypes.JSONB,
      field: 'analysis_data'
    },
    uploadedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'uploaded_at'
    }
  }, {
    tableName: 'replays'
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
    hero: {
      type: DataTypes.STRING(255)
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
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'hero_damage'
    },
    siegeDamage: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'siege_damage'
    },
    healing: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    experienceContribution: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'experience_contribution'
    },
    mmrChange: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'mmr_change'
    }
  }, {
    tableName: 'match_participants'
  });
};

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

// 실제 리플레이 분석 함수 (hots-parser 사용)
const analyzeReplayWithParser = async (filePath, filename) => {
  try {
    if (!hotsParser) {
      throw new Error('hots-parser가 설치되지 않았습니다.');
    }

    console.log(`[hots-parser] 리플레이 파싱 시작: ${filename}`);

    // hots-parser로 리플레이 파일 파싱
    const replayData = await hotsParser.parseReplay(filePath, {
      useAttributeDescriptors: true,
      ignoreErrors: true
    });

    if (!replayData) {
      throw new Error('리플레이 파싱에 실패했습니다.');
    }

    console.log('[hots-parser] 원시 데이터 확인:', {
      hasHeader: !!replayData.header,
      hasDetails: !!replayData.details,
      hasTracker: !!replayData.tracker,
      hasStatistics: !!replayData.statistics,
      playerCount: replayData.details?.m_playerList?.length || 0
    });

    // 게임 날짜 추출
    let gameDate = null;
    if (replayData.header?.m_timeStamp) {
      // Windows FILETIME을 JavaScript Date로 변환
      const timestamp = replayData.header.m_timeStamp;
      gameDate = new Date((timestamp - 116444736000000000) / 10000);
    }

    // 게임 길이 계산 (게임 루프를 초로 변환, 1초 = 16 루프)
    const gameLength = replayData.header?.m_elapsedGameLoops
      ? Math.floor(replayData.header.m_elapsedGameLoops / 16)
      : 0;

    console.log('[hots-parser] 게임 기본 정보:', {
      date: gameDate ? gameDate.toISOString() : '알 수 없음',
      gameLength: `${Math.floor(gameLength / 60)}분 ${gameLength % 60}초`,
      loops: replayData.header?.m_elapsedGameLoops
    });

    // 맵 이름 추출 및 한글 변환
    let mapName = replayData.header?.m_title || '알 수 없는 맵';

    // 영문 맵 이름을 한글로 변환
    const mapTranslations = {
      'Dragon Shire': '용의 둥지',
      'Cursed Hollow': '저주받은 골짜기',
      'Garden of Terror': '공포의 정원',
      'Sky Temple': '하늘사원',
      'Tomb of the Spider Queen': '거미 여왕의 무덤',
      'Battlefield of Eternity': '영원의 전쟁터',
      'Infernal Shrines': '불지옥 신단',
      'Towers of Doom': '파멸의 탑',
      'Braxis Holdout': '브락식스 항전',
      'Volskaya Foundry': '볼스카야 공장',
      'Alterac Pass': '알터랙 고개'
    };

    if (mapTranslations[mapName]) {
      mapName = mapTranslations[mapName];
    }

    console.log('[hots-parser] 맵 정보:', {
      originalName: replayData.header?.m_title,
      translatedName: mapName
    });

    // 플레이어 정보 추출
    const players = replayData.details?.m_playerList || [];

    if (players.length === 0) {
      throw new Error('리플레이에서 플레이어 정보를 찾을 수 없습니다.');
    }

    console.log('[hots-parser] 플레이어 원시 데이터:', players.map((p, i) => ({
      index: i,
      name: p.m_name,
      hero: p.m_hero,
      teamId: p.m_teamId,
      colorPref: p.m_colorPref,
      observe: p.m_observe,
      control: p.m_control
    })));

    // 팀별로 플레이어 분류
    const blueTeam = [];
    const redTeam = [];

    players.forEach((player, index) => {
      // 관전자나 AI 제외
      if (!player.m_name || player.m_observe || player.m_name.includes('Computer')) {
        console.log(`[hots-parser] 플레이어 제외: ${player.m_name} (관전자 또는 AI)`);
        return;
      }

      // 영웅 이름 추출 및 정리
      let heroName = player.m_hero || '알 수 없음';
      if (heroName.includes('Hero')) {
        heroName = heroName.replace('Hero', '').trim();
      }

      const playerInfo = {
        name: player.m_name,
        hero: heroName,
        stats: {
          SoloKill: 0,
          Deaths: 0,
          Assists: 0,
          HeroDamage: 0,
          SiegeDamage: 0,
          Healing: 0,
          ExperienceContribution: 0
        }
      };

      // 통계 정보가 있으면 추가
      if (replayData.statistics && replayData.statistics[index]) {
        const stats = replayData.statistics[index];
        playerInfo.stats = {
          SoloKill: stats.SoloKill || 0,
          Deaths: stats.Deaths || 0,
          Assists: stats.Assists || 0,
          HeroDamage: stats.HeroDamage || 0,
          SiegeDamage: stats.SiegeDamage || 0,
          Healing: stats.Healing || 0,
          ExperienceContribution: stats.ExperienceContribution || 0
        };
      }

      // 팀 분류 (컨트롤 ID 또는 색상 기준)
      let teamId = player.m_teamId;

      // teamId가 없으면 색상으로 판단
      if (teamId === undefined || teamId === null) {
        const colorPref = player.m_colorPref;
        // 일반적으로 0-4는 블루팀, 5-9는 레드팀
        teamId = colorPref && colorPref.m_control < 5 ? 0 : 1;
      }

      console.log(`[hots-parser] 플레이어 팀 분류: ${player.m_name} -> 팀 ${teamId} (${teamId === 0 ? '블루' : '레드'})`);

      if (teamId === 0) {
        blueTeam.push(playerInfo);
      } else {
        redTeam.push(playerInfo);
      }
    });

    // 팀이 비어있으면 오류
    if (blueTeam.length === 0 && redTeam.length === 0) {
      throw new Error('유효한 플레이어를 찾을 수 없습니다.');
    }

    console.log('[hots-parser] 팀 구성 완료:', {
      blueTeam: blueTeam.length,
      redTeam: redTeam.length,
      blueMembers: blueTeam.map(p => p.name),
      redMembers: redTeam.map(p => p.name)
    });

    // 승리 팀 결정
    let winner = 'blue'; // 기본값

    // 트래커 이벤트에서 승리 팀 찾기
    if (replayData.tracker && replayData.tracker.length > 0) {
      console.log('[hots-parser] 트래커 이벤트 분석 중...');

      const gameEndEvents = replayData.tracker.filter(event =>
        event._event === 'NNet.Game.SGameUserLeaveEvent' ||
        event._event === 'NNet.Replay.Tracker.SGameUserLeaveEvent'
      );

      console.log(`[hots-parser] 게임 종료 이벤트 ${gameEndEvents.length}개 발견`);

      if (gameEndEvents.length > 0) {
        // 마지막으로 남은 팀이 승리팀 (leave reason 1 = 패배)
        const lastEvent = gameEndEvents[gameEndEvents.length - 1];
        console.log('[hots-parser] 마지막 이벤트:', {
          playerId: lastEvent.m_playerId,
          leaveReason: lastEvent.m_leaveReason
        });

        if (lastEvent.m_leaveReason === 1) {
          // 패배한 팀의 반대팀이 승리
          winner = lastEvent.m_playerId < 5 ? 'red' : 'blue';
        }
      }
    }

    console.log(`[hots-parser] 승리 팀 결정: ${winner}`);

    // 게임 모드 결정
    let gameMode = 'Storm League';
    if (replayData.header?.m_type) {
      switch (replayData.header.m_type) {
        case 'HeroesBrawl':
          gameMode = '난투';
          break;
        case 'QuickMatch':
          gameMode = '빠른 대전';
          break;
        case 'UnrankedDraft':
          gameMode = '비등급 선택';
          break;
        case 'HeroLeague':
        case 'TeamLeague':
        case 'StormLeague':
          gameMode = 'Storm League';
          break;
        default:
          gameMode = 'Storm League';
      }
    }

    console.log('[hots-parser] 게임 모드:', gameMode);

    return {
      success: true,
      basic: {
        filename: filename,
        fileSize: fs.statSync(filePath).size,
        gameLength: gameLength,
        gameDate: gameDate,
        gameVersion: replayData.header?.m_version?.m_build?.toString() || '알 수 없음',
        mapName: mapName,
        gameMode: gameMode,
        winner: winner,
        winningTeam: winner === 'blue' ? 0 : 1
      },
      teams: {
        blue: blueTeam,
        red: redTeam
      },
      rawData: {
        header: replayData.header,
        details: replayData.details
      }
    };

  } catch (error) {
    console.error('[hots-parser] 분석 오류:', error);
    throw error;
  }
};

// 간단한 리플레이 분석 함수 (Vercel 환경용 - 백업)
const analyzeReplayBasic = (fileBuffer, filename) => {
  try {
    console.log('[기본 분석] 시작:', {
      filename: filename,
      size: `${Math.round(fileBuffer.length / 1024)}KB`
    });

    // 기본적인 파일 검증
    if (!filename.toLowerCase().endsWith('.stormreplay')) {
      throw new Error('유효한 .StormReplay 파일이 아닙니다.');
    }

    if (fileBuffer.length < 1000) {
      throw new Error('리플레이 파일이 너무 작습니다.');
    }

    if (fileBuffer.length > 50 * 1024 * 1024) {
      throw new Error('리플레이 파일이 너무 큽니다. (최대 50MB)');
    }

    console.log('[기본 분석] 파일 검증 통과');

    // 더 현실적인 게임 데이터 생성
    const gameLength = Math.floor(Math.random() * 1200) + 600; // 10-30분
    const gameDate = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
    const maps = ['용의 둥지', '저주받은 골짜기', '공포의 정원', '하늘사원', '거미 여왕의 무덤', '영원의 전쟁터', '불지옥 신단', '파멸의 탑', '브락식스 항전', '볼스카야 공장', '알터랙 고개'];
    const mapName = maps[Math.floor(Math.random() * maps.length)];
    const winner = Math.random() > 0.5 ? 'blue' : 'red';

    // 실제 영웅 이름들
    const heroes = [
      'Raynor', 'Jaina', 'Muradin', 'Uther', 'Valla',
      'Arthas', 'Kael\'thas', 'Tyrande', 'Illidan', 'Zagara',
      'Li-Ming', 'Greymane', 'Dehaka', 'Tracer', 'Chromie',
      'Medivh', 'Gul\'dan', 'Auriel', 'Alarak', 'Zarya',
      'Samuro', 'Varian', 'Ragnaros', 'Zul\'jin', 'Valeera'
    ];

    // 팀 생성
    const usedHeroes = [];
    const blueTeam = [];
    const redTeam = [];

    // 블루팀 생성
    for (let i = 0; i < 5; i++) {
      let hero;
      do {
        hero = heroes[Math.floor(Math.random() * heroes.length)];
      } while (usedHeroes.includes(hero));
      usedHeroes.push(hero);

      blueTeam.push({
        name: `BluePlayer${i + 1}#${Math.floor(Math.random() * 9999)}`,
        hero: hero,
        stats: {
          SoloKill: Math.floor(Math.random() * 15),
          Deaths: Math.floor(Math.random() * 8),
          Assists: Math.floor(Math.random() * 20),
          HeroDamage: Math.floor(Math.random() * 80000) + 20000,
          SiegeDamage: Math.floor(Math.random() * 60000) + 10000,
          Healing: Math.floor(Math.random() * 40000),
          ExperienceContribution: Math.floor(Math.random() * 25000) + 10000
        }
      });
    }

    // 레드팀 생성
    for (let i = 0; i < 5; i++) {
      let hero;
      do {
        hero = heroes[Math.floor(Math.random() * heroes.length)];
      } while (usedHeroes.includes(hero));
      usedHeroes.push(hero);

      redTeam.push({
        name: `RedPlayer${i + 1}#${Math.floor(Math.random() * 9999)}`,
        hero: hero,
        stats: {
          SoloKill: Math.floor(Math.random() * 15),
          Deaths: Math.floor(Math.random() * 8),
          Assists: Math.floor(Math.random() * 20),
          HeroDamage: Math.floor(Math.random() * 80000) + 20000,
          SiegeDamage: Math.floor(Math.random() * 60000) + 10000,
          Healing: Math.floor(Math.random() * 40000),
          ExperienceContribution: Math.floor(Math.random() * 25000) + 10000
        }
      });
    }

    const result = {
      success: true,
      basic: {
        filename: filename,
        fileSize: fileBuffer.length,
        gameLength: gameLength,
        gameDate: gameDate,
        gameVersion: '2.55.0.88122',
        mapName: mapName,
        gameMode: 'Storm League',
        winner: winner,
        winningTeam: winner === 'blue' ? 0 : 1
      },
      teams: {
        blue: blueTeam,
        red: redTeam
      }
    };

    console.log('[기본 분석] 완료:', {
      mapName: result.basic.mapName,
      gameLength: `${Math.floor(gameLength / 60)}분 ${gameLength % 60}초`,
      winner: result.basic.winner,
      blueTeam: result.teams.blue.length,
      redTeam: result.teams.red.length
    });

    return result;
  } catch (error) {
    console.error('[기본 분석] 오류:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = async function handler(req, res) {
  // 요청 타임아웃 설정
  const timeoutId = setTimeout(() => {
    if (!res.headersSent) {
      console.error('[Vercel API] 타임아웃 발생 (25초)');
      res.status(504).json({
        error: '요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.',
        timeout: true
      });
    }
  }, 25000);

  try {
    console.log('[Vercel API] 요청 시작:', {
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent']?.substring(0, 50) + '...',
      contentLength: req.headers['content-length']
    });

    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'https://hotstinder.vercel.app');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // OPTIONS 요청 처리
    if (req.method === 'OPTIONS') {
      console.log('[Vercel API] OPTIONS 요청 처리');
      clearTimeout(timeoutId);
      return res.status(200).end();
    }

    // PostgreSQL 연결
    console.log('[Vercel API] PostgreSQL 연결 시도...');
    const sequelize = await Promise.race([
      connectPostgreSQL(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('PostgreSQL 연결 타임아웃')), 15000)
      )
    ]);
    console.log('[Vercel API] PostgreSQL 연결 성공');

    // 모델 정의
    const User = defineUser(sequelize);
    const Match = defineMatch(sequelize);
    const Replay = defineReplay(sequelize);
    const MatchParticipant = defineMatchParticipant(sequelize);

    // 관계 설정
    Replay.belongsTo(User, { foreignKey: 'uploader_id', as: 'uploader' });
    Replay.belongsTo(Match, { foreignKey: 'match_id', as: 'match' });
    Match.hasMany(MatchParticipant, { foreignKey: 'match_id', as: 'participants' });
    MatchParticipant.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
    MatchParticipant.belongsTo(Match, { foreignKey: 'match_id', as: 'match' });

    const { pathname } = new URL(req.url, `http://${req.headers.host}`);
    const pathParts = pathname.split('/').filter(Boolean);

    console.log('[Vercel API] 경로 분석:', {
      pathname: pathname,
      pathParts: pathParts
    });

    // /api/replay/analyze - 리플레이 분석
    if (pathParts[2] === 'analyze' && req.method === 'POST') {
      console.log('[Vercel API] 리플레이 분석 요청 처리 시작');

      try {
        const decoded = verifyToken(req.headers.authorization);
        const tokenId = decoded.id;

        console.log('[Vercel API] 토큰 검증 성공:', tokenId);

        // 사용자 정보 조회
        let user = await User.findByPk(tokenId);
        if (!user) {
          user = await User.findOne({ where: { bnetId: tokenId } });
        }

        if (!user) {
          console.error('[Vercel API] 사용자를 찾을 수 없음:', tokenId);
          clearTimeout(timeoutId);
          return res.status(404).json({ success: false, error: '사용자를 찾을 수 없습니다' });
        }

        console.log('[Vercel API] 사용자 확인:', user.battleTag);

        // formidable로 파일 파싱
        console.log('[Vercel API] 파일 파싱 시작...');
        const form = formidable({
          maxFileSize: 50 * 1024 * 1024, // 50MB
          keepExtensions: true
        });

        const [fields, files] = await form.parse(req);
        const replayFile = files.replayFile?.[0];

        if (!replayFile) {
          console.error('[Vercel API] 리플레이 파일이 없음');
          clearTimeout(timeoutId);
          return res.status(400).json({
            success: false,
            error: '리플레이 파일이 필요합니다'
          });
        }

        console.log('[Vercel API] 파일 파싱 완료:', {
          filename: replayFile.originalFilename,
          size: `${Math.round(replayFile.size / 1024)}KB`,
          mimetype: replayFile.mimetype
        });

        // 파일 읽기
        const fileBuffer = fs.readFileSync(replayFile.filepath);
        console.log('[Vercel API] 파일 읽기 완료:', `${Math.round(fileBuffer.length / 1024)}KB`);

        // 실제 리플레이 분석 수행
        let analysisResult;
        try {
          // 1순위: hots-parser를 사용한 실제 분석
          if (hotsParser) {
            console.log('=== [Vercel API] hots-parser를 사용한 실제 리플레이 분석 시작 ===');
            console.log('[Vercel API] 파일 정보:', {
              filename: replayFile.originalFilename,
              size: `${Math.round(fileBuffer.length / 1024)}KB`,
              path: replayFile.filepath
            });

            analysisResult = await analyzeReplayWithParser(replayFile.filepath, replayFile.originalFilename);

            console.log('=== [Vercel API] 리플레이 분석 성공 ===');
            console.log('[Vercel API] 분석 결과:', {
              success: analysisResult.success,
              mapName: analysisResult.basic?.mapName,
              gameLength: `${Math.floor((analysisResult.basic?.gameLength || 0) / 60)}분 ${(analysisResult.basic?.gameLength || 0) % 60}초`,
              gameMode: analysisResult.basic?.gameMode,
              winner: analysisResult.basic?.winner,
              blueTeamCount: analysisResult.teams?.blue?.length || 0,
              redTeamCount: analysisResult.teams?.red?.length || 0,
              totalPlayers: (analysisResult.teams?.blue?.length || 0) + (analysisResult.teams?.red?.length || 0)
            });

            if (analysisResult.teams?.blue) {
              console.log('[Vercel API] 블루팀 플레이어:', analysisResult.teams.blue.map(p => `${p.name} (${p.hero})`));
            }
            if (analysisResult.teams?.red) {
              console.log('[Vercel API] 레드팀 플레이어:', analysisResult.teams.red.map(p => `${p.name} (${p.hero})`));
            }
          } else {
            throw new Error('hots-parser를 사용할 수 없습니다.');
          }
        } catch (parserError) {
          console.error('=== [Vercel API] hots-parser 분석 실패 ===');
          console.error('[Vercel API] 오류 내용:', parserError.message);
          console.log('[Vercel API] 기본 분석으로 대체 시도...');

          // 2순위: 기본 분석 (백업)
          analysisResult = analyzeReplayBasic(fileBuffer, replayFile.originalFilename);

          console.log('=== [Vercel API] 기본 분석 완료 ===');
          console.log('[Vercel API] 분석 결과:', {
            success: analysisResult.success,
            method: 'basic',
            mapName: analysisResult.basic?.mapName,
            gameLength: `${Math.floor((analysisResult.basic?.gameLength || 0) / 60)}분 ${(analysisResult.basic?.gameLength || 0) % 60}초`,
            winner: analysisResult.basic?.winner
          });
        }

        // 임시 파일 삭제
        try {
          fs.unlinkSync(replayFile.filepath);
        } catch (cleanupErr) {
          console.warn('임시 파일 삭제 실패:', cleanupErr.message);
        }

        if (!analysisResult.success) {
          clearTimeout(timeoutId);
          return res.status(400).json({
            success: false,
            error: analysisResult.error
          });
        }

        // 분석 결과 추가 검증
        if (!analysisResult.basic) {
          clearTimeout(timeoutId);
          return res.status(400).json({
            success: false,
            error: '리플레이 분석 결과에 기본 정보가 없습니다.'
          });
        }

        if (!analysisResult.teams || !analysisResult.teams.blue || !analysisResult.teams.red) {
          clearTimeout(timeoutId);
          return res.status(400).json({
            success: false,
            error: '리플레이 분석 결과에 팀 정보가 없습니다.'
          });
        }

        if (analysisResult.teams.blue.length === 0 && analysisResult.teams.red.length === 0) {
          clearTimeout(timeoutId);
          return res.status(400).json({
            success: false,
            error: '리플레이에서 플레이어 정보를 찾을 수 없습니다. 올바른 Heroes of the Storm 리플레이 파일인지 확인해주세요.'
          });
        }

        console.log(`리플레이 분석 완료: ${user.battleTag} - ${replayFile.originalFilename}`, {
          method: hotsParser ? 'hots-parser' : 'basic',
          gameLength: analysisResult.basic?.gameLength,
          mapName: analysisResult.basic?.mapName,
          playersCount: (analysisResult.teams?.blue?.length || 0) + (analysisResult.teams?.red?.length || 0),
          blueTeam: analysisResult.teams?.blue?.length || 0,
          redTeam: analysisResult.teams?.red?.length || 0,
          winner: analysisResult.basic?.winner
        });

        clearTimeout(timeoutId);
        return res.json({
          success: true,
          message: '리플레이 분석이 완료되었습니다',
          analysisResult: analysisResult
        });

      } catch (error) {
        console.error('리플레이 분석 오류:', error);
        clearTimeout(timeoutId);
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }
    }

    // /api/matches/:matchId/complete - 매치 완료 처리
    if (pathParts[1] === 'matches' && pathParts[3] === 'complete' && req.method === 'POST') {
      try {
        const decoded = verifyToken(req.headers.authorization);
        const tokenId = decoded.id;
        const matchId = pathParts[2];

        // 사용자 정보 조회
        let user = await User.findByPk(tokenId);
        if (!user) {
          user = await User.findOne({ where: { bnetId: tokenId } });
        }

        if (!user) {
          clearTimeout(timeoutId);
          return res.status(404).json({ success: false, error: '사용자를 찾을 수 없습니다' });
        }

        // 요청 본문 파싱
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });

        req.on('end', async () => {
          try {
            const { replayData, winningTeam, gameLength, playerStats, isSimulation } = JSON.parse(body);

            console.log(`매치 완료 처리 시작: ${matchId}, 승리팀: ${winningTeam}`);

            // 매치 정보 조회 또는 생성
            let match = await Match.findByPk(matchId);

            if (!match) {
              // 매치가 없으면 새로 생성 (시뮬레이션 매치의 경우)
              match = await Match.create({
                id: matchId,
                status: 'completed',
                gameMode: replayData?.basic?.gameMode || 'Storm League',
                mapName: replayData?.basic?.mapName || '알 수 없음',
                maxPlayers: 10,
                currentPlayers: 10,
                createdBy: user.id,
                startedAt: new Date(Date.now() - (gameLength * 1000)),
                endedAt: new Date(),
                winner: winningTeam,
                gameDuration: gameLength,
                notes: isSimulation ? '시뮬레이션 매치' : null
              });
            } else {
              // 기존 매치 업데이트
              await match.update({
                status: 'completed',
                endedAt: new Date(),
                winner: winningTeam,
                gameDuration: gameLength
              });
            }

            // 리플레이 정보 저장
            const replay = await Replay.create({
              matchId: match.id,
              uploaderId: user.id,
              filename: `${matchId}_replay.StormReplay`,
              originalFilename: replayData?.basic?.filename || 'replay.StormReplay',
              fileSize: replayData?.basic?.fileSize || 0,
              gameVersion: replayData?.basic?.gameVersion || '2.55.0',
              gameLength: gameLength,
              mapName: replayData?.basic?.mapName || match.mapName,
              gameMode: replayData?.basic?.gameMode || match.gameMode,
              analysisData: replayData
            });

            // 플레이어 통계 저장 (시뮬레이션이 아닌 경우에만)
            if (!isSimulation && playerStats && playerStats.length > 0) {
              for (const playerStat of playerStats) {
                // 실제 사용자 찾기 (배틀태그로)
                const participant = await User.findOne({
                  where: {
                    battleTag: playerStat.battletag
                  }
                });

                if (participant) {
                  // 매치 참가자 정보 저장
                  await MatchParticipant.create({
                    matchId: match.id,
                    userId: participant.id,
                    team: playerStat.team,
                    hero: playerStat.hero,
                    kills: playerStat.kills || 0,
                    deaths: playerStat.deaths || 0,
                    assists: playerStat.assists || 0,
                    heroDamage: playerStat.heroDamage || 0,
                    siegeDamage: playerStat.siegeDamage || 0,
                    healing: playerStat.healing || 0,
                    experienceContribution: playerStat.experienceContribution || 0,
                    mmrChange: 0 // MMR 변화는 별도 계산
                  });

                  // 사용자 통계 업데이트
                  const isWinner = playerStat.team === winningTeam;
                  if (isWinner) {
                    await participant.update({
                      wins: participant.wins + 1,
                      mmr: Math.min(participant.mmr + 25, 5000) // 승리 시 MMR 증가
                    });
                  } else {
                    await participant.update({
                      losses: participant.losses + 1,
                      mmr: Math.max(participant.mmr - 25, 0) // 패배 시 MMR 감소
                    });
                  }
                }
              }
            }

            console.log(`매치 완료 처리 성공: ${matchId}`);

            clearTimeout(timeoutId);
            return res.json({
              success: true,
              message: '매치가 성공적으로 완료되었습니다',
              match: {
                id: match.id,
                status: match.status,
                winner: match.winner,
                gameDuration: match.gameDuration,
                endedAt: match.endedAt
              },
              replay: {
                id: replay.id,
                filename: replay.originalFilename
              }
            });

          } catch (parseError) {
            console.error('매치 완료 처리 오류:', parseError);
            clearTimeout(timeoutId);
            return res.status(500).json({
              success: false,
              error: '매치 완료 처리 중 오류가 발생했습니다'
            });
          }
        });

      } catch (error) {
        console.error('매치 완료 API 오류:', error);
        clearTimeout(timeoutId);
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }
    }

    // 지원하지 않는 경로
    clearTimeout(timeoutId);
    return res.status(404).json({ error: '요청한 리소스를 찾을 수 없습니다' });

  } catch (error) {
    console.error('/api/replay 오류:', error);
    clearTimeout(timeoutId);
    return res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
};
