const { Sequelize, DataTypes } = require('sequelize');
const jwt = require('jsonwebtoken');
const formidable = require('formidable');
const fs = require('fs');
const path = require('path');
const Parser = require('hots-parser');

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

// Match 모델 정의 (실제 DB 스키마에 맞춰 수정)
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
    winner: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    isSimulation: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_simulation'
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at'
    }
  }, {
    tableName: 'matches',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
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
    // DB에 없는 사용자를 위한 배틀태그 저장 필드
    playerBattleTag: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'player_battle_tag'
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
    experience: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'experience'
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

// 히오스 공식 한국어 번역 매핑 (서버와 동일)
const heroTranslations = {
  // 암살자
  'Alarak': '알라라크',
  'Cassia': '카시아',
  'Chromie': '크로미',
  'Falstad': '폴스타트',
  'Fenix': '피닉스',
  'Genji': '겐지',
  'Greymane': '그레이메인',
  'Gul\'dan': '굴단',
  'Hanzo': '한조',
  'Illidan': '일리단',
  'Jaina': '제이나',
  'Kael\'thas': '켈타스',
  'Kel\'Thuzad': '켈투자드',
  'Kerrigan': '케리건',
  'Li-Ming': '리밍',
  'Lunara': '루나라',
  'Maiev': '마이에브',
  'Mephisto': '메피스토',
  'Nazeebo': '나지보',
  'Nova': '노바',
  'Orphea': '오르피아',
  'Probius': '프로비우스',
  'Qhira': '키라',
  'Raynor': '레이너',
  'Sylvanas': '실바나스',
  'Tassadar': '태사다르',
  'The Butcher': '도살자',
  'Thrall': '스랄',
  'Tracer': '트레이서',
  'Tychus': '타이커스',
  'Tyrande': '티란데',
  'Valeera': '발리라',
  'Valla': '발라',
  'Zeratul': '제라툴',
  'Zul\'jin': '줄진',

  // 전사
  'Anub\'arak': '아눕아락',
  'Arthas': '아서스',
  'Blaze': '화염방사병',
  'Chen': '첸',
  'Cho': '초',
  'Diablo': '디아블로',
  'E.T.C.': '정예 타우렌 족장',
  'Garrosh': '가로쉬',
  'Imperius': '임페리우스',
  'Johanna': '요한나',
  'Leoric': '레오릭',
  'Mal\'Ganis': '말가니스',
  'Muradin': '무라딘',
  'Rexxar': '렉사르',
  'Sonya': '소냐',
  'Stitches': '스티치스',
  'Tyrael': '티리엘',
  'Varian': '바리안',
  'Yrel': '이렐',

  // 지원가
  'Abathur': '아바투르',
  'Medivh': '메디브',
  'The Lost Vikings': '길 잃은 바이킹',
  'Zarya': '자리야',

  // 치유사
  'Alexstrasza': '알렉스트라자',
  'Ana': '아나',
  'Anduin': '안두인',
  'Auriel': '아우리엘',
  'Brightwing': '빛나래',
  'Deckard': '데커드',
  'Kharazim': '카라짐',
  'Li Li': '리리',
  'Lt. Morales': '모랄레스 중위',
  'Lucio': '루시우',
  'Malfurion': '말퓨리온',
  'Rehgar': '레가르',
  'Stukov': '스투코프',
  'Uther': '우서',
  'Whitemane': '화이트메인',

  // 투사
  'Artanis': '아르타니스',
  'Azmodan': '아즈모단',
  'Dehaka': '데하카',
  'D.Va': '디바',
  'Gall': '갈',
  'Gazlowe': '가즈로',
  'Hogger': '들창코',
  'Ragnaros': '라그나로스',
  'Samuro': '사무로',
  'Xul': '줄',
  'Zagara': '자가라'
};

const mapTranslations = {
  'Cursed Hollow': '저주받은 골짜기',
  'Dragon Shire': '용의 둥지',
  'Blackheart\'s Bay': '블랙하트 항만',
  'Garden of Terror': '공포의 정원',
  'Haunted Mines': '유령 광산',
  'Sky Temple': '하늘 사원',
  'Tomb of the Spider Queen': '거미 여왕의 무덤',
  'Battlefield of Eternity': '영원의 전쟁터',
  'Infernal Shrines': '불지옥 신단',
  'Towers of Doom': '파멸의 탑',
  'Braxis Holdout': '브락시스 항전',
  'Warhead Junction': '핵탄두 격전지',
  'Hanamura Temple': '하나무라 사원',
  'Volskaya Foundry': '볼스카야 공장',
  'Alterac Pass': '알터랙 고개'
};

const translateHeroName = (heroName) => {
  if (!heroName) return '알 수 없음';
  return heroTranslations[heroName] || heroName;
};

const translateMapName = (mapName) => {
  if (!mapName) return '알 수 없음';
  return mapTranslations[mapName] || mapName;
};

/**
 * hots-parser 결과를 클라이언트가 기대하는 형식으로 변환합니다.
 * (서버의 replayParser.js와 동일한 로직)
 */
function formatParserResult(parserResult, filePath) {
  try {
    console.log('[DEBUG] Parser result keys:', Object.keys(parserResult || {}));
    console.log('[DEBUG] Parser result type:', typeof parserResult);

    // parserResult가 null이거나 undefined인 경우
    if (!parserResult) {
      return {
        success: false,
        error: '리플레이 파싱 실패: 파서 결과가 null 또는 undefined입니다.'
      };
    }

    const { status, match, players } = parserResult;

    console.log('[DEBUG] Extracted values:', {
      status: status,
      statusType: typeof status,
      match: match ? 'exists' : 'null/undefined',
      matchKeys: match ? Object.keys(match) : 'N/A',
      players: players ? 'exists' : 'null/undefined',
      playersKeys: players ? Object.keys(players) : 'N/A',
      playersCount: players ? Object.keys(players).length : 0
    });

    // 파싱 실패 체크
    if (status !== undefined && status !== Parser.ReplayStatus.OK) {
      console.log('[DEBUG] Parser status:', status);
      const statusString = Parser.StatusString[status] || `Unknown status: ${status}`;
      return {
        success: false,
        error: `리플레이 파싱 실패: ${statusString}`
      };
    }

    // 기본 데이터 확인
    if (!match || !players) {
      console.log('[DEBUG] Final check failed - match:', !!match, 'players:', !!players);
      return {
        success: false,
        error: '리플레이 파싱 실패: 필수 데이터가 누락되었습니다.'
      };
    }

    console.log('[DEBUG] Match data:', match);
    console.log('[DEBUG] Players count:', Object.keys(players).length);

    // 플레이어 데이터를 간단하게 변환
    const formattedPlayers = [];

    Object.keys(players).forEach((toonHandle, index) => {
      const player = players[toonHandle];

      // gameStats에서 모든 통계 데이터 추출 (최우선)
      let stats = {
        SoloKill: 0,
        Deaths: 0,
        Assists: 0,
        HeroDamage: 0,
        SiegeDamage: 0,
        Healing: 0,
        ExperienceContribution: 0,
        Level: 20
      };

      // 🎯 gameStats 필드에서 완전한 통계 추출
      if (player.gameStats) {
        console.log(`[DEBUG] Player ${index + 1} gameStats 발견! 완전한 통계 추출 중...`);

        const gs = player.gameStats;
        stats = {
          // 기본 KDA
          SoloKill: gs.SoloKill || gs.Takedowns || 0,
          Deaths: gs.Deaths || 0,
          Assists: gs.Assists || 0,

          // 딜량 관련
          HeroDamage: gs.HeroDamage || 0,
          SiegeDamage: gs.SiegeDamage || gs.StructureDamage || 0,
          StructureDamage: gs.StructureDamage || 0,
          MinionDamage: gs.MinionDamage || 0,
          CreepDamage: gs.CreepDamage || 0,
          PhysicalDamage: gs.PhysicalDamage || 0,
          SpellDamage: gs.SpellDamage || 0,
          TeamfightHeroDamage: gs.TeamfightHeroDamage || 0,

          // 힐량 관련
          Healing: gs.Healing || 0,
          SelfHealing: gs.SelfHealing || 0,
          TeamfightHealingDone: gs.TeamfightHealingDone || 0,

          // 방어 관련
          DamageTaken: gs.DamageTaken || 0,
          DamageSoaked: gs.DamageSoaked || 0,
          TeamfightDamageTaken: gs.TeamfightDamageTaken || 0,

          // 경험치 및 레벨
          ExperienceContribution: gs.ExperienceContribution || 0,
          MetaExperience: gs.MetaExperience || 0,
          Level: gs.Level || player.heroLevel || 20,

          // 오브젝트 관련
          MercCampCaptures: gs.MercCampCaptures || 0,
          WatchTowerCaptures: gs.WatchTowerCaptures || 0,
          TownKills: gs.TownKills || 0,
          RegenGlobes: gs.RegenGlobes || 0,

          // CC 및 특수 통계
          TimeCCdEnemyHeroes: gs.TimeCCdEnemyHeroes || 0,
          TimeStunningEnemyHeroes: gs.TimeStunningEnemyHeroes || 0,
          TimeRootingEnemyHeroes: gs.TimeRootingEnemyHeroes || 0,
          TimeSilencingEnemyHeroes: gs.TimeSilencingEnemyHeroes || 0,
          TimeSpentDead: gs.TimeSpentDead || 0,

          // 고급 통계
          KDA: gs.KDA || 0,
          DPM: gs.DPM || 0,
          HPM: gs.HPM || 0,
          XPM: gs.XPM || 0,
          KillParticipation: gs.KillParticipation || 0,
          Multikill: gs.Multikill || 0,
          HighestKillStreak: gs.HighestKillStreak || 0,

          // 클러치 플레이
          ClutchHealsPerformed: gs.ClutchHealsPerformed || 0,
          EscapesPerformed: gs.EscapesPerformed || 0,
          TeamfightEscapesPerformed: gs.TeamfightEscapesPerformed || 0
        };

        console.log(`[DEBUG] Player ${index + 1} 완전한 통계:`, {
          name: player.name,
          hero: player.hero,
          kda: `${stats.SoloKill}/${stats.Deaths}/${stats.Assists}`,
          heroDamage: stats.HeroDamage,
          healing: stats.Healing,
          siegeDamage: stats.SiegeDamage,
          experience: stats.ExperienceContribution
        });
      } else {
        // gameStats가 없는 경우 기존 방식으로 폴백
        console.log(`[DEBUG] Player ${index + 1} gameStats 없음, 기존 방식 사용`);

        // 배열 형태의 데이터를 숫자로 변환
        const takedownsCount = Array.isArray(player.takedowns) ? player.takedowns.length : (player.takedowns || 0);
        const deathsCount = Array.isArray(player.deaths) ? player.deaths.length : (player.deaths || 0);
        const assistsCount = Array.isArray(player.assists) ? player.assists.length : (player.assists || 0);

        stats = {
          SoloKill: takedownsCount,
          Deaths: deathsCount,
          Assists: assistsCount,
          HeroDamage: player.heroDamage || player.damageDone || 0,
          SiegeDamage: player.siegeDamage || player.structureDamage || 0,
          Healing: player.healing || player.healingDone || 0,
          ExperienceContribution: player.experienceContribution || player.experience || 0,
          Level: player.heroLevel || player.level || 20
        };
      }

      console.log(`[DEBUG] Player ${index + 1}:`, {
        name: player.name,
        hero: player.hero,
        team: player.team,
        finalStats: stats,
        hasGameStats: !!player.gameStats
      });

      const formattedPlayer = {
        name: player.name || `Player${index + 1}`,
        hero: translateHeroName(player.hero) || 'Unknown',
        battleTag: player.battletag || player.battleTag || player.name || `Player${index + 1}`,
        team: player.team || 0,
        stats: stats,
        heroLevel: stats.Level
      };

      formattedPlayers.push(formattedPlayer);
    });

    // 팀별 분류
    const blueTeam = formattedPlayers.filter(p => p.team === 0);
    const redTeam = formattedPlayers.filter(p => p.team === 1);

    console.log('[DEBUG] Blue team:', blueTeam.length, 'Red team:', redTeam.length);

    // 파일 정보
    const fileStats = fs.statSync(filePath);

    // 관리자 페이지와 호환되는 구조로 반환
    return {
      success: true,
      metadata: {
        mapName: translateMapName(match.map) || 'Unknown Map',
        gameMode: match.mode || 'Unknown',
        gameDuration: match.length || 0,
        date: match.date || new Date().toISOString(),
        winner: match.winner === 0 ? 'blue' : match.winner === 1 ? 'red' : 'unknown',
        gameVersion: match.version || 'Unknown',
        region: match.region || 'Unknown',
        fileSize: fileStats.size,
        analysisDate: new Date().toISOString()
      },
      teams: {
        blue: blueTeam,
        red: redTeam
      },
      statistics: {
        totalKills: formattedPlayers.reduce((sum, p) => sum + p.stats.SoloKill, 0),
        totalDeaths: formattedPlayers.reduce((sum, p) => sum + p.stats.Deaths, 0),
        totalAssists: formattedPlayers.reduce((sum, p) => sum + p.stats.Assists, 0),
        totalHeroDamage: formattedPlayers.reduce((sum, p) => sum + p.stats.HeroDamage, 0),
        totalSiegeDamage: formattedPlayers.reduce((sum, p) => sum + p.stats.SiegeDamage, 0),
        totalHealing: formattedPlayers.reduce((sum, p) => sum + p.stats.Healing, 0),
        averageLevel: formattedPlayers.length > 0 ?
          Math.round(formattedPlayers.reduce((sum, p) => sum + p.stats.Level, 0) / formattedPlayers.length) : 0,
        playerCount: formattedPlayers.length
      }
    };

  } catch (error) {
    console.error('결과 변환 중 오류:', error);
    return {
      success: false,
      error: `결과 변환 실패: ${error.message}`
    };
  }
}

/**
 * 리플레이 파일을 분석합니다. (서버의 analyzeReplay와 동일한 로직)
 * @param {string} filePath - 리플레이 파일 경로
 * @returns {Object} 분석 결과
 */
async function analyzeReplayWithParser(filePath) {
  try {
    console.log('[API] 리플레이 분석 시작:', filePath);

    // 파일 존재 여부 확인
    if (!fs.existsSync(filePath)) {
      return {
        success: false,
        error: `파일을 찾을 수 없습니다: ${filePath}`
      };
    }

    // 파일 확장자 확인
    if (!filePath.toLowerCase().endsWith('.stormreplay')) {
      return {
        success: false,
        error: '유효한 .StormReplay 파일이 아닙니다.'
      };
    }

    // 파일 크기 확인 (너무 작거나 큰 파일 체크)
    const fileStats = fs.statSync(filePath);
    console.log(`[API] 파일 크기: ${fileStats.size} bytes`);

    if (fileStats.size < 1000) {
      return {
        success: false,
        error: '리플레이 파일이 너무 작습니다. 손상된 파일일 수 있습니다.'
      };
    }

    if (fileStats.size > 50 * 1024 * 1024) { // 50MB 제한
      return {
        success: false,
        error: '리플레이 파일이 너무 큽니다. (최대 50MB)'
      };
    }

    // 먼저 헤더 정보만 확인해보기
    let headerInfo = null;
    try {
      headerInfo = Parser.getHeader(filePath);
      console.log('[API] 헤더 정보:', {
        map: headerInfo.map,
        version: headerInfo.version,
        mode: headerInfo.mode,
        players: headerInfo.players?.length || 0
      });
    } catch (headerError) {
      console.log('[API] 헤더 정보 추출 실패:', headerError.message);
      return {
        success: false,
        error: `리플레이 파일 헤더를 읽을 수 없습니다: ${headerError.message}`
      };
    }

    // hots-parser로 리플레이 처리
    console.log('[API] hots-parser 호출 시작');

    let parserResult;
    try {
      // 통계 데이터 추출을 위한 설정으로 파싱 시도
      parserResult = Parser.processReplay(filePath, {
        getBMData: true,  // 통계 데이터 추출 활성화
        useAttributeName: true,
        overrideVerifiedBuild: true,
        legacyTalentKeys: false,
        withoutRecovery: false,  // 복구 모드 활성화
        ignoreErrors: true  // 오류 무시하고 계속 진행
      });

      // 실패한 경우 더 관대한 설정으로 재시도
      if (parserResult && parserResult.status !== Parser.ReplayStatus.OK) {
        console.log('[API] 첫 번째 파싱 실패, 관대한 설정으로 재시도...');
        parserResult = Parser.processReplay(filePath, {
          getBMData: true,  // 통계 데이터 추출 활성화
          useAttributeName: true,
          overrideVerifiedBuild: true,
          legacyTalentKeys: true,
          withoutRecovery: false,
          ignoreErrors: true
        });
      }

    } catch (parseError) {
      console.error('[API] processReplay 호출 중 예외 발생:', parseError);
      return {
        success: false,
        error: `리플레이 파싱 중 예외 발생: ${parseError.message}`
      };
    }

    console.log(`[API] hots-parser 호출 완료`);

    if (!parserResult || typeof parserResult !== 'object') {
      console.log(`[API] parserResult가 예상된 객체가 아님:`, parserResult);
      return {
        success: false,
        error: '리플레이 파서가 예상치 못한 결과를 반환했습니다.'
      };
    }

    // 결과를 클라이언트 형식으로 변환
    const formattedResult = formatParserResult(parserResult, filePath);

    console.log(`[API] 리플레이 분석 완료: ${formattedResult.success ? '성공' : '실패'}`);

    return formattedResult;

  } catch (error) {
    console.error('[API] 리플레이 분석 중 오류:', error);

    // 특정 오류 타입별 처리
    if (error.message && error.message.includes('unverifiedBuild')) {
      return {
        success: false,
        error: '지원되지 않는 게임 버전입니다. 최신 버전의 리플레이를 사용해주세요.'
      };
    }

    if (error.message && error.message.includes('ENOENT')) {
      return {
        success: false,
        error: '리플레이 파일을 찾을 수 없습니다.'
      };
    }

    return {
      success: false,
      error: `리플레이 분석 실패: ${error.message}`
    };
  }
}

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

            analysisResult = await analyzeReplayWithParser(replayFile.filepath);

            console.log('=== [Vercel API] 리플레이 분석 성공 ===');
            console.log('[Vercel API] 분석 결과:', {
              success: analysisResult.success,
              mapName: analysisResult.metadata?.mapName,
              gameLength: `${Math.floor((analysisResult.metadata?.gameDuration || 0) / 60)}분 ${(analysisResult.metadata?.gameDuration || 0) % 60}초`,
              gameMode: analysisResult.metadata?.gameMode,
              winner: analysisResult.metadata?.winner,
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
          analysisResult = await analyzeReplayWithParser(replayFile.filepath);

          console.log('=== [Vercel API] 기본 분석 완료 ===');
          console.log('[Vercel API] 분석 결과:', {
            success: analysisResult.success,
            method: 'basic',
            mapName: analysisResult.metadata?.mapName,
            gameLength: `${Math.floor((analysisResult.metadata?.gameDuration || 0) / 60)}분 ${(analysisResult.metadata?.gameDuration || 0) % 60}초`,
            winner: analysisResult.metadata?.winner
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
        if (!analysisResult.metadata) {
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
          gameLength: analysisResult.metadata?.gameDuration,
          mapName: analysisResult.metadata?.mapName,
          playersCount: (analysisResult.teams?.blue?.length || 0) + (analysisResult.teams?.red?.length || 0),
          blueTeam: analysisResult.teams?.blue?.length || 0,
          redTeam: analysisResult.teams?.red?.length || 0,
          winner: analysisResult.metadata?.winner
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

    // /api/matches/:matchId/complete - 매치 완료 처리 (리디렉션)
    if (pathParts[1] === 'matches' && pathParts[3] === 'complete' && req.method === 'POST') {
      console.log('[매치 완료] api/replay.js에서 api/matches.js로 리디렉션');

      // api/matches.js의 매치 완료 엔드포인트로 리디렉션
      // 이 로직은 api/matches.js에서 처리되므로 여기서는 404 반환
      clearTimeout(timeoutId);
      return res.status(404).json({
        error: '매치 완료는 /api/matches/:id/complete 엔드포인트를 사용하세요',
        redirect: `/api/matches/${pathParts[2]}/complete`
      });
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
