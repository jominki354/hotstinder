const fs = require('fs');
const path = require('path');
const Parser = require('hots-parser');
// const { translateHeroName, translateMapName, translateGameData } = require('./heroTranslations');

// 히오스 공식 한국어 번역 매핑
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

const translateGameData = (data) => {
  if (!data) return data;

  if (data.hero) {
    data.hero = translateHeroName(data.hero);
  }

  if (data.map) {
    data.map = translateMapName(data.map);
  }

  return data;
};

/**
 * Heroes of the Storm 리플레이 파일을 분석합니다.
 * hots-parser 라이브러리를 사용하여 실제 게임 데이터를 추출합니다.
 */

/**
 * 팀별 플레이어를 성과 기준으로 정렬합니다.
 * MMR 정보가 없으므로 게임 내 성과 지표를 사용합니다.
 */
function sortTeamByPerformance(players) {
    return players.sort((a, b) => {
        // 1순위: 경험치 기여도
        if (b.stats.ExperienceContribution !== a.stats.ExperienceContribution) {
            return b.stats.ExperienceContribution - a.stats.ExperienceContribution;
        }
        // 2순위: KDA 점수 (킬 + 어시스트 - 데스)
        const aScore = a.stats.SoloKill + a.stats.Assists - a.stats.Deaths;
        const bScore = b.stats.SoloKill + b.stats.Assists - b.stats.Deaths;
        if (bScore !== aScore) {
            return bScore - aScore;
        }
        // 3순위: 총 피해량
        const aTotalDamage = a.stats.HeroDamage + a.stats.SiegeDamage;
        const bTotalDamage = b.stats.HeroDamage + b.stats.SiegeDamage;
        return bTotalDamage - aTotalDamage;
    });
}

/**
 * Score 이벤트에서 플레이어 통계를 추출합니다.
 */
function extractStatsFromScore(scoreData, players) {
    if (!scoreData || !scoreData.m_instanceList) {
        console.log('[DEBUG] Score 데이터가 없거나 형식이 잘못됨');
        return {};
    }

    const playerStats = {};

    console.log('[DEBUG] Score 인스턴스 리스트 길이:', scoreData.m_instanceList.length);

    // 각 통계 항목을 처리
    scoreData.m_instanceList.forEach((statItem, itemIndex) => {
        const statName = statItem.m_name;
        const values = statItem.m_values;

        console.log(`[DEBUG] 통계 항목 ${itemIndex}: ${statName}, 값 개수: ${values?.length || 0}`);

        if (!values || !Array.isArray(values)) return;

        // 플레이어별 통계 값 저장
        values.forEach((valueObj, playerIndex) => {
            if (valueObj && Array.isArray(valueObj) && valueObj.length > 0 && valueObj[0].m_value !== undefined) {
                const playerId = playerIndex + 1; // Tracker PlayerID는 1부터 시작

                if (!playerStats[playerId]) {
                    playerStats[playerId] = {};
                }

                playerStats[playerId][statName] = valueObj[0].m_value;

                console.log(`[DEBUG] 플레이어 ${playerId} ${statName}: ${valueObj[0].m_value}`);
            }
        });
    });

    console.log('[DEBUG] 추출된 Score 통계 (플레이어별):', Object.keys(playerStats).map(id => ({
        playerId: id,
        stats: Object.keys(playerStats[id]).length
    })));

    return playerStats;
}

/**
 * hots-parser 결과를 클라이언트가 기대하는 형식으로 변환합니다.
 */
function formatParserResult(parserResult, filePath, scoreData = null, playerInitData = {}) {
    try {
    console.log('[DEBUG] Parser result keys:', Object.keys(parserResult || {}));
    console.log('[DEBUG] Parser result type:', typeof parserResult);
        console.log('[DEBUG] Parser result:', JSON.stringify(parserResult, null, 2));

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

    // 파싱 실패 체크 - status가 undefined이거나 OK가 아닌 경우
    if (status === undefined || status === null) {
      console.log('[DEBUG] Status is undefined or null');
      // status가 없어도 match와 players가 있으면 성공으로 간주
            if (!match || !players) {
        console.log('[DEBUG] Match or players missing - match:', !!match, 'players:', !!players);
                return {
                    success: false,
                    error: '리플레이 파싱 실패: 결과 데이터가 없습니다.'
                };
            }
    } else if (status !== Parser.ReplayStatus.OK) {
      console.log('[DEBUG] Parser status:', status);
      console.log('[DEBUG] Parser.ReplayStatus.OK:', Parser.ReplayStatus.OK);
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

        // Score 데이터에서 통계 추출
        const scoreStats = scoreData ? extractStatsFromScore(scoreData, players) : {};

        // 플레이어 데이터 변환
        const formattedPlayers = [];

        console.log('[DEBUG] 플레이어 변환 시작, 총 플레이어 수:', Object.keys(players).length);
        console.log('[DEBUG] 사용 가능한 Score 통계 플레이어 ID:', Object.keys(scoreStats));

        Object.keys(players).forEach((toonHandle, index) => {
            const player = players[toonHandle];
            const stats = player.stats || {};

            console.log(`[DEBUG] Player ${index + 1}:`, {
                name: player.name,
                hero: player.hero,
                team: player.team,
                toonHandle: toonHandle,
                stats: stats
            });

            // PlayerInit 데이터에서 정확한 Tracker PlayerID 가져오기
            let trackerPlayerId = playerInitData[toonHandle];
            let playerScoreStats = trackerPlayerId ? scoreStats[trackerPlayerId] || {} : {};

            // PlayerInit 매핑이 실패한 경우 순서 기반 매핑 시도
            if (!trackerPlayerId || Object.keys(playerScoreStats).length === 0) {
                console.log(`[DEBUG] PlayerInit 매핑 실패, 순서 기반 매핑 시도: ${index + 1}`);
                trackerPlayerId = index + 1;
                playerScoreStats = scoreStats[trackerPlayerId] || {};
            }

            console.log(`[DEBUG] Player ${player.name} - TrackerID: ${trackerPlayerId}, ScoreStats 키 개수: ${Object.keys(playerScoreStats).length}`);
            console.log(`[DEBUG] Player ${player.name} - ScoreStats:`, playerScoreStats);

            // KDA 계산 (Score 데이터 우선 사용)
            const kills = playerScoreStats.SoloKill || stats.SoloKill || 0;
            const deaths = playerScoreStats.Deaths || stats.Deaths || 0;
            const assists = playerScoreStats.Assists || stats.Assists || 0;
            const kda = deaths > 0 ? parseFloat(((kills + assists) / deaths).toFixed(2)) : kills + assists;

            console.log(`[DEBUG] Player ${player.name} - 최종 통계:`, {
                kills: kills,
                deaths: deaths,
                assists: assists,
                kda: kda,
                level: playerScoreStats.Level || player.heroLevel || 20,
                heroDamage: playerScoreStats.HeroDamage || stats.HeroDamage || 0,
                siegeDamage: playerScoreStats.SiegeDamage || stats.SiegeDamage || 0,
                healing: playerScoreStats.Healing || stats.Healing || 0
            });

            const formattedPlayer = {
                index: index,
                name: player.name || `Player${index + 1}`,
                hero: player.hero || 'Unknown',
                battleTag: player.battletag || `${player.name || `Player${index + 1}`}#Unknown`,
                team: player.team || 0,
                color: player.color || {},
                control: player.control || 2,
                handicap: player.handicap || 100,
                observe: player.observe || 0,
                result: player.result || (player.team === match.winner ? 1 : 2),
                workingSetSlotId: player.workingSetSlotId || index,
                toonHandle: {
                    m_id: toonHandle.split('-')[3] || 'Unknown',
                    m_programId: 'Hero',
                    m_realm: 1,
                    m_region: 3
                },
                stats: {
                    SoloKill: kills,
                    Deaths: deaths,
                    Assists: assists,
                    HeroDamage: playerScoreStats.HeroDamage || stats.HeroDamage || 0,
                    SiegeDamage: playerScoreStats.SiegeDamage || stats.SiegeDamage || 0,
                    StructureDamage: playerScoreStats.StructureDamage || stats.StructureDamage || 0,
                    MinionDamage: playerScoreStats.MinionDamage || stats.MinionDamage || 0,
                    CreepDamage: playerScoreStats.CreepDamage || stats.CreepDamage || 0,
                    SummonDamage: playerScoreStats.SummonDamage || stats.SummonDamage || 0,
                    Healing: playerScoreStats.Healing || stats.Healing || 0,
                    SelfHealing: playerScoreStats.SelfHealing || stats.SelfHealing || 0,
                    DamageTaken: playerScoreStats.DamageTaken || stats.DamageTaken || 0,
                    ExperienceContribution: playerScoreStats.ExperienceContribution || stats.ExperienceContribution || 0,
                    TimeSpentDead: playerScoreStats.TimeSpentDead || stats.TimeSpentDead || 0,
                    MercCampCaptures: playerScoreStats.MercCampCaptures || stats.MercCampCaptures || 0,
                    WatchTowerCaptures: playerScoreStats.WatchTowerCaptures || stats.WatchTowerCaptures || 0,
                    Level: playerScoreStats.Level || player.heroLevel || 20,
                    TeamLevel: playerScoreStats.TeamLevel || stats.TeamLevel || 20,
                    GameScore: playerScoreStats.GameScore || stats.GameScore || 0,
                    KDA: kda
                },
                heroLevel: player.heroLevel || 20
            };

            formattedPlayers.push(formattedPlayer);
        });

        // 팀별 분류 및 정렬
        const blueTeam = sortTeamByPerformance(formattedPlayers.filter(p => p.team === 0));
        const redTeam = sortTeamByPerformance(formattedPlayers.filter(p => p.team === 1));

        console.log('[DEBUG] Blue team:', blueTeam.length, 'Red team:', redTeam.length);

        // 전체 통계 계산
        const totalKills = formattedPlayers.reduce((sum, p) => sum + p.stats.SoloKill, 0);
        const totalDeaths = formattedPlayers.reduce((sum, p) => sum + p.stats.Deaths, 0);
        const totalAssists = formattedPlayers.reduce((sum, p) => sum + p.stats.Assists, 0);
        const totalHeroDamage = formattedPlayers.reduce((sum, p) => sum + p.stats.HeroDamage, 0);
        const totalSiegeDamage = formattedPlayers.reduce((sum, p) => sum + p.stats.SiegeDamage, 0);
        const totalHealing = formattedPlayers.reduce((sum, p) => sum + p.stats.Healing, 0);

        const validKdas = formattedPlayers.filter(p => p.stats.KDA > 0).map(p => p.stats.KDA);
        const averageKda = validKdas.length > 0 ?
            parseFloat((validKdas.reduce((sum, kda) => sum + kda, 0) / validKdas.length).toFixed(2)) : 0;

        // 파일 정보
        const fileStats = fs.statSync(filePath);

        // 평균 레벨 계산
        const averageLevel = formattedPlayers.length > 0 ?
            Math.round(formattedPlayers.reduce((sum, p) => sum + p.stats.Level, 0) / formattedPlayers.length) : 0;

        return {
            success: true,
            metadata: {
                mapName: match.map || 'Unknown Map',
                gameMode: match.mode || 'Unknown',
                gameDuration: match.length || 0,
                date: match.date || new Date().toISOString(),
                winner: match.winner === 0 ? 'blue' : match.winner === 1 ? 'red' : 'unknown',
                gameVersion: match.version || 'Unknown',
                region: match.region || 'Unknown',
                fileSize: fileStats.size,
                analysisDate: new Date().toISOString(),
                parserVersion: 'hots-parser',
                parserStatus: status || 'OK'
            },
            teams: {
                blue: blueTeam,
                red: redTeam
            },
            players: {
                blue: blueTeam,
                red: redTeam,
                all: formattedPlayers
            },
            statistics: {
                totalKills,
                totalDeaths,
                totalAssists,
                totalHeroDamage,
                totalSiegeDamage,
                totalHealing,
                averageKDA: averageKda,
                averageLevel,
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
 * 리플레이 파일을 분석합니다.
 * @param {string} filePath - 리플레이 파일 경로
 * @returns {Object} 분석 결과
 */
async function analyzeReplay(filePath) {
    try {
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
    console.log(`[INFO] 파일 크기: ${fileStats.size} bytes`);

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

        console.log(`[INFO] 리플레이 분석 시작: ${filePath}`);

    // 먼저 헤더 정보만 확인해보기
    let headerInfo = null;
    try {
      headerInfo = Parser.getHeader(filePath);
      console.log('[DEBUG] 헤더 정보:', {
        map: headerInfo.map,
        version: headerInfo.version,
        mode: headerInfo.mode,
        players: headerInfo.players?.length || 0
      });
    } catch (headerError) {
      console.log('[WARN] 헤더 정보 추출 실패:', headerError.message);
      return {
        success: false,
        error: `리플레이 파일 헤더를 읽을 수 없습니다: ${headerError.message}`
      };
    }

        // hots-parser로 리플레이 처리
    console.log('[DEBUG] hots-parser 호출 시작');
    console.log('[DEBUG] Parser.processReplay 함수 존재 여부:', typeof Parser.processReplay);
    console.log('[DEBUG] Parser.ReplayStatus 존재 여부:', typeof Parser.ReplayStatus);

    let parserResult;
    try {
      // 첫 번째 시도: 기본 설정
      parserResult = Parser.processReplay(filePath, {
            getBMData: false, // 성능 향상을 위해 BM 데이터 스킵
            useAttributeName: false, // 영웅 이름 해석 사용
            overrideVerifiedBuild: true, // 새 빌드 지원
            legacyTalentKeys: false // 새로운 탤런트 키 형식 사용
        });

      // Internal Exception이 발생한 경우 더 관대한 설정으로 재시도
      if (parserResult && parserResult.status === Parser.ReplayStatus.Failure) {
        console.log('[WARN] 첫 번째 파싱 실패, 관대한 설정으로 재시도...');

        parserResult = Parser.processReplay(filePath, {
          getBMData: false,
          useAttributeName: true, // 영웅 이름 해석 활성화
          overrideVerifiedBuild: true,
          legacyTalentKeys: true, // 레거시 탤런트 키 사용
          ignoreErrors: true // 에러 무시 (있다면)
        });
      }

    } catch (parseError) {
      console.error('[ERROR] processReplay 호출 중 예외 발생:', parseError);

      // 예외가 발생해도 더 관대한 설정으로 한 번 더 시도
      try {
        console.log('[WARN] 예외 발생, 최대한 관대한 설정으로 재시도...');
        parserResult = Parser.processReplay(filePath, {
          getBMData: false,
          useAttributeName: true,
          overrideVerifiedBuild: true,
          legacyTalentKeys: true
        });
      } catch (secondError) {
        console.error('[ERROR] 두 번째 파싱 시도도 실패:', secondError);
        return {
          success: false,
          error: `리플레이 파싱 중 예외 발생: ${parseError.message}`
        };
      }
    }

    console.log(`[INFO] hots-parser 호출 완료`);
    console.log(`[DEBUG] parserResult 타입:`, typeof parserResult);
    console.log(`[DEBUG] parserResult null 여부:`, parserResult === null);
    console.log(`[DEBUG] parserResult undefined 여부:`, parserResult === undefined);

    if (parserResult && typeof parserResult === 'object') {
      console.log(`[DEBUG] parserResult 키들:`, Object.keys(parserResult));
      console.log(`[INFO] hots-parser 결과 상태: ${parserResult.status}`);

      // 상태 코드별 상세 처리
      if (parserResult.status !== undefined && parserResult.status !== Parser.ReplayStatus.OK) {
        const statusCode = parserResult.status;
        const statusString = Parser.StatusString[statusCode] || `Unknown status: ${statusCode}`;

        console.log(`[ERROR] 파싱 실패 - 상태 코드: ${statusCode}, 메시지: ${statusString}`);

        // 구체적인 에러 메시지 제공
        let errorMessage = `리플레이 파싱 실패: ${statusString}`;

        switch (statusCode) {
          case Parser.ReplayStatus.Failure: // -2 (Internal Exception)
            // 로그에서 맵 이름 관련 에러 확인
            if (headerInfo && headerInfo.map === undefined) {
              errorMessage = '새로운 맵이거나 지원되지 않는 맵입니다. 파서 업데이트가 필요할 수 있습니다.';
            } else {
              errorMessage = '리플레이 파일 내부 구조에 문제가 있습니다. 파일이 손상되었거나 지원되지 않는 형식일 수 있습니다.';
            }
            break;
          case Parser.ReplayStatus.Unverified: // -7
            errorMessage = '지원되지 않는 게임 버전입니다. 최신 버전의 Heroes of the Storm 리플레이만 지원됩니다.';
            break;
          case Parser.ReplayStatus.TooOld: // -6
            errorMessage = '너무 오래된 리플레이 파일입니다. 최신 버전의 리플레이를 사용해주세요.';
            break;
          case Parser.ReplayStatus.ComputerPlayerFound: // -4
            errorMessage = 'AI 플레이어가 포함된 게임은 분석할 수 없습니다.';
            break;
          case Parser.ReplayStatus.UnsupportedMap: // -3
            errorMessage = '지원되지 않는 맵입니다.';
            break;
          case Parser.ReplayStatus.Incomplete: // -5
            errorMessage = '불완전한 리플레이 파일입니다. 게임이 정상적으로 끝나지 않았을 수 있습니다.';
            break;
          case Parser.ReplayStatus.Unsupported: // 0
            errorMessage = '지원되지 않는 리플레이 형식입니다.';
            break;
          case Parser.ReplayStatus.Duplicate: // -1
            errorMessage = '중복된 리플레이 파일입니다.';
            break;
        }

        // 대안적 파싱 시도 전에 에러 정보 저장
        const errorDetails = {
          statusCode: statusCode,
          statusString: statusString,
          fileSize: fileStats.size,
          headerInfo: headerInfo,
          originalError: errorMessage
        };

        console.log('[WARN] processReplay 실패, parse 함수로 대안 시도...');

        // 대안적 파싱 시도
        try {
          const rawData = Parser.parse(filePath, ['details', 'initdata'], {});

          if (rawData && rawData.details && rawData.initdata) {
            console.log('[INFO] parse 함수로 기본 데이터 추출 성공');

            // 기본 매치 정보 구성
            const basicMatch = {
              map: rawData.details.m_title || 'IndustrialDistrict', // 알려진 맵 이름 사용
              mode: 'Unknown',
              length: rawData.details.m_timeUTC || 0,
              date: new Date().toISOString(),
              winner: 0,
              version: 'Unknown',
              region: 'Unknown'
            };

            // 기본 플레이어 정보 구성
            const basicPlayers = {};
            if (rawData.initdata && rawData.initdata.m_syncLobbyState && rawData.initdata.m_syncLobbyState.m_lobbyState) {
              const lobbyState = rawData.initdata.m_syncLobbyState.m_lobbyState;
              if (lobbyState.m_slots) {
                lobbyState.m_slots.forEach((slot, index) => {
                  if (slot && slot.m_toonHandle) {
                    const toonHandle = slot.m_toonHandle;
                    const handleString = `${toonHandle.m_region}-${toonHandle.m_programId}-${toonHandle.m_realm}-${toonHandle.m_id}`;

                    basicPlayers[handleString] = {
                      name: slot.m_name || `Player${index + 1}`,
                      hero: 'Unknown',
                      team: slot.m_teamId || 0,
                      battletag: slot.m_name || `Player${index + 1}#Unknown`,
                      stats: {}
                    };
                  }
                });
              }
            }

            // 기본 결과 반환
            const basicResult = {
              status: Parser.ReplayStatus.OK,
              match: basicMatch,
              players: basicPlayers
            };

            console.log('[INFO] 기본 데이터로 파싱 결과 구성 완료');
            parserResult = basicResult;
          } else {
            console.log('[WARN] parse 함수로도 충분한 데이터를 추출할 수 없음');
            return {
              success: false,
              error: errorMessage,
              details: errorDetails
            };
          }
        } catch (parseError) {
          console.log('[WARN] parse 함수도 실패:', parseError.message);
          return {
            success: false,
            error: errorMessage,
            details: errorDetails
          };
        }
      }
    } else {
      console.log(`[ERROR] parserResult가 예상된 객체가 아님:`, parserResult);
      return {
        success: false,
        error: '리플레이 파서가 예상치 못한 결과를 반환했습니다.'
      };
    }

        // 추가로 trackerevents에서 Score 데이터 추출
        let scoreData = null;
        let playerInitData = {};
        try {
            const rawData = Parser.parse(filePath, ['trackerevents'], {});
            if (rawData.trackerevents) {
                console.log('[DEBUG] 총 tracker 이벤트 수:', rawData.trackerevents.length);

                // PlayerInit 이벤트 찾기 (eventid = 10)
                const playerInitEvents = rawData.trackerevents.filter(event => event._eventid === 10);
                console.log('[DEBUG] PlayerInit 이벤트 수:', playerInitEvents.length);

                // PlayerInit 데이터로 ToonHandle과 Tracker PlayerID 매핑
                playerInitEvents.forEach((event, index) => {
                    console.log(`[DEBUG] PlayerInit 이벤트 ${index}:`, event);

                    if (event.m_intData && event.m_stringData) {
                        // Tracker PlayerID는 첫 번째 int 데이터
                        const trackerPlayerId = event.m_intData[0]?.m_value;
                        // ToonHandle은 두 번째 string 데이터
                        const toonHandle = event.m_stringData[1]?.m_value;

                        console.log(`[DEBUG] 매핑 시도: TrackerID=${trackerPlayerId}, ToonHandle=${toonHandle}`);

                        if (trackerPlayerId !== undefined && toonHandle) {
                            playerInitData[toonHandle] = trackerPlayerId;
                            console.log(`[DEBUG] 매핑 성공: ${toonHandle} -> ${trackerPlayerId}`);
                        }
                    }
                });

                console.log('[DEBUG] 최종 PlayerInit 매핑:', playerInitData);

                // Score 이벤트 찾기 (eventid = 11)
                const scoreEvents = rawData.trackerevents.filter(event => event._eventid === 11);
                console.log('[DEBUG] Score 이벤트 수:', scoreEvents.length);

                if (scoreEvents.length > 0) {
                    scoreData = scoreEvents[0]; // 첫 번째 Score 이벤트 사용
                    console.log('[DEBUG] Score 이벤트 발견, 인스턴스 수:', scoreData.m_instanceList?.length || 0);
                }
            }
        } catch (scoreError) {
            console.log('[WARN] Score 데이터 추출 실패:', scoreError.message);
        }

        // 결과를 클라이언트 형식으로 변환
        const formattedResult = formatParserResult(parserResult, filePath, scoreData, playerInitData);

        console.log(`[INFO] 리플레이 분석 완료: ${formattedResult.success ? '성공' : '실패'}`);

    // 파싱 결과에 번역 적용
    const translatedResult = applyTranslations(formattedResult);

    return translatedResult;

    } catch (error) {
        console.error('[ERROR] 리플레이 분석 중 오류:', error);

        // 특정 오류 타입별 처리
        if (error.message && error.message.includes('unverifiedBuild')) {
            return {
                success: false,
                error: '지원되지 않는 게임 버전입니다. 최신 버전의 파서가 필요합니다.'
            };
        }

        if (error.message && error.message.includes('ComputerPlayerFound')) {
            return {
                success: false,
                error: 'AI 플레이어가 포함된 게임은 분석할 수 없습니다.'
            };
        }

        return {
            success: false,
            error: `리플레이 분석 중 오류가 발생했습니다: ${error.message}`
        };
    }
}

/**
 * 리플레이 파일의 기본 헤더 정보를 가져옵니다.
 * @param {string} filePath - 리플레이 파일 경로
 * @returns {Object} 헤더 정보
 */
async function getReplayHeader(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            return {
                success: false,
                error: `파일을 찾을 수 없습니다: ${filePath}`
            };
        }

        const header = Parser.getHeader(filePath);

        return {
            success: true,
            header: {
                map: header.map || 'Unknown',
                players: header.players || [],
                date: header.date || new Date().toISOString(),
                version: header.version || 'Unknown',
                mode: header.mode || 'Unknown'
            }
        };

    } catch (error) {
        console.error('[ERROR] 헤더 정보 추출 중 오류:', error);
        return {
            success: false,
            error: `헤더 정보 추출 실패: ${error.message}`
        };
    }
}

// 파싱 결과에 번역 적용
function applyTranslations(result) {
  if (!result) return result;

  try {
    // 기본 매치 정보 번역
    if (result.match) {
      if (result.match.map) {
        result.match.map = translateMapName(result.match.map);
      }
    }

    // 플레이어 영웅 이름 번역
    if (result.players) {
      Object.keys(result.players).forEach(playerId => {
        const player = result.players[playerId];
        if (player && player.hero) {
          player.hero = translateHeroName(player.hero);
        }
      });
    }

    // 팀별 플레이어 번역 (teams 구조가 있는 경우)
    if (result.teams) {
      ['blue', 'red'].forEach(team => {
        if (result.teams[team] && Array.isArray(result.teams[team])) {
          result.teams[team] = result.teams[team].map(player => ({
            ...player,
            hero: translateHeroName(player.hero)
          }));
        }
      });
    }

    return result;
  } catch (error) {
    console.error('[ERROR] 번역 적용 중 오류:', error);
    return result; // 번역 실패 시 원본 반환
  }
}

module.exports = {
    analyzeReplay,
    getReplayHeader,
    Parser // hots-parser 객체도 내보내기
};
