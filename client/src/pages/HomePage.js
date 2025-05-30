import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { fetchLeaderboard } from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

const HomePage = () => {
  const { isAuthenticated, user } = useAuthStore();
  const [topPlayers, setTopPlayers] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPlayers: 0,
    activeMatches: 0,
    totalMatches: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLeaderboardLoading(true);
        const response = await fetchLeaderboard({ limit: 3 });
        setTopPlayers(response.data);

        // 임시 통계 데이터 (실제로는 API에서 가져와야 함)
        setStats({
          totalPlayers: 1247,
          activeMatches: 23,
          totalMatches: 8934
        });
      } catch (err) {
        console.error('데이터 가져오기 오류:', err);
        setTopPlayers([]);
      } finally {
        setLeaderboardLoading(false);
      }
    };

    fetchData();
  }, []);

  // 메인페이지에서만 스크롤바 숨기기
  useEffect(() => {
    // 스타일 태그 추가 (스크롤바만 숨기고 스크롤은 가능하게)
    const style = document.createElement('style');
    style.textContent = `
      body::-webkit-scrollbar {
        display: none !important;
        width: 0 !important;
        height: 0 !important;
      }
      .homepage-container::-webkit-scrollbar {
        display: none !important;
        width: 0 !important;
        height: 0 !important;
      }
    `;
    document.head.appendChild(style);

    // 페이지 진입 시 body 스크롤바 숨기기 (스크롤은 유지)
    const originalScrollbarWidth = document.body.style.scrollbarWidth;
    const originalMsOverflowStyle = document.body.style.msOverflowStyle;

    document.body.style.scrollbarWidth = 'none';
    document.body.style.msOverflowStyle = 'none';

    // 컴포넌트 언마운트 시 원래 스타일 복원
    return () => {
      document.body.style.scrollbarWidth = originalScrollbarWidth;
      document.body.style.msOverflowStyle = originalMsOverflowStyle;
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div
      className="homepage-container relative min-h-screen scroll-smooth"
      style={{
        msOverflowStyle: 'none',
        scrollbarWidth: 'none'
      }}
    >
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-6xl mx-auto text-center">
            {/* 메인 로고/타이틀 */}
            <div className="mb-8">
              <h1 className="text-6xl md:text-8xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4 tracking-tight">
                HotsTinder
              </h1>
              <div className="w-32 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto mb-6 rounded-full"></div>
            </div>

            {/* 통계 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
              <div className="bg-slate-800/50 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-6 hover:border-blue-400/50 transition-all duration-300 group">
                <div className="text-3xl font-bold text-blue-400 mb-2 group-hover:scale-110 transition-transform">
                  {stats.totalPlayers.toLocaleString()}
                </div>
                <div className="text-gray-300 font-medium">등록된 플레이어</div>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6 hover:border-purple-400/50 transition-all duration-300 group">
                <div className="text-3xl font-bold text-purple-400 mb-2 group-hover:scale-110 transition-transform">
                  {stats.activeMatches}
                </div>
                <div className="text-gray-300 font-medium">진행중인 매치</div>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm border border-pink-500/30 rounded-2xl p-6 hover:border-pink-400/50 transition-all duration-300 group">
                <div className="text-3xl font-bold text-pink-400 mb-2 group-hover:scale-110 transition-transform">
                  {stats.totalMatches.toLocaleString()}
                </div>
                <div className="text-gray-300 font-medium">완료된 경기</div>
              </div>
            </div>

            {/* CTA 버튼 */}
            <div className="space-y-4 md:space-y-0 md:space-x-6 md:flex md:justify-center">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/matchmaking"
                    className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-4 px-8 rounded-2xl text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25"
                  >
                    <span className="flex items-center justify-center">
                      <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      매치 찾기
                    </span>
                  </Link>
                  <Link
                    to="/dashboard"
                    className="inline-block bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600 hover:border-slate-500 text-white font-bold py-4 px-8 rounded-2xl text-lg transition-all duration-300 transform hover:scale-105"
                  >
                    <span className="flex items-center justify-center">
                      <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      대시보드
                    </span>
                  </Link>
                </>
              ) : (
                <Link
                  to="/login"
                  className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-4 px-12 rounded-2xl text-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25"
                >
                  <span className="flex items-center justify-center">
                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    지금 시작하기
                  </span>
                </Link>
              )}
            </div>

            {/* 스크롤 다운 인디케이터 */}
            {topPlayers.length > 0 && (
              <div className="mt-16 flex justify-center">
                <div className="animate-bounce">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Top Players Section */}
        {topPlayers.length > 0 && (
          <section className="min-h-screen flex items-center justify-center px-4">
            <div className="max-w-4xl mx-auto w-full flex flex-col justify-center">
              <div className="text-center mb-8">
                <h2 className="text-4xl font-bold text-white mb-4">
                  🏆 <span className="text-yellow-400">최고의 플레이어들</span>
                </h2>
                <p className="text-xl text-gray-300">
                  HotsTinder에서 활약하는 상위 랭커들을 만나보세요
                </p>
              </div>

              <div className="space-y-4 mb-8">
                {topPlayers.map((player, index) => (
                  <div
                    key={player.id}
                    className={`bg-slate-800/50 backdrop-blur-sm border rounded-2xl p-6 hover:border-yellow-500/50 transition-all duration-300 ${
                      index === 0 ? 'border-yellow-500/30 bg-gradient-to-r from-yellow-900/20 to-slate-800/50' :
                      index === 1 ? 'border-gray-400/30' :
                      'border-orange-600/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${
                          index === 0 ? 'bg-yellow-500 text-black' :
                          index === 1 ? 'bg-gray-400 text-black' :
                          'bg-orange-600 text-white'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="text-xl font-bold text-white">
                            {player.battleTag || player.nickname}
                          </div>
                          <div className="text-gray-400">
                            {player.wins || 0}승 {player.losses || 0}패
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-400">
                          {player.mmr || 1500}
                        </div>
                        <div className="text-gray-400 text-sm">MMR</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <Link
                  to="/leaderboard"
                  className="inline-block bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600 hover:border-yellow-500/50 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300"
                >
                  전체 리더보드 보기
                </Link>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default HomePage;
