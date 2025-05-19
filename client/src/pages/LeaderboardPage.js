import React, { useState, useEffect } from 'react';

const LeaderboardPage = () => {
  // 임시 더미 데이터
  const [leaderboardData, setLeaderboardData] = useState([
    { rank: 1, nickname: '히오스고수', mmr: 2850, wins: 45, losses: 12, winRate: 78.9, mainRole: '원거리 암살자' },
    { rank: 2, nickname: '앵그리호츠맨', mmr: 2720, wins: 38, losses: 15, winRate: 71.7, mainRole: '투사' },
    { rank: 3, nickname: '메디브장인', mmr: 2610, wins: 42, losses: 20, winRate: 67.7, mainRole: '전문가' },
    { rank: 4, nickname: '전부못함', mmr: 2580, wins: 36, losses: 18, winRate: 66.7, mainRole: '탱커' },
    { rank: 5, nickname: '겜날림', mmr: 2450, wins: 30, losses: 22, winRate: 57.7, mainRole: '힐러' },
    { rank: 6, nickname: '뉴비탱커', mmr: 2320, wins: 25, losses: 25, winRate: 50.0, mainRole: '탱커' },
    { rank: 7, nickname: '심리전의달인', mmr: 2200, wins: 22, losses: 26, winRate: 45.8, mainRole: '투사' },
    { rank: 8, nickname: '호츠드림', mmr: 2150, wins: 20, losses: 28, winRate: 41.7, mainRole: '원거리 암살자' },
    { rank: 9, nickname: '지하실거주자', mmr: 2050, wins: 15, losses: 30, winRate: 33.3, mainRole: '근접 암살자' },
    { rank: 10, nickname: '실버판테온', mmr: 1920, wins: 12, losses: 35, winRate: 25.5, mainRole: '투사' },
  ]);

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">순위표</h1>
      
      <div className="bg-slate-800 rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-700">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">순위</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">닉네임</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">MMR</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">승/패</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">승률</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">주 역할</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-600">
              {leaderboardData.map((player) => (
                <tr key={player.rank} className="hover:bg-slate-700 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className={`
                      inline-flex items-center justify-center w-8 h-8 rounded-full
                      ${player.rank === 1 ? 'bg-yellow-500' : 
                        player.rank === 2 ? 'bg-gray-300' :
                        player.rank === 3 ? 'bg-amber-600' : 'bg-slate-600'}
                      text-white font-bold text-sm
                    `}>
                      {player.rank}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">{player.nickname}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-indigo-400 font-bold">{player.mmr}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">
                      <span className="text-green-400">{player.wins}</span> / <span className="text-red-400">{player.losses}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">{player.winRate}%</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full
                      ${player.mainRole === '탱커' ? 'bg-blue-900 text-blue-200' :
                        player.mainRole === '투사' ? 'bg-red-900 text-red-200' :
                        player.mainRole === '힐러' ? 'bg-green-900 text-green-200' :
                        player.mainRole === '전문가' ? 'bg-purple-900 text-purple-200' :
                        player.mainRole === '원거리 암살자' ? 'bg-yellow-900 text-yellow-200' :
                        'bg-gray-900 text-gray-200'}
                    `}>
                      {player.mainRole}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="mt-6 text-center text-gray-400 text-sm">
        <p>MMR은 매치 결과에 따라 지속적으로 업데이트됩니다.</p>
        <p>최소 10회 이상의 게임을 진행한 플레이어만 순위표에 표시됩니다.</p>
      </div>
    </div>
  );
};

export default LeaderboardPage; 