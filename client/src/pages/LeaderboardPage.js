import React, { useState, useEffect } from 'react';
import { fetchLeaderboard, fetchAllUsers } from '../utils/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/common/LoadingSpinner';
import axios from 'axios';

const LeaderboardPage = () => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUsingAllUsers, setIsUsingAllUsers] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const MAX_DISPLAY_RANK = 30; // 최대 표시 랭킹 수 제한

  const refreshLeaderboard = async () => {
    try {
      setRefreshing(true);
      setLoading(true);

      const response = await axios.get('/api/leaderboard');
      setLeaderboardData(response.data);

    } catch (error) {
      console.error('리더보드 조회 오류:', error);
      setError('서버 연결에 실패했습니다.');
    } finally {
      setLoading(false);
      setTimeout(() => setRefreshing(false), 500); // 애니메이션 효과를 위한 지연
    }
  };

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/leaderboard');
        setLeaderboardData(response.data);
      } catch (error) {
        console.error('리더보드 조회 오류:', error);
        setError('서버 연결에 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  // 데이터 유효성 검사 및 보정
  const validatePlayerData = (player, index) => {
    if (!player) return null;

    // 기본값 설정
    return {
      id: player.id || `user-${index}`,
      rank: player.rank || (index + 1),
      nickname: player.nickname || `유저${index+1}`,
      battletag: player.battletag || player.battleTag || `User#${index+1}`,
      mmr: player.mmr || 1500,
      wins: player.wins || 0,
      losses: player.losses || 0,
      winRate: player.winRate || 0,
      mainRole: player.mainRole || '없음',
      tier: player.tier || getTierFromMMR(player.mmr || 1500),
      totalGames: player.totalGames || (player.wins || 0) + (player.losses || 0)
    };
  };

  // MMR 기반 티어 계산 함수
  const getTierFromMMR = (mmr) => {
    if (mmr >= 2500) return '그랜드마스터';
    if (mmr >= 2200) return '마스터';
    if (mmr >= 2000) return '다이아몬드';
    if (mmr >= 1800) return '플래티넘';
    if (mmr >= 1600) return '골드';
    if (mmr >= 1400) return '실버';
    return '브론즈';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">순위표</h1>
        <div className="bg-slate-800 rounded-lg p-8 text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <p className="text-gray-400 mb-4">잠시 후 다시 시도해주세요.</p>
          <button
            onClick={() => {
              setRetryCount(0);
              setLoading(true);
              toast.info('새로고침 중...');
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // 리더보드 데이터가 비어있는 경우
  if (!leaderboardData || leaderboardData.length === 0) {
    return (
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">랭킹 시스템</h1>
        <div className="bg-slate-800 rounded-lg p-8 text-center">
          <p className="text-gray-400 mb-4">아직 랭킹 데이터가 없습니다.</p>
          <p className="text-gray-500 mb-4">첫 번째 플레이어가 되어보세요!</p>
          <button
            onClick={() => {
              setRetryCount(0);
              setLoading(true);
              toast.info('새로고침 중...');
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
          >
            새로고침
          </button>
        </div>
      </div>
    );
  }

  // 포지션에 따른 배경색과 텍스트 색상 함수
  const getPositionStyles = (position) => {
    switch(position) {
      case '탱커':
        return 'bg-blue-900 text-blue-200';
      case '투사':
        return 'bg-red-900 text-red-200';
      case '힐러':
        return 'bg-green-900 text-green-200';
      case '전문가':
        return 'bg-purple-900 text-purple-200';
      case '원거리 암살자':
        return 'bg-yellow-900 text-yellow-200';
      case '근접 암살자':
        return 'bg-orange-900 text-orange-200';
      default:
        return 'bg-gray-900 text-gray-200';
    }
  };

  // 티어에 따른 스타일 함수
  const getTierStyles = (tier) => {
    switch(tier) {
      case '그랜드마스터':
        return 'bg-gradient-to-r from-purple-600 to-pink-500 text-white';
      case '마스터':
        return 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white';
      case '다이아몬드':
        return 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white';
      case '플래티넘':
        return 'bg-gradient-to-r from-blue-400 to-teal-400 text-white';
      case '골드':
        return 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black';
      case '실버':
        return 'bg-gradient-to-r from-gray-300 to-gray-400 text-black';
      case '브론즈':
        return 'bg-gradient-to-r from-amber-700 to-yellow-800 text-white';
      default:
        return 'bg-slate-700 text-gray-200';
    }
  };

  // 티어 아이콘 함수
  const getTierIcon = (tier) => {
    switch(tier) {
      case '그랜드마스터':
        return '👑';
      case '마스터':
        return '⭐';
      case '다이아몬드':
        return '💎';
      case '플래티넘':
        return '🥇';
      case '골드':
        return '🏆';
      case '실버':
        return '🥈';
      case '브론즈':
        return '🥉';
      default:
        return '🔰';
    }
  };

  // 유효한 데이터만 필터링
  const validLeaderboardData = leaderboardData
    .filter(player => player && typeof player === 'object')
    .map(validatePlayerData);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="relative z-10 p-4">
        <div className="max-w-6xl mx-auto">
          {/* 헤더 */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
              리더보드
            </h1>
            <p className="text-xl text-gray-300">
              최고의 플레이어들과 경쟁하세요
            </p>
          </div>

          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <div className="text-gray-400">
                총 {validLeaderboardData.length}명의 플레이어
              </div>
              {isUsingAllUsers && (
                <div className="text-amber-400 text-sm bg-amber-900/30 border border-amber-500/30 px-4 py-2 rounded-xl">
                  전체 유저 표시 중 (최대 30위)
                </div>
              )}
            </div>
            <button
              onClick={refreshLeaderboard}
              disabled={refreshing || loading}
              className={`flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-4 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 ${(refreshing || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label="새로고침"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="font-medium">새로고침</span>
            </button>
          </div>

          <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-600/30 rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-700/50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">순위</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">플레이어</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300 uppercase tracking-wider">티어</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300 uppercase tracking-wider">MMR</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300 uppercase tracking-wider">전적</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300 uppercase tracking-wider">승률</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300 uppercase tracking-wider">포지션</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-600/30">
                  {/* 최대 30개만 표시되도록 보장 */}
                  {validLeaderboardData.slice(0, MAX_DISPLAY_RANK).map((player, index) => {
                    // 게임 수 계산
                    const totalGames = player.totalGames;

                    return (
                      <tr
                        key={player.id || index}
                        className={`hover:bg-slate-700/30 transition-all duration-300
                          ${index === 0 ? 'bg-gradient-to-r from-yellow-900/20 to-amber-900/20' : ''}
                          ${index < 3 ? 'border-l-4 border-yellow-500' : ''}`}
                      >
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className={`
                            inline-flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm
                            ${index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black shadow-lg' :
                              index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-500 text-black shadow-lg' :
                              index === 2 ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg' :
                              'bg-slate-600/50 text-white'}
                          `}>
                            {player.rank || (index + 1)}
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-12 h-12 bg-slate-700/30 rounded-2xl flex items-center justify-center mr-4">
                              <span className="text-2xl">{getTierIcon(player.tier)}</span>
                            </div>
                            <div>
                              <div className="text-lg font-bold text-white">{player.nickname}</div>
                              <div className="text-sm text-slate-400">{player.battletag}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-center">
                          <div className={`inline-block px-4 py-2 rounded-xl text-sm font-bold ${getTierStyles(player.tier)}`}>
                            {player.tier}
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-center">
                          <div className="text-lg text-blue-400 font-bold">{player.mmr}</div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-center">
                          <div className="text-sm">
                            <span className="text-green-400 font-bold">{player.wins}</span>
                            <span className="text-slate-400 mx-2">-</span>
                            <span className="text-red-400 font-bold">{player.losses}</span>
                            {totalGames > 0 && (
                              <div className="text-xs text-slate-400 mt-1">({totalGames}전)</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-center">
                          {totalGames > 0 ? (
                            <div className="flex items-center justify-center">
                              <div className="h-3 w-20 bg-slate-600/50 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-300"
                                  style={{ width: `${Math.min(player.winRate, 100)}%` }}
                                />
                              </div>
                              <span className="text-sm text-white ml-3 font-medium">{player.winRate}%</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">기록 없음</span>
                          )}
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-center">
                          <span className={`px-3 py-1 text-xs rounded-xl font-medium ${getPositionStyles(player.mainRole)}`}>
                            {player.mainRole}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 랭킹 시스템 안내 */}
          <div className="mt-12 bg-slate-800/30 backdrop-blur-sm border border-slate-600/30 rounded-3xl p-8">
            <h3 className="text-2xl font-bold text-white text-center mb-8">랭킹 시스템 안내</h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 티어 시스템 */}
              <div className="bg-slate-700/30 rounded-2xl p-6">
                <h4 className="text-xl font-bold text-white mb-6 text-center">티어 시스템</h4>
                <div className="grid grid-cols-1 gap-3">
                  <div className={`px-4 py-3 rounded-xl ${getTierStyles('그랜드마스터')}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{getTierIcon('그랜드마스터')}</span>
                        <span className="font-bold">그랜드마스터</span>
                      </div>
                      <span className="text-sm opacity-90">2500+</span>
                    </div>
                  </div>
                  <div className={`px-4 py-3 rounded-xl ${getTierStyles('마스터')}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{getTierIcon('마스터')}</span>
                        <span className="font-bold">마스터</span>
                      </div>
                      <span className="text-sm opacity-90">2200+</span>
                    </div>
                  </div>
                  <div className={`px-4 py-3 rounded-xl ${getTierStyles('다이아몬드')}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{getTierIcon('다이아몬드')}</span>
                        <span className="font-bold">다이아몬드</span>
                      </div>
                      <span className="text-sm opacity-90">2000+</span>
                    </div>
                  </div>
                  <div className={`px-4 py-3 rounded-xl ${getTierStyles('플래티넘')}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{getTierIcon('플래티넘')}</span>
                        <span className="font-bold">플래티넘</span>
                      </div>
                      <span className="text-sm opacity-90">1800+</span>
                    </div>
                  </div>
                  <div className={`px-4 py-3 rounded-xl ${getTierStyles('골드')}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{getTierIcon('골드')}</span>
                        <span className="font-bold">골드</span>
                      </div>
                      <span className="text-sm opacity-90">1600+</span>
                    </div>
                  </div>
                  <div className={`px-4 py-3 rounded-xl ${getTierStyles('실버')}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{getTierIcon('실버')}</span>
                        <span className="font-bold">실버</span>
                      </div>
                      <span className="text-sm opacity-90">1400+</span>
                    </div>
                  </div>
                  <div className={`px-4 py-3 rounded-xl ${getTierStyles('브론즈')}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{getTierIcon('브론즈')}</span>
                        <span className="font-bold">브론즈</span>
                      </div>
                      <span className="text-sm opacity-90">&lt;1400</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 시즌 보상 */}
              <div className="bg-slate-700/30 rounded-2xl p-6">
                <h4 className="text-xl font-bold text-white mb-6 text-center">시즌 보상</h4>
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-yellow-500 to-amber-600 p-4 rounded-xl">
                    <div className="flex items-center">
                      <span className="text-3xl mr-4">🏆</span>
                      <div>
                        <div className="font-bold text-white text-lg">1위</div>
                        <div className="text-sm text-white/90">블리자드 기프트카드 50,000원</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-slate-200 to-slate-300 p-4 rounded-xl">
                    <div className="flex items-center">
                      <span className="text-3xl mr-4">🥈</span>
                      <div>
                        <div className="font-bold text-slate-800 text-lg">2위</div>
                        <div className="text-sm text-slate-700">블리자드 기프트카드 30,000원</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-amber-600 to-amber-500 p-4 rounded-xl">
                    <div className="flex items-center">
                      <span className="text-3xl mr-4">🥉</span>
                      <div>
                        <div className="font-bold text-white text-lg">3위</div>
                        <div className="text-sm text-white/90">블리자드 기프트카드 10,000원</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center text-gray-400">
              <p className="mb-2">MMR은 매치 결과에 따라 지속적으로 업데이트됩니다.</p>
              <p className="mb-2">랭킹은 최대 {MAX_DISPLAY_RANK}위까지만 표시됩니다.</p>
              {!isUsingAllUsers && (
                <p>일반 리더보드는 최소 10회 이상의 게임을 진행한 플레이어만 표시됩니다.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
