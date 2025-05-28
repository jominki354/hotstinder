const fs = require('fs');
const path = require('path');
const Parser = require('hots-parser');

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
        console.log('[DEBUG] Parser result:', JSON.stringify(parserResult, null, 2));
        
        const { result, match, players } = parserResult;
        
        // 파싱 실패 체크 - result가 undefined이거나 OK가 아닌 경우
        if (result === undefined || result === null) {
            console.log('[DEBUG] Result is undefined or null');
            // result가 없어도 match와 players가 있으면 성공으로 간주
            if (!match || !players) {
                return {
                    success: false,
                    error: '리플레이 파싱 실패: 결과 데이터가 없습니다.'
                };
            }
        } else if (result !== Parser.ReplayStatus.OK) {
            const statusString = Parser.StatusString[result] || `Unknown status: ${result}`;
            return {
                success: false,
                error: `리플레이 파싱 실패: ${statusString}`
            };
        }

        // 기본 데이터 확인
        if (!match || !players) {
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
      
      return {
        success: true,
            match: {
                map: match.map || 'Unknown Map',
                gameMode: match.mode || 'Unknown',
                gameLength: match.length || 0,
                date: match.date || new Date().toISOString(),
                winner: match.winner || 0,
                gameVersion: match.version || 'Unknown',
                region: match.region || 'Unknown'
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
                playerCount: formattedPlayers.length
            },
            metadata: {
                fileSize: fileStats.size,
                analysisDate: new Date().toISOString(),
                parserVersion: 'hots-parser',
                parserStatus: result || 'OK'
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

        console.log(`[INFO] 리플레이 분석 시작: ${filePath}`);

        // hots-parser로 리플레이 처리
        const parserResult = Parser.processReplay(filePath, {
            getBMData: false, // 성능 향상을 위해 BM 데이터 스킵
            useAttributeName: false, // 영웅 이름 해석 사용
            overrideVerifiedBuild: true, // 새 빌드 지원
            legacyTalentKeys: false // 새로운 탤런트 키 형식 사용
        });

        console.log(`[INFO] hots-parser 결과 상태: ${parserResult.result}`);
        
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

        return formattedResult;

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

module.exports = {
    analyzeReplay,
    getReplayHeader,
    Parser // hots-parser 객체도 내보내기
};