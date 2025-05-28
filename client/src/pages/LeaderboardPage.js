import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/common/LoadingSpinner';

const LeaderboardPage = () => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUsingAllUsers, setIsUsingAllUsers] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const MAX_DISPLAY_RANK = 30; // 최대 표시 랭킹 수 제한

  const refreshLeaderboard = () => {
    setRefreshing(true);
    setRetryCount(prev => prev + 1);
    setLoading(true);
    toast.info('리더보드 새로고침 중...');
    // 새로고침 효과를 위해 약간의 지연 설정
    setTimeout(() => {
      setRefreshing(false);
    }, 800);
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);

        // API 요청 시도 - 캐싱 방지를 위한 타임스탬프 추가
        console.log('리더보드 데이터 요청 중...');
        const timestamp = new Date().getTime();
        const res = await axios.get(`/api/users/leaderboard?minGames=1&limit=${MAX_DISPLAY_RANK}&t=${timestamp}`);

        // 응답이 유효한 배열인지 확인
        if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
          console.log(`리더보드 데이터 로드 성공: ${res.data.length}명의 플레이어`);

          // 유효한 데이터만 필터링
          const validData = res.data.filter(item =>
            item && typeof item === 'object' &&
            (item.nickname || item.battletag || item.mmr)
          );

          if (validData.length > 0) {
            // 최대 30명까지만 표시
            const limitedData = validData.slice(0, MAX_DISPLAY_RANK);
            setLeaderboardData(limitedData);
            setIsUsingAllUsers(false);
            setRetryCount(0); // 성공적으로 로드했으므로 재시도 카운터 초기화
            return; // 성공했으므로 함수 종료
          } else {
            console.warn('유효한 플레이어 데이터가 없습니다');
          }
        } else {
          console.warn('리더보드 데이터가 비어있거나 유효하지 않음:', res?.data);
        }

        // 리더보드 데이터 로드에 실패한 경우, 재시도 또는 대체 API 사용
        if (retryCount < 3) {
          console.log(`리더보드 데이터 재시도 (${retryCount + 1}/3)...`);
          setRetryCount(prev => prev + 1);
          setTimeout(() => {
            setLoading(false); // 로딩 상태 리셋
          }, 500); // 0.5초 대기 후 재시도
        } else {
          console.log('최대 재시도 횟수 도달, 전체 유저 목록으로 대체');
          await fetchAllUsersAsFallback();
        }
      } catch (err) {
        console.error('리더보드 데이터 로드 실패:', err);

        // 네트워크 오류 또는 서버 오류 발생 시
        if (retryCount < 3) {
          console.log(`리더보드 데이터 재시도 (${retryCount + 1}/3)...`);
          setRetryCount(prev => prev + 1);
          setTimeout(() => {
            setLoading(false); // 로딩 상태 리셋
          }, 500); // 0.5초 대기 후 재시도
        } else {
          console.log('최대 재시도 횟수 도달, 전체 유저 목록으로 대체');
          await fetchAllUsersAsFallback();
        }
      } finally {
        setLoading(false);
      }
    };

    // 리더보드 API 실패 시 전체 유저 목록으로 대체하는 함수
    const fetchAllUsersAsFallback = async () => {
      try {
        console.log('전체 유저 목록 불러오는 중...');
        // API 요청 - 캐싱 방지를 위한 타임스탬프 추가
        const timestamp = new Date().getTime();
        const res = await axios.get(`/api/users/all?limit=${MAX_DISPLAY_RANK}&t=${timestamp}`);

        if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
          console.log(`전체 유저 데이터 로드 성공: ${res.data.length}명의 플레이어`);

          // 유효한 데이터만 필터링
          const validData = res.data.filter(item =>
            item && typeof item === 'object' &&
            (item.nickname || item.battletag || item.mmr)
          );

          if (validData.length > 0) {
            // 최대 30명까지만 표시
            const limitedData = validData.slice(0, MAX_DISPLAY_RANK);
            setLeaderboardData(limitedData);
            setIsUsingAllUsers(true);
            toast.info('전체 유저 목록을 표시합니다 (최대 30명)', { autoClose: 5000 });
            return; // 성공했으므로 함수 종료
          }
        }

        // 여기까지 왔다면 유효한 데이터를 받지 못한 것임
        console.error('전체 유저 데이터도 비어있거나 유효하지 않음:', res?.data);
        setError('데이터를 불러올 수 없습니다. 나중에 다시 시도해주세요.');
        setLeaderboardData([]);
      } catch (err) {
        console.error('전체 유저 데이터 로드 실패:', err);
        setError('서버 연결에 실패했습니다. 인터넷 연결을 확인하고 다시 시도해주세요.');
        setLeaderboardData([]);
      }
    };

    fetchUserData();
  }, [retryCount]);

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
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">히어로즈 랭킹 시스템</h1>
        <div className="flex items-center">
          {isUsingAllUsers && (
            <div className="text-amber-400 text-sm bg-slate-800 px-4 py-2 rounded-full mr-3">
              전체 유저 표시 중 (최대 30위)
            </div>
          )}
          <button
            onClick={refreshLeaderboard}
            disabled={refreshing || loading}
            className={`flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded transition-colors ${(refreshing || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label="새로고침"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-1 ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="text-sm font-medium">새로고침</span>
          </button>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg shadow-lg overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-700">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">순위</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">닉네임</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">티어</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">MMR</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">전적</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">승률</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">포지션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {/* 최대 30개만 표시되도록 보장 */}
              {validLeaderboardData.slice(0, MAX_DISPLAY_RANK).map((player, index) => {
                // 게임 수 계산
                const totalGames = player.totalGames;

                return (
                  <tr
                    key={player.id || index}
                    className={`hover:bg-slate-700 transition-colors 
                      ${index === 0 ? 'bg-slate-700 bg-opacity-50' : ''}
                      ${index < 3 ? 'border-l-4 border-yellow-500' : ''}`}
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className={`
                        inline-flex items-center justify-center w-8 h-8 rounded-full
                        ${index === 0 ? 'bg-yellow-500' :
                    index === 1 ? 'bg-gray-300' :
                      index === 2 ? 'bg-amber-600' : 'bg-slate-600'}
                        text-white font-bold text-sm
                      `}>
                        {player.rank || (index + 1)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="mr-2">
                          {getTierIcon(player.tier)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">{player.nickname}</div>
                          <div className="text-xs text-slate-400">{player.battletag}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className={`mx-auto text-center px-3 py-1 rounded-full text-xs font-medium ${getTierStyles(player.tier)}`}>
                        {player.tier}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <div className="text-sm text-indigo-400 font-bold">{player.mmr}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <div className="text-sm">
                        <span className="text-green-400 font-bold">{player.wins}</span>
                        <span className="text-slate-400 mx-1">-</span>
                        <span className="text-red-400 font-bold">{player.losses}</span>
                        {totalGames > 0 && (
                          <span className="text-xs text-slate-400 ml-1">({totalGames}전)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      {totalGames > 0 ? (
                        <div className="flex items-center justify-center">
                          <div className="h-2 w-16 bg-slate-600 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500"
                              style={{ width: `${Math.min(player.winRate, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm text-white ml-2">{player.winRate}%</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">기록 없음</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <span className={`px-2 py-1 text-xs rounded-full ${getPositionStyles(player.mainRole)}`}>
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

      <div className="bg-slate-800 rounded-lg shadow p-6 text-center text-gray-400 text-sm">
        <h3 className="text-white text-lg font-semibold mb-4">랭킹 시스템 안내</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          <div className="bg-slate-700 p-4 rounded shadow-md">
            <h4 className="font-bold text-white text-base mb-3">티어 시스템</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className={`px-3 py-2 rounded shadow-sm ${getTierStyles('그랜드마스터')}`}>
                <div className="flex items-center">
                  <span className="text-xl mr-2">{getTierIcon('그랜드마스터')}</span>
                  <span className="font-medium">그랜드마스터 (2500+)</span>
                </div>
              </div>
              <div className={`px-3 py-2 rounded shadow-sm ${getTierStyles('마스터')}`}>
                <div className="flex items-center">
                  <span className="text-xl mr-2">{getTierIcon('마스터')}</span>
                  <span className="font-medium">마스터 (2200+)</span>
                </div>
              </div>
              <div className={`px-3 py-2 rounded shadow-sm ${getTierStyles('다이아몬드')}`}>
                <div className="flex items-center">
                  <span className="text-xl mr-2">{getTierIcon('다이아몬드')}</span>
                  <span className="font-medium">다이아몬드 (2000+)</span>
                </div>
              </div>
              <div className={`px-3 py-2 rounded shadow-sm ${getTierStyles('플래티넘')}`}>
                <div className="flex items-center">
                  <span className="text-xl mr-2">{getTierIcon('플래티넘')}</span>
                  <span className="font-medium">플래티넘 (1800+)</span>
                </div>
              </div>
              <div className={`px-3 py-2 rounded shadow-sm ${getTierStyles('골드')}`}>
                <div className="flex items-center">
                  <span className="text-xl mr-2">{getTierIcon('골드')}</span>
                  <span className="font-medium">골드 (1600+)</span>
                </div>
              </div>
              <div className={`px-3 py-2 rounded shadow-sm ${getTierStyles('실버')}`}>
                <div className="flex items-center">
                  <span className="text-xl mr-2">{getTierIcon('실버')}</span>
                  <span className="font-medium">실버 (1400+)</span>
                </div>
              </div>
              <div className={`px-3 py-2 rounded shadow-sm ${getTierStyles('브론즈')}`} style={{gridColumn: '1 / -1'}}>
                <div className="flex items-center justify-center">
                  <span className="text-xl mr-2">{getTierIcon('브론즈')}</span>
                  <span className="font-medium">브론즈 (&lt;1400)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-700 p-4 rounded shadow-md">
            <h4 className="font-bold text-white text-base mb-3">시즌 보상 안내</h4>
            <div className="grid grid-cols-1 gap-2">
              <div className="bg-gradient-to-r from-yellow-500 to-amber-600 p-3 rounded shadow-sm">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">🏆</span>
                  <div>
                    <span className="font-extrabold text-white text-base">1위:</span>
                    <div className="font-medium text-white text-sm mt-1">
                      블리자드 기프트 카드 50,000원 + 리미티드 에디션 히어로즈 오브 더 스톰 피규어
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-slate-200 to-slate-300 p-3 rounded shadow-sm">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">🥈</span>
                  <div>
                    <span className="font-extrabold text-slate-800 text-base">2위:</span>
                    <div className="font-medium text-slate-800 text-sm mt-1">
                      블리자드 기프트 카드 30,000원 + 히어로즈 오브 더 스톰 티셔츠
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-amber-600 to-amber-500 p-3 rounded shadow-sm">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">🥉</span>
                  <div>
                    <span className="font-extrabold text-white text-base">3위:</span>
                    <div className="font-medium text-white text-sm mt-1">
                      블리자드 기프트 카드 10,000원 + 히어로즈 오브 더 스톰 한정판 스티커 세트
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-700 p-3 rounded shadow-sm">
          <p className="mb-2">MMR은 매치 결과에 따라 지속적으로 업데이트됩니다.</p>
          <p className="mb-2">랭킹은 최대 {MAX_DISPLAY_RANK}위까지만 표시됩니다.</p>
          {!isUsingAllUsers && (
            <p>일반 리더보드는 최소 10회 이상의 게임을 진행한 플레이어만 표시됩니다.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;