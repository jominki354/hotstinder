import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

// Axios 기본 설정
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const DashboardPage = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    recentMatches: [],
    mmrHistory: [],
    kda: { kills: 0, deaths: 0, assists: 0 },
    winRate: 0,
    totalGames: 0,
    favoriteHeroes: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        setError('');

        const token = localStorage.getItem('token');
        if (!token) {
          setError('인증 토큰이 없습니다.');
          return;
        }

        const timestamp = new Date().getTime();
        const response = await axios.get(`/api/auth/dashboard?t=${timestamp}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });

        if (response.data.success && response.data.data) {
          const { stats: apiStats } = response.data.data;

          const formattedStats = {
            recentMatches: apiStats.recentMatches.map(match => ({
              id: match.id,
              matchId: match.matchId,
              map: match.map,
              result: match.result,
              date: match.date,
              mmrChange: match.mmrChange,
              heroes: [match.hero],
              hero: match.hero,
              kills: match.kills,
              deaths: match.deaths,
              assists: match.assists,
              heroDamage: match.heroDamage,
              siegeDamage: match.siegeDamage,
              healing: match.healing
            })),
            mmrHistory: apiStats.mmrHistory || [],
            kda: apiStats.kda || { kills: 0, deaths: 0, assists: 0 },
            winRate: apiStats.winRate || 0,
            totalGames: apiStats.totalGames || 0,
            favoriteHeroes: apiStats.favoriteHeroes.map(hero => ({
              name: hero.name,
              games: hero.games,
              winRate: hero.winRate,
              iconUrl: `https://heroesofthestorm.blizzard.com/static/images/heroes/${hero.name.toLowerCase().replace(/\s+/g, '-')}/icon.png`
            })) || []
          };

          setStats(formattedStats);
        } else {
          setError('대시보드 데이터 형식이 올바르지 않습니다.');
        }

      } catch (err) {
        const errorMessage = err.response?.data?.message ||
                           err.response?.data?.error ||
                           '대시보드 데이터를 불러오는 중 오류가 발생했습니다.';

        setError(errorMessage);
        toast.error(errorMessage);

        if (err.response?.status === 401) {
          console.warn('🔐 인증 오류 - 로그인 필요');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const getBattleTag = () => {
    if (!user) return '';
    return user.battletag || user.battleTag || '';
  };

  const calculateKDARatio = () => {
    const { kills, deaths, assists } = stats.kda;
    if (deaths === 0) return (kills + assists).toFixed(2);
    return ((kills + assists) / deaths).toFixed(2);
  };

  const getTierInfo = () => {
    const currentMMR = stats.mmrHistory.length > 0 ?
      stats.mmrHistory[stats.mmrHistory.length - 1].mmr :
      (user?.mmr || 1500);

    if (currentMMR >= 2500) return { name: '그랜드마스터', color: 'text-red-400', bgColor: 'bg-gradient-to-r from-red-500/20 to-red-700/20', icon: '👑', borderColor: 'border-red-500/30' };
    if (currentMMR >= 2200) return { name: '마스터', color: 'text-purple-400', bgColor: 'bg-gradient-to-r from-purple-500/20 to-purple-700/20', icon: '⭐', borderColor: 'border-purple-500/30' };
    if (currentMMR >= 2000) return { name: '다이아몬드', color: 'text-blue-400', bgColor: 'bg-gradient-to-r from-blue-500/20 to-blue-700/20', icon: '💎', borderColor: 'border-blue-500/30' };
    if (currentMMR >= 1800) return { name: '플래티넘', color: 'text-teal-400', bgColor: 'bg-gradient-to-r from-teal-500/20 to-teal-700/20', icon: '🥇', borderColor: 'border-teal-500/30' };
    if (currentMMR >= 1600) return { name: '골드', color: 'text-yellow-400', bgColor: 'bg-gradient-to-r from-yellow-500/20 to-yellow-700/20', icon: '🏆', borderColor: 'border-yellow-500/30' };
    if (currentMMR >= 1400) return { name: '실버', color: 'text-gray-400', bgColor: 'bg-gradient-to-r from-gray-500/20 to-gray-700/20', icon: '🥈', borderColor: 'border-gray-500/30' };
    if (currentMMR >= 1200) return { name: '브론즈', color: 'text-yellow-800', bgColor: 'bg-gradient-to-r from-yellow-800/20 to-yellow-950/20', icon: '🥉', borderColor: 'border-yellow-800/30' };
    return { name: '배치', color: 'text-gray-400', bgColor: 'bg-gradient-to-r from-gray-500/20 to-gray-700/20', icon: '❓', borderColor: 'border-gray-500/30' };
  };

  const tier = getTierInfo();
  const currentMMR = stats.mmrHistory.length > 0 ?
    stats.mmrHistory[stats.mmrHistory.length - 1].mmr :
    (user?.mmr || 1500);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="animate-pulse text-blue-400 text-xl">로딩 중...</div>
      </div>
    );
  }

  if (error && !isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 p-4">
        <div className="max-w-6xl mx-auto pt-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-8">대시보드</h1>
          <div className="bg-red-900/50 backdrop-blur-sm border border-red-500/30 text-red-300 px-6 py-4 rounded-2xl">
            <h3 className="font-bold text-lg mb-2">데이터 로딩 오류</h3>
            <p>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl transition"
            >
              새로고침
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="relative z-10 p-4">
        <div className="max-w-7xl mx-auto">
          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
              대시보드
            </h1>
            <p className="text-gray-400 text-lg">플레이어 통계 및 성과 분석</p>
          </div>

          {/* 프로필 설정 권장 배너 */}
          {!user.isProfileComplete && (
            <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 backdrop-blur-sm border border-blue-500/30 text-white px-6 py-4 rounded-2xl mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">프로필 설정을 완료해보세요!</h3>
                    <p className="text-blue-200">선호하는 역할과 이전 시즌 티어를 설정하면 더 공정한 매치메이킹에 도움이 됩니다.</p>
                  </div>
                </div>
                <Link
                  to="/profile/setup"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-xl transition-all duration-300 transform hover:scale-105"
                >
                  설정하기
                </Link>
              </div>
            </div>
          )}

          {/* 플레이어 프로필 카드 */}
          <div className={`${tier.bgColor} backdrop-blur-sm border ${tier.borderColor} rounded-3xl p-8 mb-8 relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-2xl"></div>

            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
                {/* 아바타 및 기본 정보 */}
                <div className="flex flex-col items-center lg:items-start">
                  <div className="relative mb-4">
                    <div className="w-32 h-32 bg-slate-800/50 rounded-3xl flex items-center justify-center border-2 border-slate-600/50 backdrop-blur-sm">
                      <span className="text-4xl font-bold text-white">{getBattleTag().charAt(0) || '?'}</span>
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-slate-800/80 backdrop-blur-sm rounded-2xl p-2 border border-slate-600/50">
                      <span className="text-3xl" title={tier.name}>{tier.icon}</span>
                    </div>
                  </div>

                  <div className="text-center lg:text-left">
                    <h2 className="text-3xl font-bold text-white mb-2">{getBattleTag() || '배틀태그 없음'}</h2>
                    <div className="flex flex-col lg:flex-row items-center gap-4 mb-4">
                      <div className={`${tier.color} font-bold text-xl flex items-center gap-2`}>
                        <span>{tier.icon}</span>
                        <span>{tier.name}</span>
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {currentMMR} <span className="text-gray-400 text-sm font-normal">MMR</span>
                      </div>
                    </div>
                    <p className="text-gray-400">가입일: {new Date(user.createdAt).toLocaleDateString('ko-KR')}</p>
                  </div>
                </div>

                {/* 통계 그리드 */}
                <div className="flex-1 w-full">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-600/30 rounded-2xl p-4 text-center hover:border-blue-500/50 transition-all duration-300">
                      <div className="text-3xl font-bold text-blue-400 mb-1">
                        {isLoading ? '...' : stats.totalGames}
                      </div>
                      <div className="text-gray-300 text-sm font-medium">총 경기</div>
                    </div>

                    <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-600/30 rounded-2xl p-4 text-center hover:border-green-500/50 transition-all duration-300">
                      <div className="text-3xl font-bold text-green-400 mb-1">
                        {isLoading ? '...' : stats.winRate}%
                      </div>
                      <div className="text-gray-300 text-sm font-medium">승률</div>
                    </div>

                    <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-600/30 rounded-2xl p-4 text-center hover:border-yellow-500/50 transition-all duration-300">
                      <div className="text-3xl font-bold text-yellow-400 mb-1">
                        {isLoading ? '...' : calculateKDARatio()}
                      </div>
                      <div className="text-gray-300 text-sm font-medium">KDA</div>
                    </div>

                    <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-600/30 rounded-2xl p-4 text-center hover:border-purple-500/50 transition-all duration-300">
                      <div className="text-3xl font-bold text-purple-400 mb-1">
                        {user.preferredRoles?.length || 0}
                      </div>
                      <div className="text-gray-300 text-sm font-medium">선호 역할</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 메인 콘텐츠 그리드 */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* 최근 경기 (2/3 너비) */}
            <div className="xl:col-span-2">
              <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-600/30 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    최근 경기
                  </h2>
                  <Link
                    to="/recent-games"
                    className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                  >
                    전체 보기 →
                  </Link>
                </div>

                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse bg-slate-700/30 rounded-2xl h-20"></div>
                    ))}
                  </div>
                ) : stats.recentMatches.length > 0 ? (
                  <div className="space-y-3">
                    {stats.recentMatches.map(match => (
                      <div
                        key={match.id}
                        className={`bg-slate-700/20 backdrop-blur-sm border-l-4 rounded-2xl p-4 hover:bg-slate-700/30 transition-all duration-300 ${
                          match.result === 'win' ? 'border-l-green-500' : 'border-l-red-500'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm ${
                              match.result === 'win' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                            }`}>
                              {match.result === 'win' ? 'W' : 'L'}
                            </div>

                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-white font-medium">{match.map}</span>
                                <span className="text-gray-500">•</span>
                                <span className="text-gray-400 text-sm">{match.date}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="bg-slate-600/50 text-gray-300 rounded-lg px-2 py-1 text-xs font-medium">
                                  {match.hero}
                                </span>
                                <span className="text-gray-400 text-sm">
                                  {match.kills}/{match.deaths}/{match.assists}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className={`text-lg font-bold ${
                              match.mmrChange > 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {match.mmrChange > 0 ? '+' : ''}{match.mmrChange}
                            </div>
                            <div className="text-gray-400 text-xs">MMR</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-700/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <p className="text-gray-400 text-lg font-medium mb-2">아직 경기 데이터가 없습니다</p>
                    <p className="text-gray-500 mb-6">매치메이킹에 참여해서 첫 경기를 시작해보세요!</p>
                    <Link
                      to="/matchmaking"
                      className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105"
                    >
                      매치 찾기
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* 사이드바 (1/3 너비) */}
            <div className="space-y-8">
              {/* KDA 통계 */}
              <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-600/30 rounded-3xl p-6">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  KDA 통계
                </h2>

                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse bg-slate-700/30 rounded-xl h-16"></div>
                    ))}
                  </div>
                ) : stats.totalGames > 0 ? (
                  <div className="space-y-4">
                    <div className="bg-slate-700/20 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-green-400 font-medium">처치</span>
                        <div className="text-right">
                          <span className="text-white font-bold text-lg">{stats.kda.kills}</span>
                          <span className="text-gray-400 text-sm ml-1">({(stats.kda.kills / stats.totalGames).toFixed(1)}/게임)</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-600/30 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${(stats.kda.kills / (stats.kda.kills + stats.kda.deaths + stats.kda.assists)) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="bg-slate-700/20 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-red-400 font-medium">사망</span>
                        <div className="text-right">
                          <span className="text-white font-bold text-lg">{stats.kda.deaths}</span>
                          <span className="text-gray-400 text-sm ml-1">({(stats.kda.deaths / stats.totalGames).toFixed(1)}/게임)</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-600/30 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${(stats.kda.deaths / (stats.kda.kills + stats.kda.deaths + stats.kda.assists)) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="bg-slate-700/20 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-blue-400 font-medium">도움</span>
                        <div className="text-right">
                          <span className="text-white font-bold text-lg">{stats.kda.assists}</span>
                          <span className="text-gray-400 text-sm ml-1">({(stats.kda.assists / stats.totalGames).toFixed(1)}/게임)</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-600/30 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${(stats.kda.assists / (stats.kda.kills + stats.kda.deaths + stats.kda.assists)) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-yellow-900/20 to-yellow-800/20 border border-yellow-500/30 rounded-2xl p-4 text-center">
                      <div className="text-3xl font-bold text-yellow-400 mb-1">{calculateKDARatio()}</div>
                      <div className="text-yellow-300 text-sm font-medium">평균 KDA</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-slate-700/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <p className="text-gray-400">아직 KDA 데이터가 없습니다</p>
                  </div>
                )}
              </div>

              {/* 선호 영웅 */}
              <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-600/30 rounded-3xl p-6">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                  <div className="w-8 h-8 bg-pink-500/20 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  자주 플레이한 영웅
                </h2>

                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse bg-slate-700/30 rounded-2xl h-16"></div>
                    ))}
                  </div>
                ) : stats.favoriteHeroes.length > 0 ? (
                  <div className="space-y-3">
                    {stats.favoriteHeroes.map((hero, index) => (
                      <div key={hero.name} className="bg-slate-700/20 backdrop-blur-sm rounded-2xl p-4 hover:bg-slate-700/30 transition-all duration-300">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                              index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                              index === 1 ? 'bg-gray-400/20 text-gray-400' :
                              'bg-orange-600/20 text-orange-400'
                            }`}>
                              {hero.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-white">{hero.name}</div>
                              <div className="text-gray-400 text-sm">{hero.games}게임</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-green-400 font-bold text-lg">{hero.winRate}%</div>
                            <div className="text-gray-400 text-xs">승률</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-slate-700/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </div>
                    <p className="text-gray-400 mb-2">아직 영웅 데이터가 없습니다</p>
                    <p className="text-gray-500 text-sm">게임을 플레이하면 통계가 표시됩니다</p>
                  </div>
                )}
              </div>

              {/* 빠른 액션 */}
              <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-600/30 rounded-3xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">빠른 액션</h2>
                <div className="space-y-3">
                  <Link
                    to="/matchmaking"
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    매치메이킹
                  </Link>

                  <Link
                    to="/leaderboard"
                    className="w-full bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600 hover:border-yellow-500/50 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    리더보드
                  </Link>

                  <Link
                    to="/profile"
                    className="w-full bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600 hover:border-slate-500 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    프로필 관리
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
