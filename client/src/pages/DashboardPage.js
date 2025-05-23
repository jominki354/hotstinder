import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { Link } from 'react-router-dom';
import axios from 'axios';

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

  useEffect(() => {
    // 실제 프로젝트에서는 API에서 데이터를 가져옵니다.
    // 여기서는 예시 데이터를 사용합니다.
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // 실제 API 요청 대신 예시 데이터를 사용합니다
        setTimeout(() => {
          const mockData = {
            recentMatches: [
              { id: 1, map: '용의 둥지', result: 'win', date: '2023-09-15', mmrChange: 25, heroes: ['디아블로', '정예 타우렌 족장', '리밍', '말퓨리온', '레이너'] },
              { id: 2, map: '저주받은 골짜기', result: 'loss', date: '2023-09-14', mmrChange: -20, heroes: ['말가니스', '켈투자드', '알렉스트라자', '제이나', '소냐'] },
              { id: 3, map: '공허의 제단', result: 'win', date: '2023-09-13', mmrChange: 22, heroes: ['정예 타우렌 족장', '아르타니스', '말퓨리온', '발라', '한조'] },
              { id: 4, map: '하늘 사원', result: 'win', date: '2023-09-12', mmrChange: 25, heroes: ['레오릭', '그레이메인', '안두인', '캘타스', '요한나'] },
              { id: 5, map: '지옥의 신단', result: 'loss', date: '2023-09-11', mmrChange: -18, heroes: ['메이', '레이너', '데커드', '레가르', '폴스타드'] }
            ],
            mmrHistory: [
              { date: '2023-09-11', mmr: 2100 },
              { date: '2023-09-12', mmr: 2125 },
              { date: '2023-09-13', mmr: 2147 },
              { date: '2023-09-14', mmr: 2127 },
              { date: '2023-09-15', mmr: 2152 }
            ],
            kda: { kills: 68, deaths: 42, assists: 113 },
            winRate: 60,
            totalGames: 150,
            favoriteHeroes: [
              { name: '디아블로', games: 25, winRate: 64, iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/diablo/icon.png' },
              { name: '정예 타우렌 족장', games: 18, winRate: 72, iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/etc/icon.png' },
              { name: '말퓨리온', games: 16, winRate: 56, iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/malfurion/icon.png' }
            ]
          };
          setStats(mockData);
          setIsLoading(false);
        }, 500);
      } catch (error) {
        console.error('통계 데이터 로딩 중 오류 발생:', error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // 배틀태그 가져오기
  const getBattleTag = () => {
    if (!user) return '';
    return user.battletag || user.battleTag || '';
  };

  // KDA 비율 계산
  const calculateKDARatio = () => {
    const { kills, deaths, assists } = stats.kda;
    if (deaths === 0) return (kills + assists).toFixed(2);
    return ((kills + assists) / deaths).toFixed(2);
  };

  // 티어 정보
  const getTierInfo = () => {
    const currentMMR = stats.mmrHistory.length > 0 ? stats.mmrHistory[stats.mmrHistory.length - 1].mmr : 0;
    
    // MMR 기반 티어 결정 로직
    if (currentMMR >= 2500) return { name: '그랜드마스터', color: 'text-red-400', bgColor: 'bg-gradient-to-r from-red-500/20 to-red-700/20', icon: '👑' };
    if (currentMMR >= 2200) return { name: '마스터', color: 'text-purple-400', bgColor: 'bg-gradient-to-r from-purple-500/20 to-purple-700/20', icon: '⭐' };
    if (currentMMR >= 2000) return { name: '다이아몬드', color: 'text-blue-400', bgColor: 'bg-gradient-to-r from-blue-500/20 to-blue-700/20', icon: '💎' };
    if (currentMMR >= 1800) return { name: '플래티넘', color: 'text-teal-400', bgColor: 'bg-gradient-to-r from-teal-500/20 to-teal-700/20', icon: '🥇' };
    if (currentMMR >= 1600) return { name: '골드', color: 'text-yellow-400', bgColor: 'bg-gradient-to-r from-yellow-500/20 to-yellow-700/20', icon: '🏆' };
    if (currentMMR >= 1400) return { name: '실버', color: 'text-gray-400', bgColor: 'bg-gradient-to-r from-gray-500/20 to-gray-700/20', icon: '🥈' };
    if (currentMMR >= 1200) return { name: '브론즈', color: 'text-yellow-800', bgColor: 'bg-gradient-to-r from-yellow-800/20 to-yellow-950/20', icon: '🥉' };
    return { name: '배치', color: 'text-gray-400', bgColor: 'bg-gradient-to-r from-gray-500/20 to-gray-700/20', icon: '❓' };
  };

  const tier = getTierInfo();
  const currentMMR = stats.mmrHistory.length > 0 ? stats.mmrHistory[stats.mmrHistory.length - 1].mmr : 0;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-indigo-400 text-xl">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4">
      <h1 className="text-3xl font-bold text-indigo-400 mb-8">대시보드</h1>
      
      {/* 프로필 카드 */}
      <div className={`rounded-xl p-6 mb-8 border border-indigo-900/50 ${tier.bgColor}`}>
        <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6">
          {/* 아바타/티어 영역 */}
          <div className="relative">
            {user.avatar ? (
              <img src={user.avatar} alt="프로필 사진" className="w-24 h-24 rounded-full border-2 border-indigo-500/50" />
            ) : (
              <div className="w-24 h-24 bg-indigo-900/30 rounded-full flex items-center justify-center border-2 border-indigo-500/50">
                <span className="text-indigo-400 font-bold text-3xl">{getBattleTag().charAt(0) || '?'}</span>
              </div>
            )}
            <div className="absolute -bottom-2 -right-2 bg-slate-800 rounded-full p-1 border border-indigo-500/50">
              <span className="text-2xl" title={tier.name}>{tier.icon}</span>
            </div>
          </div>
          
          {/* 유저 정보 */}
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-bold text-white">{getBattleTag() || '배틀태그 없음'}</h2>
            <div className="flex flex-col sm:flex-row items-center md:items-start gap-2 sm:gap-4 mt-2">
              <p className={`${tier.color} font-semibold`}>{tier.name} ({currentMMR} MMR)</p>
              <p className="text-gray-400">가입일: {new Date(user.createdAt).toLocaleDateString('ko-KR')}</p>
            </div>
            
            {/* 요약 통계 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-center">
              <div className="bg-slate-800/50 rounded-lg p-3 border border-indigo-900/50">
                <div className="text-2xl font-bold text-white">{stats.totalGames}</div>
                <div className="text-gray-400 text-sm">총 경기</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 border border-indigo-900/50">
                <div className="text-2xl font-bold text-green-400">{stats.winRate}%</div>
                <div className="text-gray-400 text-sm">승률</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 border border-indigo-900/50">
                <div className="text-2xl font-bold text-yellow-400">{calculateKDARatio()}</div>
                <div className="text-gray-400 text-sm">KDA</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 border border-indigo-900/50">
                <div className="text-2xl font-bold text-indigo-400">{user.preferredRoles?.length || 0}</div>
                <div className="text-gray-400 text-sm">선호 역할</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 통계 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 최근 경기 */}
        <div className="lg:col-span-2 bg-slate-800/30 rounded-xl p-6 border border-indigo-900/50">
          <h2 className="text-xl font-semibold mb-4 text-indigo-400 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            최근 경기
          </h2>
          
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-slate-700/50 rounded"></div>
              ))}
            </div>
          ) : stats.recentMatches.length > 0 ? (
            <div className="space-y-3">
              {stats.recentMatches.map(match => (
                <div key={match.id} className={`${match.result === 'win' ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-red-500'} bg-slate-700/30 rounded-r-lg p-3 flex flex-col sm:flex-row justify-between`}>
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className={`font-semibold ${match.result === 'win' ? 'text-green-400' : 'text-red-400'}`}>
                        {match.result === 'win' ? '승리' : '패배'}
                      </span>
                      <span className="mx-2 text-gray-500">•</span>
                      <span className="text-gray-300">{match.map}</span>
                      <span className="mx-2 text-gray-500">•</span>
                      <span className="text-gray-400 text-sm">{match.date}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {match.heroes.map((hero, i) => (
                        <span key={i} className="inline-block bg-slate-700 text-gray-300 rounded px-2 py-1 text-xs">
                          {hero}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className={`text-lg font-bold mt-2 sm:mt-0 sm:ml-4 ${match.mmrChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {match.mmrChange > 0 ? '+' : ''}{match.mmrChange}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400 italic">아직 경기 데이터가 없습니다</p>
            </div>
          )}
          
          <Link to="/recent-games" className="mt-4 inline-block bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition">
            모든 경기 보기
          </Link>
        </div>

        {/* KDA 및 영웅 통계 */}
        <div className="space-y-6">
          {/* KDA 통계 */}
          <div className="bg-slate-800/30 rounded-xl p-6 border border-indigo-900/50">
            <h2 className="text-xl font-semibold mb-4 text-indigo-400 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              KDA 통계
            </h2>
            
            {isLoading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-8 bg-slate-700/50 rounded w-full"></div>
                <div className="h-8 bg-slate-700/50 rounded w-3/4"></div>
                <div className="h-8 bg-slate-700/50 rounded w-1/2"></div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-green-400">처치</span>
                  <div className="flex items-center">
                    <span className="text-white font-semibold">{stats.kda.kills}</span>
                    <span className="text-gray-400 text-xs ml-1">({(stats.kda.kills / stats.totalGames).toFixed(1)}/게임)</span>
                  </div>
                </div>
                <div className="w-full bg-slate-700/30 rounded-full h-2.5">
                  <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${(stats.kda.kills / (stats.kda.kills + stats.kda.deaths + stats.kda.assists)) * 100}%` }}></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-red-400">사망</span>
                  <div className="flex items-center">
                    <span className="text-white font-semibold">{stats.kda.deaths}</span>
                    <span className="text-gray-400 text-xs ml-1">({(stats.kda.deaths / stats.totalGames).toFixed(1)}/게임)</span>
                  </div>
                </div>
                <div className="w-full bg-slate-700/30 rounded-full h-2.5">
                  <div className="bg-red-500 h-2.5 rounded-full" style={{ width: `${(stats.kda.deaths / (stats.kda.kills + stats.kda.deaths + stats.kda.assists)) * 100}%` }}></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-blue-400">도움</span>
                  <div className="flex items-center">
                    <span className="text-white font-semibold">{stats.kda.assists}</span>
                    <span className="text-gray-400 text-xs ml-1">({(stats.kda.assists / stats.totalGames).toFixed(1)}/게임)</span>
                  </div>
                </div>
                <div className="w-full bg-slate-700/30 rounded-full h-2.5">
                  <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${(stats.kda.assists / (stats.kda.kills + stats.kda.deaths + stats.kda.assists)) * 100}%` }}></div>
                </div>
                
                <div className="mt-4 text-center">
                  <div className="text-xl font-bold text-yellow-400">{calculateKDARatio()}</div>
                  <div className="text-gray-400 text-sm">KDA 비율</div>
                </div>
              </div>
            )}
          </div>
          
          {/* 선호 영웅 */}
          <div className="bg-slate-800/30 rounded-xl p-6 border border-indigo-900/50">
            <h2 className="text-xl font-semibold mb-4 text-indigo-400 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              선호 영웅
            </h2>
            
            {isLoading ? (
              <div className="animate-pulse space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-slate-700/50 rounded"></div>
                ))}
              </div>
            ) : stats.favoriteHeroes.length > 0 ? (
              <div className="space-y-3">
                {stats.favoriteHeroes.map(hero => (
                  <div key={hero.name} className="bg-slate-700/30 rounded-lg p-3 flex items-center">
                    <img 
                      src={hero.iconUrl} 
                      alt={hero.name} 
                      className="w-12 h-12 rounded-full" 
                    />
                    <div className="ml-3 flex-1">
                      <div className="font-semibold text-white">{hero.name}</div>
                      <div className="text-gray-400 text-sm">{hero.games}게임</div>
                    </div>
                    <div className="text-green-400 font-bold">{hero.winRate}%</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-400 italic">아직 영웅 데이터가 없습니다</p>
              </div>
            )}
          </div>
          
          {/* 빠른 링크 */}
          <div className="bg-slate-800/30 rounded-xl p-6 border border-indigo-900/50">
            <h2 className="text-xl font-semibold mb-4 text-indigo-400">빠른 링크</h2>
            <div className="grid grid-cols-1 gap-3">
              <Link to="/matchmaking" className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg text-center transition flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
                매치메이킹
              </Link>
              <Link to="/leaderboard" className="bg-slate-700 hover:bg-slate-600 text-white py-2 px-4 rounded-lg text-center transition flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M12.293 7.707a1 1 0 011.414 0l2 2a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l2-2a1 1 0 011.414 0l1.293 1.293L12.293 7.707z" clipRule="evenodd" />
                </svg>
                리더보드
              </Link>
              <Link to="/profile" className="bg-slate-700 hover:bg-slate-600 text-white py-2 px-4 rounded-lg text-center transition flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                프로필 관리
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage; 