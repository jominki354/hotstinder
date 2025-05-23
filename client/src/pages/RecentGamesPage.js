import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import LoadingSpinner from '../components/common/LoadingSpinner';

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
      '알터랙 고개': '⛰️'
    };
    
    return mapIcons[mapName] || '🗺️'; // 매핑이 없으면 기본 지도 아이콘 사용
  };

  const fetchRecentGames = async (page = 1) => {
    try {
      setLoading(true);
      setRefreshing(true);
      
      // 캐싱 방지 및 페이지 정보 추가
      const timestamp = new Date().getTime();
      const response = await axios.get(`/api/matchmaking/recent-games?limit=${GAMES_PER_PAGE}&page=${page}&t=${timestamp}`);
      
      // 정상적인 응답인지 확인
      if (response && response.data) {
        // 데이터 유효성 검사 후 저장
        const validGames = Array.isArray(response.data) 
          ? response.data.filter(game => game && game.id) 
          : [];
          
        // 시간 역순 정렬 (최신 순)
        const sortedGames = [...validGames].sort((a, b) => {
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
        
        setRecentGames(sortedGames);
        
        // 총 게임 수 업데이트 (서버에서 제공하는 경우 사용)
        if (response.headers['x-total-count']) {
          setTotalGames(parseInt(response.headers['x-total-count']));
        } else {
          // 헤더에 없는 경우 기본값으로 설정
          setTotalGames(Math.max(sortedGames.length, totalGames));
        }
        
        setError(null);
      } else {
        setRecentGames([]);
        setError('응답 데이터 형식이 올바르지 않습니다.');
      }
    } catch (err) {
      console.error('최근 게임 데이터 가져오기 오류:', err);
      setError('최근 게임 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
      setTimeout(() => setRefreshing(false), 500); // 애니메이션 효과를 위한 지연
    }
  };

  // 페이지 변경 시 데이터 다시 로드
  useEffect(() => {
    fetchRecentGames(currentPage);
  }, [currentPage]);

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
            onClick={() => fetchRecentGames(currentPage)}
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
    <div className="container mx-auto px-4 pt-8 pb-12">
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl shadow-xl p-6 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">최근 게임</h1>
            <p className="text-slate-400">최근에 진행된 게임들의 결과와 통계를 확인하세요</p>
          </div>
          <div className="flex items-center">
            <button 
              onClick={() => fetchRecentGames(currentPage)}
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

        <div className="grid grid-cols-1 gap-6 mb-8">
          {recentGames.map((game) => (
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
                    <h3 className="text-lg font-bold text-white">{game.map}</h3>
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p>{game.date} {game.time}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between gap-3 md:justify-end">
                  <div className="flex items-center gap-4">
                    <div className={`px-4 py-2 rounded-lg font-medium ${game.winner === 'blue' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-slate-700/50 text-slate-300 border border-slate-600'}`}>
                      <span className="hidden sm:inline">블루팀</span>
                      <span className="sm:hidden">B</span>: {game.blueTeam.avgMmr}
                    </div>
                    
                    <div className="flex flex-col items-center">
                      <span className="text-slate-500 text-xs">VS</span>
                      {game.winner && (
                        <div className="mt-1 text-xs font-medium text-center">
                          {game.winner === 'blue' ? (
                            <span className="text-blue-400">승리 ←</span>
                          ) : (
                            <span className="text-red-400">→ 승리</span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className={`px-4 py-2 rounded-lg font-medium ${game.winner === 'red' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-slate-700/50 text-slate-300 border border-slate-600'}`}>
                      <span className="hidden sm:inline">레드팀</span>
                      <span className="sm:hidden">R</span>: {game.redTeam.avgMmr}
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

              {selectedMatch && selectedMatch.id === game.id && (
                <div className="p-5 bg-slate-900/50">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* 블루 팀 */}
                    <div className={`w-full md:w-1/2 p-4 rounded-lg ${game.winner === 'blue' ? 'bg-blue-900/20 border border-blue-800/30' : 'bg-slate-800/50 border border-slate-700/30'}`}>
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-blue-300 font-bold">블루 팀</h4>
                        {game.winner === 'blue' && <div className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-medium">승리</div>}
                      </div>
                      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800/50">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-slate-400 border-b border-slate-700/50">
                              <th className="text-left py-2 px-2 w-1/2 font-medium">플레이어</th>
                              <th className="text-left py-2 px-2 w-1/4 font-medium">역할</th>
                              <th className="text-right py-2 px-2 w-1/4 font-medium">MMR 변동</th>
                            </tr>
                          </thead>
                          <tbody>
                            {game.blueTeam.players.map((player, index) => {
                              // 블루팀에서 MMR이 가장 높은 플레이어 확인
                              const isHighestMmr = player.mmrAfter && 
                                Math.max(...game.blueTeam.players
                                  .filter(p => p.mmrAfter)
                                  .map(p => p.mmrAfter)) === player.mmrAfter;
                              
                              return (
                              <tr key={`blue-${index}`} className="border-b border-slate-700/30 hover:bg-blue-900/10">
                                <td className="py-2 px-2 text-white">
                                  <div className="flex items-center">
                                    {isHighestMmr && <span className="text-yellow-400 mr-1">👑</span>}
                                    <span className="truncate">{player.nickname}</span>
                                  </div>
                                </td>
                                <td className="py-2 px-2 text-blue-300">{player.role}</td>
                                <td className="py-2 px-2 text-right">
                                  {player.mmrChange !== undefined && (
                                    <div className="inline-flex items-center">
                                      <span className={`${player.mmrChange > 0 ? 'text-green-400' : 'text-red-400'} font-medium`}>
                                        {player.mmrChange > 0 ? '+' : ''}{player.mmrChange}
                                      </span>
                                      {player.mmrAfter && (
                                        <span className="text-slate-500 ml-1">({player.mmrAfter})</span>
                                      )}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            )})}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* 레드 팀 */}
                    <div className={`w-full md:w-1/2 p-4 rounded-lg ${game.winner === 'red' ? 'bg-red-900/20 border border-red-800/30' : 'bg-slate-800/50 border border-slate-700/30'}`}>
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-red-300 font-bold">레드 팀</h4>
                        {game.winner === 'red' && <div className="bg-red-600 text-white text-xs px-3 py-1 rounded-full font-medium">승리</div>}
                      </div>
                      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800/50">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-slate-400 border-b border-slate-700/50">
                              <th className="text-left py-2 px-2 w-1/2 font-medium">플레이어</th>
                              <th className="text-left py-2 px-2 w-1/4 font-medium">역할</th>
                              <th className="text-right py-2 px-2 w-1/4 font-medium">MMR 변동</th>
                            </tr>
                          </thead>
                          <tbody>
                            {game.redTeam.players.map((player, index) => {
                              // 레드팀에서 MMR이 가장 높은 플레이어 확인
                              const isHighestMmr = player.mmrAfter && 
                                Math.max(...game.redTeam.players
                                  .filter(p => p.mmrAfter)
                                  .map(p => p.mmrAfter)) === player.mmrAfter;
                              
                              return (
                              <tr key={`red-${index}`} className="border-b border-slate-700/30 hover:bg-red-900/10">
                                <td className="py-2 px-2 text-white">
                                  <div className="flex items-center">
                                    {isHighestMmr && <span className="text-yellow-400 mr-1">👑</span>}
                                    <span className="truncate">{player.nickname}</span>
                                  </div>
                                </td>
                                <td className="py-2 px-2 text-red-300">{player.role}</td>
                                <td className="py-2 px-2 text-right">
                                  {player.mmrChange !== undefined && (
                                    <div className="inline-flex items-center">
                                      <span className={`${player.mmrChange > 0 ? 'text-green-400' : 'text-red-400'} font-medium`}>
                                        {player.mmrChange > 0 ? '+' : ''}{player.mmrChange}
                                      </span>
                                      {player.mmrAfter && (
                                        <span className="text-slate-500 ml-1">({player.mmrAfter})</span>
                                      )}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            )})}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
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