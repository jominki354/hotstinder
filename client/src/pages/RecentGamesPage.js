import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const RecentGamesPage = () => {
  // 임시 더미 데이터
  const [recentGames, setRecentGames] = useState([
    {
      id: 'game1',
      map: '하늘 사원',
      date: '2025년 5월 19일',
      time: '17:30',
      duration: '23:45',
      winner: 'blue',
      blueTeam: {
        name: '푸른별 팀',
        avgMmr: 2580,
        players: [
          { nickname: '전부못함', role: '탱커', hero: '가로쉬', kills: 8, deaths: 4, assists: 12 },
          { nickname: '메디브장인', role: '전문가', hero: '메디브', kills: 5, deaths: 2, assists: 16 },
          { nickname: '앵그리호츠맨', role: '투사', hero: '소냐', kills: 12, deaths: 6, assists: 8 },
          { nickname: '힐러대장', role: '힐러', hero: '안두인', kills: 2, deaths: 3, assists: 18 },
          { nickname: '겜날림', role: '원거리 암살자', hero: '레이너', kills: 10, deaths: 5, assists: 7 }
        ]
      },
      redTeam: {
        name: '붉은별 팀',
        avgMmr: 2450,
        players: [
          { nickname: '뉴비탱커', role: '탱커', hero: '무라딘', kills: 3, deaths: 9, assists: 10 },
          { nickname: '호츠드림', role: '원거리 암살자', hero: '줄', kills: 7, deaths: 8, assists: 5 },
          { nickname: '지하실거주자', role: '근접 암살자', hero: '발리라', kills: 9, deaths: 10, assists: 4 },
          { nickname: '실버판테온', role: '투사', hero: '트레이서', kills: 6, deaths: 11, assists: 6 },
          { nickname: '초보힐러', role: '힐러', hero: '마오리엔', kills: 1, deaths: 7, assists: 14 }
        ]
      }
    },
    {
      id: 'game2',
      map: '용의 둥지',
      date: '2025년 5월 19일',
      time: '16:15',
      duration: '19:22',
      winner: 'red',
      blueTeam: {
        name: '눈사태 조직',
        avgMmr: 2380,
        players: [
          { nickname: '겜날림', role: '탱커', hero: '죠한나', kills: 5, deaths: 7, assists: 6 },
          { nickname: '초보힐러', role: '힐러', hero: '브라이트윙', kills: 2, deaths: 6, assists: 10 },
          { nickname: '뉴비탱커', role: '투사', hero: '데하카', kills: 8, deaths: 6, assists: 3 },
          { nickname: '심리전의달인', role: '전문가', hero: '아즈모단', kills: 6, deaths: 4, assists: 4 },
          { nickname: '호츠드림', role: '원거리 암살자', hero: '케리건', kills: 7, deaths: 8, assists: 5 }
        ]
      },
      redTeam: {
        name: '불꽃 군단',
        avgMmr: 2520,
        players: [
          { nickname: '전부못함', role: '원거리 암살자', hero: '제이나', kills: 9, deaths: 4, assists: 7 },
          { nickname: '메디브장인', role: '전문가', hero: '메디브', kills: 4, deaths: 3, assists: 12 },
          { nickname: '앵그리호츠맨', role: '투사', hero: '레오릭', kills: 6, deaths: 7, assists: 9 },
          { nickname: '지하실거주자', role: '근접 암살자', hero: '일리단', kills: 11, deaths: 5, assists: 3 },
          { nickname: '힐러대장', role: '힐러', hero: '루시우', kills: 1, deaths: 2, assists: 15 }
        ]
      }
    },
    {
      id: 'game3',
      map: '저주받은 골짜기',
      date: '2025년 5월 19일',
      time: '15:00',
      duration: '21:54',
      winner: 'blue',
      blueTeam: {
        name: '넥서스 수호자',
        avgMmr: 2620,
        players: [
          { nickname: '앵그리호츠맨', role: '탱커', hero: '디아블로', kills: 7, deaths: 3, assists: 14 },
          { nickname: '전부못함', role: '투사', hero: '말퓨리온', kills: 6, deaths: 5, assists: 8 },
          { nickname: '메디브장인', role: '전문가', hero: '프로비우스', kills: 8, deaths: 2, assists: 5 },
          { nickname: '히오스고수', role: '원거리 암살자', hero: '크로미', kills: 15, deaths: 1, assists: 6 },
          { nickname: '힐러대장', role: '힐러', hero: '리 리', kills: 3, deaths: 4, assists: 20 }
        ]
      },
      redTeam: {
        name: '악마의 수확자',
        avgMmr: 2580,
        players: [
          { nickname: '실버판테온', role: '탱커', hero: '스티치스', kills: 4, deaths: 8, assists: 9 },
          { nickname: '지하실거주자', role: '근접 암살자', hero: '제라툴', kills: 7, deaths: 7, assists: 5 },
          { nickname: '심리전의달인', role: '투사', hero: '바리안', kills: 5, deaths: 9, assists: 7 },
          { nickname: '호츠드림', role: '원거리 암살자', hero: '노바', kills: 9, deaths: 7, assists: 4 },
          { nickname: '겜날림', role: '힐러', hero: '알렉스트라자', kills: 1, deaths: 7, assists: 13 }
        ]
      }
    },
  ]);

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">최근 게임</h1>

      <div className="space-y-6">
        {recentGames.map((game) => (
          <div key={game.id} className="bg-slate-800 rounded-lg shadow-lg overflow-hidden">
            <div className="bg-slate-700 px-6 py-4 flex flex-wrap justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-white">{game.map}</h3>
                <p className="text-gray-400 text-sm">{game.date} {game.time} • {game.duration}</p>
              </div>
              <div 
                className="mt-2 sm:mt-0 bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                게임 완료
              </div>
            </div>

            <div className="p-4">
              <div className="flex flex-col sm:flex-row">
                {/* 블루 팀 */}
                <div className={`w-full sm:w-1/2 p-4 rounded-lg ${game.winner === 'blue' ? 'bg-blue-900/30' : ''}`}>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-blue-300 font-bold">{game.blueTeam.name}</h4>
                    <div className="text-white text-sm">평균 MMR: <span className="text-blue-300 font-bold">{game.blueTeam.avgMmr}</span></div>
                    {game.winner === 'blue' && <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">승리</div>}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="text-xs text-gray-400">
                          <th className="text-left pb-2">플레이어</th>
                          <th className="text-left pb-2">영웅</th>
                          <th className="text-left pb-2">KDA</th>
                        </tr>
                      </thead>
                      <tbody>
                        {game.blueTeam.players.map((player, index) => (
                          <tr key={index} className="border-t border-slate-700">
                            <td className="py-2">
                              <div className="text-white text-sm">{player.nickname}</div>
                              <div className="text-xs text-gray-400">{player.role}</div>
                            </td>
                            <td className="py-2 text-blue-300 text-sm">{player.hero}</td>
                            <td className="py-2 text-sm">
                              <span className="text-green-400">{player.kills}</span> / 
                              <span className="text-red-400">{player.deaths}</span> / 
                              <span className="text-yellow-400">{player.assists}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 레드 팀 */}
                <div className={`w-full sm:w-1/2 p-4 rounded-lg ${game.winner === 'red' ? 'bg-red-900/30' : ''}`}>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-red-300 font-bold">{game.redTeam.name}</h4>
                    <div className="text-white text-sm">평균 MMR: <span className="text-red-300 font-bold">{game.redTeam.avgMmr}</span></div>
                    {game.winner === 'red' && <div className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">승리</div>}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="text-xs text-gray-400">
                          <th className="text-left pb-2">플레이어</th>
                          <th className="text-left pb-2">영웅</th>
                          <th className="text-left pb-2">KDA</th>
                        </tr>
                      </thead>
                      <tbody>
                        {game.redTeam.players.map((player, index) => (
                          <tr key={index} className="border-t border-slate-700">
                            <td className="py-2">
                              <div className="text-white text-sm">{player.nickname}</div>
                              <div className="text-xs text-gray-400">{player.role}</div>
                            </td>
                            <td className="py-2 text-red-300 text-sm">{player.hero}</td>
                            <td className="py-2 text-sm">
                              <span className="text-green-400">{player.kills}</span> / 
                              <span className="text-red-400">{player.deaths}</span> / 
                              <span className="text-yellow-400">{player.assists}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentGamesPage; 