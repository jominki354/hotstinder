import React, { useState, useEffect, useCallback } from 'react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { translateHero, translateMap, translateTeam } from '../utils/hotsTranslations';
import axios from 'axios';

const RecentGamesPage = () => {
  const [recentGames, setRecentGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalGames, setTotalGames] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);

  const GAMES_PER_PAGE = 30;

  // 맵 이름에 따라 적절한 아이콘 반환
  const getMapIcon = (mapName) => {
    // 한국어로 번역된 맵 이름으로 아이콘 매핑
    const translatedMapName = translateMap(mapName);
    const mapIcons = {
      '용의 둥지': '🐉',
      '저주받은 골짜기': '👻',
      '공포의 정원': '🌿',
      '하늘 사원': '🏛️',
      '거미 여왕의 무덤': '🕸️',
      '영원의 전쟁터': '⚔️',
      '불지옥 신단': '🔥',
      '파멸의 탑': '🗼',
      '볼스카야 공장': '🏭',
      '알터랙 고개': '⛰️',
      '검은심장 만': '🏴‍☠️',
      '유령 광산': '⛏️',
      '브락시스 항전': '🚀',
      '핵탄두 격전지': '💣',
      '하나무라 사원': '🏯'
    };

    return mapIcons[translatedMapName] || '🗺️'; // 매핑이 없으면 기본 지도 아이콘 사용
  };

  const fetchRecentGamesData = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setRefreshing(true);

      // 캐싱 방지 및 페이지 정보 추가
      const response = await axios.get('/api/matchmaking/recent-games', {
        params: {
          page: page,
          limit: GAMES_PER_PAGE
        }
      });

      // 정상적인 응답인지 확인
      if (response && response.data) {
        // 서버에서 games 배열로 응답하는 경우와 직접 배열로 응답하는 경우 모두 처리
        const gamesData = response.data.games || response.data;

        // 데이터 유효성 검사 후 저장
        const validGames = Array.isArray(gamesData)
          ? gamesData.filter(game => game && game.id)
          : [];

        // 데이터 구조 정규화 (PostgreSQL과 MongoDB 응답 모두 처리)
        const normalizedGames = validGames.map(game => {
          // PostgreSQL 서버 응답 구조 (redTeam, blueTeam이 직접 배열)
          if (Array.isArray(game.redTeam) && Array.isArray(game.blueTeam)) {
            // 레드팀 MMR 평균 계산
            const redTeamMmrs = game.redTeam
              .map(player => player.mmrAfter || player.mmrBefore || 1500)
              .filter(mmr => mmr > 0);
            const redAvgMmr = redTeamMmrs.length > 0
              ? Math.round(redTeamMmrs.reduce((sum, mmr) => sum + mmr, 0) / redTeamMmrs.length)
              : 1500;

            // 블루팀 MMR 평균 계산
            const blueTeamMmrs = game.blueTeam
              .map(player => player.mmrAfter || player.mmrBefore || 1500)
              .filter(mmr => mmr > 0);
            const blueAvgMmr = blueTeamMmrs.length > 0
              ? Math.round(blueTeamMmrs.reduce((sum, mmr) => sum + mmr, 0) / blueTeamMmrs.length)
              : 1500;

            return {
              ...game,
              redTeam: {
                name: '레드팀',
                avgMmr: redAvgMmr,
                players: game.redTeam.map(player => ({
                  id: player.id,
                  nickname: player.nickname || player.battletag || '알 수 없음',
                  hero: player.hero || '알 수 없음',
                  role: player.role || '알 수 없음',
                  kills: player.kills || 0,
                  deaths: player.deaths || 0,
                  assists: player.assists || 0,
                  heroDamage: player.heroDamage || 0,
                  siegeDamage: player.siegeDamage || 0,
                  healing: player.healing || 0,
                  mmrAfter: player.mmrAfter || 1500,
                  mmrBefore: player.mmrBefore || 1500,
                  mmrChange: player.mmrChange || 0
                }))
              },
              blueTeam: {
                name: '블루팀',
                avgMmr: blueAvgMmr,
                players: game.blueTeam.map(player => ({
                  id: player.id,
                  nickname: player.nickname || player.battletag || '알 수 없음',
                  hero: player.hero || '알 수 없음',
                  role: player.role || '알 수 없음',
                  kills: player.kills || 0,
                  deaths: player.deaths || 0,
                  assists: player.assists || 0,
                  heroDamage: player.heroDamage || 0,
                  siegeDamage: player.siegeDamage || 0,
                  healing: player.healing || 0,
                  mmrAfter: player.mmrAfter || 1500,
                  mmrBefore: player.mmrBefore || 1500,
                  mmrChange: player.mmrChange || 0
                }))
              }
            };
          }

          // MongoDB API 응답 구조 (이미 정규화된 구조) 또는 이미 정규화된 PostgreSQL 응답
          return game;
        });

        // 시간 역순 정렬 (최신 순)
        const sortedGames = [...normalizedGames].sort((a, b) => {
          // 날짜 문자열로부터 Date 객체 생성
          let dateA, dateB;

          try {
            dateA = a.createdAt ? new Date(a.createdAt) : new Date(`${a.date} ${a.time}`);
          } catch (e) {
            dateA = new Date(0); // 오류 시 기본값
          }

          try {
            dateB = b.createdAt ? new Date(b.createdAt) : new Date(`${b.date} ${b.time}`);
          } catch (e) {
            dateB = new Date(0); // 오류 시 기본값
          }

          return dateB - dateA; // 내림차순 (최신이 먼저)
        });

        if (response.data && response.data.games) {
          console.log('[DEBUG] 최근 게임 데이터:', response.data.games.slice(0, 3)); // 처음 3개 게임만 로그

          // 특정 매치 ID 디버깅
          const targetMatch = response.data.games.find(game => game.id === '4223fae8-cedf-409f-92ee-18920a35c867');
          if (targetMatch) {
            console.log('[DEBUG] 타겟 매치 정보:', {
              id: targetMatch.id,
              winner: targetMatch.winner,
              winnerType: typeof targetMatch.winner,
              map: targetMatch.map,
              redTeam: targetMatch.redTeam?.players?.length || 0,
              blueTeam: targetMatch.blueTeam?.players?.length || 0
            });
          }

          setRecentGames(sortedGames);
          setTotalGames(response.data.pagination?.total || response.data.games.length);
        } else {
          setRecentGames([]);
          setError('응답 데이터 형식이 올바르지 않습니다.');
        }
      } else {
        setRecentGames([]);
        setError('응답 데이터 형식이 올바르지 않습니다.');
      }
    } catch (err) {
      console.error('최근 게임 데이터 가져오기 오류:', err);
      setError('최근 게임 데이터를 불러오는데 실패했습니다.');
      setRecentGames([]); // 오류 시 빈 배열로 설정
    } finally {
      setLoading(false);
      setTimeout(() => setRefreshing(false), 500); // 애니메이션 효과를 위한 지연
    }
  }, [GAMES_PER_PAGE, totalGames]);

  // 페이지 변경 시 데이터 다시 로드
  useEffect(() => {
    fetchRecentGamesData(currentPage);
  }, [currentPage, fetchRecentGamesData]);

  // 페이지 이동 함수
  const goToPage = (page) => {
    if (page < 1 || page > Math.ceil(totalGames / GAMES_PER_PAGE)) return;
    setCurrentPage(page);
    window.scrollTo(0, 0); // 페이지 상단으로 스크롤
  };

  // 매치 선택 함수
  const handleMatchSelect = (match) => {
    setSelectedMatch(selectedMatch && selectedMatch.id === match.id ? null : match);
  };

  // 전체 페이지 수 계산
  const totalPages = Math.max(1, Math.ceil(totalGames / GAMES_PER_PAGE));

  if (loading && !refreshing) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error && recentGames.length === 0) {
    return (
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">최근 게임</h1>
        <div className="bg-slate-800 rounded-lg p-8 text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <p className="text-gray-400 mb-4">잠시 후 다시 시도해주세요.</p>
          <button
            onClick={() => fetchRecentGamesData(currentPage)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // 게임 데이터가 없는 경우
  if (recentGames.length === 0) {
    return (
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">최근 게임</h1>
        <div className="bg-slate-800 rounded-lg p-8 text-center">
          <p className="text-gray-400 mb-4">아직 플레이된 게임이 없습니다.</p>
          <p className="text-gray-500">게임이 완료되면 이곳에 표시됩니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-8 pb-12 max-w-7xl">
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl shadow-xl p-6 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">최근 게임</h1>
            <p className="text-slate-400">최근에 진행된 게임들의 결과와 통계를 확인하세요</p>
          </div>
          <div className="flex items-center">
            <button
              onClick={() => fetchRecentGamesData(currentPage)}
              disabled={refreshing}
              className={`flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors ${refreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label="새로고침"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="font-medium">새로고침</span>
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {Array.isArray(recentGames) && recentGames.length > 0 ? recentGames.map((game) => (
            <div
              key={game.id}
              className={`bg-slate-900/80 rounded-lg shadow-lg overflow-hidden transition-all duration-200 hover:shadow-indigo-500/20 hover:shadow-xl border border-slate-700 ${selectedMatch && selectedMatch.id === game.id ? 'ring-2 ring-indigo-500' : ''}`}
            >
              <div
                className="bg-gradient-to-r from-slate-800 to-slate-900 px-5 py-4 flex flex-col md:flex-row md:items-center justify-between cursor-pointer"
                onClick={() => handleMatchSelect(game)}
              >
                <div className="flex items-center gap-4 mb-3 md:mb-0">
                  <div className="flex-shrink-0 w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center">
                    <span className="text-xl">{getMapIcon(game.map)}</span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white">{translateMap(game.map)}</h3>
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a2 2 0 012-2z" />
                      </svg>
                      <p>매치 ID: {game.id}</p>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p>{game.date} {game.time}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4">
                  <div className="flex items-center gap-4">
                    {/* 레드팀 */}
                    <div className={`px-6 py-3 rounded-lg font-medium relative transition-all duration-200 ${
                      (game.winner === 'red' || game.winner === 'Red' || game.winner === 'RED' || game.winner === 1 || game.winner === '1')
                        ? 'bg-gradient-to-r from-red-600/60 to-red-500/50 text-red-100 border-2 border-red-400 shadow-xl shadow-red-500/50 ring-2 ring-red-400/30 scale-102 transform'
                        : 'bg-slate-700/50 text-slate-300 border border-slate-600 hover:bg-slate-600/50'
                    }`}>
                      {(game.winner === 'red' || game.winner === 'Red' || game.winner === 'RED' || game.winner === 1 || game.winner === '1') && (
                        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-red-900 text-xs px-2 py-1 rounded-full font-bold shadow-lg border border-yellow-300 z-10">
                          👑 승리
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-red-400 font-bold text-xl">🔴</span>
                        <span className="hidden sm:inline font-bold text-lg">레드팀</span>
                        <span className="sm:hidden font-bold text-lg">R</span>
                        <span className="text-sm opacity-75">MMR:</span>
                        <span className="font-bold text-xl">{game.redTeam?.avgMmr || 1500}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-center">
                      <span className="text-slate-400 text-xl font-bold">VS</span>
                      <div className="w-12 h-1 bg-gradient-to-r from-red-500 via-slate-500 to-blue-500 mt-1 rounded-full"></div>
                    </div>

                    {/* 블루팀 */}
                    <div className={`px-6 py-3 rounded-lg font-medium relative transition-all duration-200 ${
                      (game.winner === 'blue' || game.winner === 'Blue' || game.winner === 'BLUE' || game.winner === 0 || game.winner === '0')
                        ? 'bg-gradient-to-r from-blue-600/60 to-blue-500/50 text-blue-100 border-2 border-blue-400 shadow-xl shadow-blue-500/50 ring-2 ring-blue-400/30 scale-102 transform'
                        : 'bg-slate-700/50 text-slate-300 border border-slate-600 hover:bg-slate-600/50'
                    }`}>
                      {(game.winner === 'blue' || game.winner === 'Blue' || game.winner === 'BLUE' || game.winner === 0 || game.winner === '0') && (
                        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-blue-900 text-xs px-2 py-1 rounded-full font-bold shadow-lg border border-yellow-300 z-10">
                          👑 승리
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-blue-400 font-bold text-xl">🔵</span>
                        <span className="hidden sm:inline font-bold text-lg">블루팀</span>
                        <span className="sm:hidden font-bold text-lg">B</span>
                        <span className="text-sm opacity-75">MMR:</span>
                        <span className="font-bold text-xl">{game.blueTeam?.avgMmr || 1500}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    className="ml-2 flex-shrink-0 p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMatchSelect(game);
                    }}
                  >
                    {selectedMatch && selectedMatch.id === game.id ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* 매치 상세 정보 (선택된 경우에만 표시) */}
              {selectedMatch && selectedMatch.id === game.id && (
                <div className="p-5 bg-slate-900/50">
                  <div className="space-y-6">
                    {/* 레드 팀 */}
                    <div className={`w-full p-6 rounded-xl transition-all duration-200 ${
                      (game.winner === 'red' || game.winner === 'Red' || game.winner === 'RED' || game.winner === 1 || game.winner === '1')
                        ? 'bg-gradient-to-br from-red-900/30 to-red-800/20 border-2 border-red-600/50 shadow-lg shadow-red-500/20'
                        : 'bg-slate-800/60 border border-slate-700/50'
                    }`}>
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-red-400 text-2xl">🔴</span>
                          <h4 className="text-xl font-bold text-red-300">레드팀</h4>
                          <span className="text-slate-400 text-sm">평균 MMR: {game.redTeam?.avgMmr || 1500}</span>
                          {(game.winner === 'red' || game.winner === 'Red' || game.winner === 'RED' || game.winner === 1 || game.winner === '1') && (
                            <span className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-red-900 px-2 py-1 rounded-full text-xs font-bold ml-2">
                              👑 승리
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="text-slate-400 border-b border-slate-700/50">
                              <th className="text-left py-3 px-3 font-medium text-sm min-w-[120px]">플레이어</th>
                              <th className="text-left py-3 px-3 font-medium text-sm min-w-[100px]">영웅</th>
                              <th className="text-center py-3 px-3 font-medium text-sm min-w-[50px]">킬</th>
                              <th className="text-center py-3 px-3 font-medium text-sm min-w-[50px]">데스</th>
                              <th className="text-center py-3 px-3 font-medium text-sm min-w-[50px]">어시</th>
                              <th className="text-center py-3 px-3 font-medium text-sm min-w-[50px]">레벨</th>
                              <th className="text-center py-3 px-3 font-medium text-sm min-w-[100px]" title="영웅 피해량">영웅딜</th>
                              <th className="text-center py-3 px-3 font-medium text-sm min-w-[100px]" title="공성 피해량">공성딜</th>
                              <th className="text-center py-3 px-3 font-medium text-sm min-w-[100px]" title="치유량">힐량</th>
                              <th className="text-center py-3 px-3 font-medium text-sm min-w-[100px]" title="경험치 기여도">경험치</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Array.isArray(game.redTeam?.players) && game.redTeam.players.map((player, index) => {
                              // 레드팀에서 MMR이 가장 높은 플레이어 확인
                              const isHighestMmr = player.mmrAfter &&
                                Math.max(...game.redTeam.players
                                  .filter(p => p.mmrAfter)
                                  .map(p => p.mmrAfter)) === player.mmrAfter;

                              return (
                                <tr key={`red-${index}`} className="border-b border-slate-700/30 hover:bg-red-900/10">
                                  <td className="py-3 px-3 text-white">
                                    <div className="flex items-center">
                                      {isHighestMmr && <span className="text-yellow-400 mr-2 text-sm">👑</span>}
                                      <span className="text-sm whitespace-nowrap" title={player.nickname || '알 수 없음'}>
                                        {player.nickname || '알 수 없음'}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-3 text-red-300 text-sm whitespace-nowrap" title={translateHero(player.hero) || '알 수 없음'}>
                                    {translateHero(player.hero) || '알 수 없음'}
                                  </td>
                                  <td className="py-3 px-3 text-center text-green-400 font-bold text-sm">{player.kills || 0}</td>
                                  <td className="py-3 px-3 text-center text-red-400 font-bold text-sm">{player.deaths || 0}</td>
                                  <td className="py-3 px-3 text-center text-yellow-400 font-bold text-sm">{player.assists || 0}</td>
                                  <td className="py-3 px-3 text-center text-indigo-400 font-bold text-sm">{player.level || 0}</td>
                                  <td className="py-3 px-3 text-center text-orange-400 text-sm" title={`영웅 피해량: ${(player.heroDamage || 0).toLocaleString()}`}>
                                    <div className="font-semibold">{(player.heroDamage || 0).toLocaleString()}</div>
                                  </td>
                                  <td className="py-3 px-3 text-center text-cyan-400 text-sm" title={`공성 피해량: ${(player.siegeDamage || 0).toLocaleString()}`}>
                                    <div className="font-semibold">{(player.siegeDamage || 0).toLocaleString()}</div>
                                  </td>
                                  <td className="py-3 px-3 text-center text-purple-400 text-sm" title={`치유량: ${(player.healing || 0).toLocaleString()}`}>
                                    <div className="font-semibold">{(player.healing || 0).toLocaleString()}</div>
                                  </td>
                                  <td className="py-3 px-3 text-center text-green-300 text-sm" title={`경험치 기여도: ${(player.experience || 0).toLocaleString()}`}>
                                    <div className="font-semibold">{(player.experience || 0).toLocaleString()}</div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* 블루 팀 */}
                    <div className={`w-full p-6 rounded-xl transition-all duration-200 ${
                      (game.winner === 'blue' || game.winner === 'Blue' || game.winner === 'BLUE' || game.winner === 0 || game.winner === '0')
                        ? 'bg-gradient-to-br from-blue-900/30 to-blue-800/20 border-2 border-blue-600/50 shadow-lg shadow-blue-500/20'
                        : 'bg-slate-800/60 border border-slate-700/50'
                    }`}>
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-blue-400 text-2xl">🔵</span>
                          <h4 className="text-xl font-bold text-blue-300">블루팀</h4>
                          <span className="text-slate-400 text-sm">평균 MMR: {game.blueTeam?.avgMmr || 1500}</span>
                          {(game.winner === 'blue' || game.winner === 'Blue' || game.winner === 'BLUE' || game.winner === 0 || game.winner === '0') && (
                            <span className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-blue-900 px-2 py-1 rounded-full text-xs font-bold ml-2">
                              👑 승리
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="text-slate-400 border-b border-slate-700/50">
                              <th className="text-left py-3 px-3 font-medium text-sm min-w-[120px]">플레이어</th>
                              <th className="text-left py-3 px-3 font-medium text-sm min-w-[100px]">영웅</th>
                              <th className="text-center py-3 px-3 font-medium text-sm min-w-[50px]">킬</th>
                              <th className="text-center py-3 px-3 font-medium text-sm min-w-[50px]">데스</th>
                              <th className="text-center py-3 px-3 font-medium text-sm min-w-[50px]">어시</th>
                              <th className="text-center py-3 px-3 font-medium text-sm min-w-[50px]">레벨</th>
                              <th className="text-center py-3 px-3 font-medium text-sm min-w-[100px]" title="영웅 피해량">영웅딜</th>
                              <th className="text-center py-3 px-3 font-medium text-sm min-w-[100px]" title="공성 피해량">공성딜</th>
                              <th className="text-center py-3 px-3 font-medium text-sm min-w-[100px]" title="치유량">힐량</th>
                              <th className="text-center py-3 px-3 font-medium text-sm min-w-[100px]" title="경험치 기여도">경험치</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Array.isArray(game.blueTeam?.players) && game.blueTeam.players.map((player, index) => {
                              // 블루팀에서 MMR이 가장 높은 플레이어 확인
                              const isHighestMmr = player.mmrAfter &&
                                Math.max(...game.blueTeam.players
                                  .filter(p => p.mmrAfter)
                                  .map(p => p.mmrAfter)) === player.mmrAfter;

                              return (
                                <tr key={`blue-${index}`} className="border-b border-slate-700/30 hover:bg-blue-900/10">
                                  <td className="py-3 px-3 text-white">
                                    <div className="flex items-center">
                                      {isHighestMmr && <span className="text-yellow-400 mr-2 text-sm">👑</span>}
                                      <span className="text-sm whitespace-nowrap" title={player.nickname || '알 수 없음'}>
                                        {player.nickname || '알 수 없음'}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-3 text-blue-300 text-sm whitespace-nowrap" title={translateHero(player.hero) || '알 수 없음'}>
                                    {translateHero(player.hero) || '알 수 없음'}
                                  </td>
                                  <td className="py-3 px-3 text-center text-green-400 font-bold text-sm">{player.kills || 0}</td>
                                  <td className="py-3 px-3 text-center text-red-400 font-bold text-sm">{player.deaths || 0}</td>
                                  <td className="py-3 px-3 text-center text-yellow-400 font-bold text-sm">{player.assists || 0}</td>
                                  <td className="py-3 px-3 text-center text-indigo-400 font-bold text-sm">{player.level || 0}</td>
                                  <td className="py-3 px-3 text-center text-orange-400 text-sm" title={`영웅 피해량: ${(player.heroDamage || 0).toLocaleString()}`}>
                                    <div className="font-semibold">{(player.heroDamage || 0).toLocaleString()}</div>
                                  </td>
                                  <td className="py-3 px-3 text-center text-cyan-400 text-sm" title={`공성 피해량: ${(player.siegeDamage || 0).toLocaleString()}`}>
                                    <div className="font-semibold">{(player.siegeDamage || 0).toLocaleString()}</div>
                                  </td>
                                  <td className="py-3 px-3 text-center text-purple-400 text-sm" title={`치유량: ${(player.healing || 0).toLocaleString()}`}>
                                    <div className="font-semibold">{(player.healing || 0).toLocaleString()}</div>
                                  </td>
                                  <td className="py-3 px-3 text-center text-green-300 text-sm" title={`경험치 기여도: ${(player.experience || 0).toLocaleString()}`}>
                                    <div className="font-semibold">{(player.experience || 0).toLocaleString()}</div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )) : (
            <div className="bg-slate-800 rounded-lg p-8 text-center">
              <p className="text-gray-400 mb-4">표시할 게임이 없습니다.</p>
              <p className="text-gray-500">게임이 완료되면 이곳에 표시됩니다.</p>
            </div>
          )}
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex justify-center">
            <div className="inline-flex rounded-md bg-slate-800 p-1 shadow-lg">
              <button
                onClick={() => goToPage(1)}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-md text-sm font-medium ${currentPage === 1 ? 'text-slate-500 cursor-not-allowed' : 'text-white hover:bg-slate-700'}`}
              >
                처음
              </button>
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-md text-sm font-medium ${currentPage === 1 ? 'text-slate-500 cursor-not-allowed' : 'text-white hover:bg-slate-700'}`}
              >
                이전
              </button>
              <span className="px-3 py-1 bg-indigo-600 text-white rounded-md text-sm font-medium">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded-md text-sm font-medium ${currentPage === totalPages ? 'text-slate-500 cursor-not-allowed' : 'text-white hover:bg-slate-700'}`}
              >
                다음
              </button>
              <button
                onClick={() => goToPage(totalPages)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded-md text-sm font-medium ${currentPage === totalPages ? 'text-slate-500 cursor-not-allowed' : 'text-white hover:bg-slate-700'}`}
              >
                마지막
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentGamesPage;
