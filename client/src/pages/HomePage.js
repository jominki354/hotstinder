import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { fetchLeaderboard } from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

const HomePage = () => {
  const { isAuthenticated } = useAuthStore();
  const [topPlayers, setTopPlayers] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);

  useEffect(() => {
    const fetchTopPlayers = async () => {
      try {
        setLeaderboardLoading(true);
        const response = await fetchLeaderboard({ limit: 5 });
        setTopPlayers(response.data);
      } catch (err) {
        console.error('상위 플레이어 데이터 가져오기 오류:', err);
        setTopPlayers([]); // 오류 시 빈 배열로 설정
      } finally {
        setLeaderboardLoading(false);
      }
    };

    fetchTopPlayers();
  }, []);

  // 순위표 섹션 렌더링
  const renderLeaderboard = () => {
    if (leaderboardLoading) {
      return (
        <div className="py-10 flex justify-center">
          <LoadingSpinner size="md" />
        </div>
      );
    }

    if (topPlayers.length === 0) {
      return (
        <div className="py-8 text-center">
          <p className="text-gray-400">아직 리더보드 데이터가 없습니다.</p>
          <p className="text-gray-500 text-sm mt-2">충분한 게임이 진행된 후에 순위표가 업데이트됩니다.</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-700">
          <thead className="bg-indigo-900/30">
            <tr>
              <th scope="col" className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-indigo-300 uppercase tracking-wider">
                순위
              </th>
              <th scope="col" className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-indigo-300 uppercase tracking-wider">
                플레이어
              </th>
              <th scope="col" className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-indigo-300 uppercase tracking-wider">
                MMR
              </th>
              <th scope="col" className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-indigo-300 uppercase tracking-wider">
                승률
              </th>
              <th scope="col" className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-indigo-300 uppercase tracking-wider">
                게임수
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {topPlayers.map((player, index) => (
              <tr key={player.id} className={index % 2 === 0 ? 'bg-indigo-500/10' : ''}>
                <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-400">{player.rank}</td>
                <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-sm text-white">{player.nickname}</td>
                <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-sm text-white">{player.mmr}</td>
                <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-sm text-green-400">{player.winRate}%</td>
                <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-sm text-white">{player.wins + player.losses}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="page-container">
      {/* 히어로 섹션 */}
      <div className="text-center mb-8 sm:mb-16">
        <h1 className="text-3xl sm:text-5xl font-bold text-white mb-4 sm:mb-6 page-title">
          <span className="text-indigo-400">HOTS</span><span className="text-white">Tinder</span>
        </h1>
        <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto mb-6 sm:mb-8 px-4">
          히어로즈 오브 더 스톰을 함께 즐길 파트너를 찾아보세요.
          간편하게 시작하고 게임의 재미를 극대화하세요!
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4">
          {isAuthenticated ? (
            <>
              <Link
                to="/matchmaking"
                className="battlenet-button w-full sm:w-auto"
              >
                매치 찾기
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="battlenet-button w-full sm:w-auto"
              >
                게임 검색
              </Link>
            </>
          )}
        </div>
      </div>

      {/* 기능 섹션 */}
      <div id="features" className="max-w-6xl mx-auto mb-12 sm:mb-20 px-3 sm:px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
          <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-indigo-600 rounded-full flex items-center justify-center mb-4 sm:mb-6">
              <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">진행중인 게임</h3>
            <p className="text-gray-300 mb-4">
              현재 12개의 게임이 진행 중입니다. 참여 가능한 게임이 5개 있으니 지금 바로 참여해보세요.
            </p>
            <div className="bg-indigo-900/30 rounded-lg p-3">
              <div className="text-indigo-300 text-center font-bold text-xl">12</div>
              <div className="text-center text-sm text-gray-300">현재 진행중</div>
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-indigo-600 rounded-full flex items-center justify-center mb-4 sm:mb-6">
              <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">이미 끝난 게임</h3>
            <p className="text-gray-300 mb-4">
              지난 24시간 동안 완료된 게임 수는 86개입니다. 게임 결과 및 통계를 확인해보세요.
            </p>
            <div className="bg-indigo-900/30 rounded-lg p-3">
              <div className="text-indigo-300 text-center font-bold text-xl">86</div>
              <div className="text-center text-sm text-gray-300">지난 24시간</div>
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-lg shadow-lg sm:col-span-2 md:col-span-1">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-indigo-600 rounded-full flex items-center justify-center mb-4 sm:mb-6">
              <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">접속중인 유저</h3>
            <p className="text-gray-300 mb-4">
              현재 48명의 유저가 접속중입니다. 친구나 새로운 플레이어들과 함께 게임을 즐겨보세요.
            </p>
            <div className="bg-indigo-900/30 rounded-lg p-3">
              <div className="text-indigo-300 text-center font-bold text-xl">48</div>
              <div className="text-center text-sm text-gray-300">현재 접속중</div>
            </div>
          </div>
        </div>
      </div>

      {/* 순위표 섹션 */}
      <div className="max-w-5xl mx-auto mb-12 sm:mb-20 px-3 sm:px-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-8 sm:mb-12">순위표</h2>
        <div className="bg-slate-800 p-6 rounded-lg shadow-lg overflow-hidden">
          {renderLeaderboard()}
          <div className="flex justify-center mt-4">
            <Link to="/leaderboard" className="text-indigo-400 hover:text-indigo-300 font-medium">
              전체 순위 보기 →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
