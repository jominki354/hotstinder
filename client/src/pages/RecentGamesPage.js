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

  // 게임 시간 포맷팅 함수 (828 -> 08분28초)
  const formatGameDuration = (duration) => {
    if (!duration) return '알 수 없음';

    // 숫자로 변환
    const durationNum = parseInt(duration);
    if (isNaN(durationNum)) return duration;

    // 초 단위로 가정하고 분:초로 변환
    const minutes = Math.floor(durationNum / 60);
    const seconds = durationNum % 60;

    return `${minutes.toString().padStart(2, '0')}분${seconds.toString().padStart(2, '0')}초`;
  };

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
          // 서버에서 이미 정규화된 구조로 보내므로 그대로 사용
          // PostgreSQL 서버는 { redTeam: { name, avgMmr, players }, blueTeam: { name, avgMmr, players } } 형태로 보냄

          console.log('[DEBUG] 게임 데이터 정규화 중:', {
            id: game.id,
            redTeamType: typeof game.redTeam,
            blueTeamType: typeof game.blueTeam,
            redTeamIsArray: Array.isArray(game.redTeam),
            blueTeamIsArray: Array.isArray(game.blueTeam),
            redTeamHasPlayers: game.redTeam?.players ? true : false,
            blueTeamHasPlayers: game.blueTeam?.players ? true : false
          });

          // 서버에서 이미 올바른 구조로 보내므로 그대로 반환
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

          // 첫 번째 게임의 상세 구조 확인
          if (response.data.games.length > 0) {
            const firstGame = response.data.games[0];
            console.log('[DEBUG] 첫 번째 게임 상세 구조:', {
              id: firstGame.id,
              redTeam: firstGame.redTeam,
              blueTeam: firstGame.blueTeam,
              redTeamType: typeof firstGame.redTeam,
              blueTeamType: typeof firstGame.blueTeam,
              redTeamIsArray: Array.isArray(firstGame.redTeam),
              blueTeamIsArray: Array.isArray(firstGame.blueTeam),
              redTeamPlayers: firstGame.redTeam?.players?.length || 'no players property',
              blueTeamPlayers: firstGame.blueTeam?.players?.length || 'no players property'
            });
          }

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
    <div className="min-h-screen relative overflow-hidden">
      <div className="relative z-10 p-4">
        <div className="max-w-6xl mx-auto">
          {/* 헤더 */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
              최근 게임
            </h1>
            <p className="text-xl text-gray-300">
              최근에 진행된 게임들의 결과와 통계를 확인하세요
            </p>
          </div>

          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <div className="text-gray-400">
                총 {totalGames}개의 게임 (페이지 {currentPage}/{totalPages})
              </div>
            </div>
            <button
              onClick={() => fetchRecentGamesData(currentPage)}
              disabled={refreshing}
              className={`flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-4 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 ${refreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label="새로고침"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="font-medium">새로고침</span>
            </button>
          </div>

          <div className="space-y-6">
            {Array.isArray(recentGames) && recentGames.length > 0 ? recentGames.map((game) => (
              <div
                key={game.id}
                className={`bg-slate-800/30 backdrop-blur-sm border border-slate-600/30 rounded-3xl overflow-hidden transition-all duration-300 hover:border-blue-500/50 ${selectedMatch && selectedMatch.id === game.id ? 'ring-2 ring-blue-500' : ''}`}
              >
                <div
                  className="p-6 cursor-pointer"
                  onClick={() => handleMatchSelect(game)}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-slate-700/30 rounded-2xl flex items-center justify-center">
                        <span className="text-3xl">{getMapIcon(game.map)}</span>
                      </div>

                      <div>
                        <h3 className="text-2xl font-bold text-white mb-2">{translateMap(game.map)}</h3>
                        <div className="flex items-center gap-4 text-gray-400 text-sm">
                          <div className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{game.date} {game.time}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a2 2 0 012-2z" />
                            </svg>
                            <span className="font-mono text-xs">{game.id}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {/* 레드팀 */}
                      <div className={`px-6 py-4 rounded-2xl font-medium relative transition-all duration-300 ${
                        (game.winner === 'red' || game.winner === 'Red' || game.winner === 'RED' || game.winner === 1 || game.winner === '1')
                          ? 'bg-gradient-to-r from-red-600/40 to-red-500/30 text-red-100 border-2 border-red-400/50 shadow-xl shadow-red-500/20'
                          : 'bg-slate-700/30 text-slate-300 border border-slate-600/50'
                      }`}>
                        {(game.winner === 'red' || game.winner === 'Red' || game.winner === 'RED' || game.winner === 1 || game.winner === '1') && (
                          <div className="absolute -top-3 -right-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-red-900 text-xs px-3 py-1 rounded-full font-bold shadow-lg">
                            👑 승리
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <span className="text-red-400 font-bold text-2xl">🔴</span>
                          <div>
                            <div className="font-bold text-lg">레드팀</div>
                            <div className="text-sm opacity-75">MMR: {game.redTeam?.avgMmr || 1500}</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-center">
                        <span className="text-slate-400 text-2xl font-bold">VS</span>
                        <div className="w-16 h-1 bg-gradient-to-r from-red-500 via-slate-500 to-blue-500 mt-2 rounded-full"></div>
                      </div>

                      {/* 블루팀 */}
                      <div className={`px-6 py-4 rounded-2xl font-medium relative transition-all duration-300 ${
                        (game.winner === 'blue' || game.winner === 'Blue' || game.winner === 'BLUE' || game.winner === 0 || game.winner === '0')
                          ? 'bg-gradient-to-r from-blue-600/40 to-blue-500/30 text-blue-100 border-2 border-blue-400/50 shadow-xl shadow-blue-500/20'
                          : 'bg-slate-700/30 text-slate-300 border border-slate-600/50'
                      }`}>
                        {(game.winner === 'blue' || game.winner === 'Blue' || game.winner === 'BLUE' || game.winner === 0 || game.winner === '0') && (
                          <div className="absolute -top-3 -right-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-blue-900 text-xs px-3 py-1 rounded-full font-bold shadow-lg">
                            👑 승리
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <span className="text-blue-400 font-bold text-2xl">🔵</span>
                          <div>
                            <div className="font-bold text-lg">블루팀</div>
                            <div className="text-sm opacity-75">MMR: {game.blueTeam?.avgMmr || 1500}</div>
                          </div>
                        </div>
                      </div>

                      <button
                        className="ml-4 flex-shrink-0 p-3 text-slate-400 hover:text-white bg-slate-700/30 hover:bg-slate-600/30 rounded-xl transition-all duration-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMatchSelect(game);
                        }}
                      >
                        {selectedMatch && selectedMatch.id === game.id ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 매치 상세 정보 */}
                {selectedMatch && selectedMatch.id === game.id && (
                  <div className="border-t border-slate-600/30 bg-slate-900/30 p-6 animate-slideInUp">
                    {/* 매치 요약 정보 - 상단으로 이동 */}
                    <div className="mb-3 bg-slate-800/30 rounded-lg p-2 border border-slate-600/20">
                      <div className="flex items-center justify-center gap-6 text-xs">
                        <div className="flex items-center gap-1">
                          <span className="text-blue-400 font-medium">{translateMap(game.map)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-green-400 font-medium">{formatGameDuration(game.gameDuration || game.duration)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-400 font-medium">
                            {(game.winner === 'red' || game.winner === 'Red' || game.winner === 'RED' || game.winner === 1 || game.winner === '1') ? '레드팀' : '블루팀'} 승리
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-8">
                      {/* 레드팀 테이블 */}
                      <div className="bg-red-900/20 border border-red-500/30 rounded-2xl overflow-hidden">
                        <div className="bg-red-800/30 px-6 py-4 border-b border-red-500/30">
                          <div className="flex items-center gap-3">
                            <span className="text-red-400 font-bold text-2xl">🔴</span>
                            <h4 className="text-xl font-bold text-red-300">레드팀</h4>
                            <div className="text-sm text-red-400">평균 MMR: {game.redTeam?.avgMmr || 1500}</div>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-red-800/20 text-red-200 text-sm">
                                <th className="text-left px-4 py-3 font-medium">플레이어</th>
                                <th className="text-center px-2 py-3 font-medium">킬</th>
                                <th className="text-center px-2 py-3 font-medium">데스</th>
                                <th className="text-center px-2 py-3 font-medium">어시</th>
                                <th className="text-center px-2 py-3 font-medium">레벨</th>
                                <th className="text-center px-2 py-3 font-medium">영웅딜</th>
                                <th className="text-center px-2 py-3 font-medium">공성딜</th>
                                <th className="text-center px-2 py-3 font-medium">힐량</th>
                                <th className="text-center px-2 py-3 font-medium">경험치</th>
                                <th className="text-center px-2 py-3 font-medium">MMR 변동</th>
                              </tr>
                            </thead>
                            <tbody>
                              {game.redTeam?.players?.map((player, index) => (
                                <tr key={index} className="border-b border-red-500/20 hover:bg-red-800/10 transition-colors">
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                                        {index + 1}
                                      </div>
                                      <div className="min-w-0">
                                        <div className="font-bold text-white text-sm truncate">
                                          {player.nickname}
                                        </div>
                                        <div className="text-xs text-gray-400 truncate">{translateHero(player.hero) || player.hero || '알 수 없음'}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="text-center px-2 py-3">
                                    <span className="text-green-400 font-bold">{player.kills || 0}</span>
                                  </td>
                                  <td className="text-center px-2 py-3">
                                    <span className="text-red-400 font-bold">{player.deaths || 0}</span>
                                  </td>
                                  <td className="text-center px-2 py-3">
                                    <span className="text-blue-400 font-bold">{player.assists || 0}</span>
                                  </td>
                                  <td className="text-center px-2 py-3">
                                    <span className="text-purple-400 font-bold">{player.level || 0}</span>
                                  </td>
                                  <td className="text-center px-2 py-3">
                                    <span className="text-orange-400 font-bold text-sm">{(player.heroDamage || 0).toLocaleString()}</span>
                                  </td>
                                  <td className="text-center px-2 py-3">
                                    <span className="text-yellow-400 font-bold text-sm">{(player.siegeDamage || 0).toLocaleString()}</span>
                                  </td>
                                  <td className="text-center px-2 py-3">
                                    <span className="text-green-400 font-bold text-sm">{(player.healing || 0).toLocaleString()}</span>
                                  </td>
                                  <td className="text-center px-2 py-3">
                                    <span className="text-cyan-400 font-bold text-sm">{(player.experience || 0).toLocaleString()}</span>
                                  </td>
                                  <td className="text-center px-2 py-3">
                                    <div className="text-xs">
                                      <div className="text-blue-400 font-bold">{player.mmrAfter || player.mmrBefore || 1500}</div>
                                      <div className={`${(player.mmrChange || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {player.mmrChange > 0 ? '+' : ''}{player.mmrChange || 0}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )) || (
                                <tr>
                                  <td colSpan="10" className="text-center text-gray-400 py-4">
                                    플레이어 정보가 없습니다.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* 블루팀 테이블 */}
                      <div className="bg-blue-900/20 border border-blue-500/30 rounded-2xl overflow-hidden">
                        <div className="bg-blue-800/30 px-6 py-4 border-b border-blue-500/30">
                          <div className="flex items-center gap-3">
                            <span className="text-blue-400 font-bold text-2xl">🔵</span>
                            <h4 className="text-xl font-bold text-blue-300">블루팀</h4>
                            <div className="text-sm text-blue-400">평균 MMR: {game.blueTeam?.avgMmr || 1500}</div>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-blue-800/20 text-blue-200 text-sm">
                                <th className="text-left px-4 py-3 font-medium">플레이어</th>
                                <th className="text-center px-2 py-3 font-medium">킬</th>
                                <th className="text-center px-2 py-3 font-medium">데스</th>
                                <th className="text-center px-2 py-3 font-medium">어시</th>
                                <th className="text-center px-2 py-3 font-medium">레벨</th>
                                <th className="text-center px-2 py-3 font-medium">영웅딜</th>
                                <th className="text-center px-2 py-3 font-medium">공성딜</th>
                                <th className="text-center px-2 py-3 font-medium">힐량</th>
                                <th className="text-center px-2 py-3 font-medium">경험치</th>
                                <th className="text-center px-2 py-3 font-medium">MMR 변동</th>
                              </tr>
                            </thead>
                            <tbody>
                              {game.blueTeam?.players?.map((player, index) => (
                                <tr key={index} className="border-b border-blue-500/20 hover:bg-blue-800/10 transition-colors">
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                                        {index + 1}
                                      </div>
                                      <div className="min-w-0">
                                        <div className="font-bold text-white text-sm truncate">
                                          {player.nickname}
                                        </div>
                                        <div className="text-xs text-gray-400 truncate">{translateHero(player.hero) || player.hero || '알 수 없음'}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="text-center px-2 py-3">
                                    <span className="text-green-400 font-bold">{player.kills || 0}</span>
                                  </td>
                                  <td className="text-center px-2 py-3">
                                    <span className="text-red-400 font-bold">{player.deaths || 0}</span>
                                  </td>
                                  <td className="text-center px-2 py-3">
                                    <span className="text-blue-400 font-bold">{player.assists || 0}</span>
                                  </td>
                                  <td className="text-center px-2 py-3">
                                    <span className="text-purple-400 font-bold">{player.level || 0}</span>
                                  </td>
                                  <td className="text-center px-2 py-3">
                                    <span className="text-orange-400 font-bold text-sm">{(player.heroDamage || 0).toLocaleString()}</span>
                                  </td>
                                  <td className="text-center px-2 py-3">
                                    <span className="text-yellow-400 font-bold text-sm">{(player.siegeDamage || 0).toLocaleString()}</span>
                                  </td>
                                  <td className="text-center px-2 py-3">
                                    <span className="text-green-400 font-bold text-sm">{(player.healing || 0).toLocaleString()}</span>
                                  </td>
                                  <td className="text-center px-2 py-3">
                                    <span className="text-cyan-400 font-bold text-sm">{(player.experience || 0).toLocaleString()}</span>
                                  </td>
                                  <td className="text-center px-2 py-3">
                                    <div className="text-xs">
                                      <div className="text-blue-400 font-bold">{player.mmrAfter || player.mmrBefore || 1500}</div>
                                      <div className={`${(player.mmrChange || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {player.mmrChange > 0 ? '+' : ''}{player.mmrChange || 0}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )) || (
                                <tr>
                                  <td colSpan="10" className="text-center text-gray-400 py-4">
                                    플레이어 정보가 없습니다.
                                  </td>
                                </tr>
                              )}
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
            <div className="flex justify-center mt-8">
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
    </div>
  );
};

export default RecentGamesPage;
