import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import axios from 'axios';

const FindMatchPage = () => {
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  
  const [inQueue, setInQueue] = useState(false);
  const [queueStatus, setQueueStatus] = useState({
    currentPlayers: 0,
    requiredPlayers: 10,
    estimatedTime: '00:00'
  });
  const [matchFound, setMatchFound] = useState(false);
  const [error, setError] = useState('');
  
  // 매치 정보 상태 추가
  const [matchInfo, setMatchInfo] = useState({
    blueTeam: [],
    redTeam: [],
    blueTeamAvgMmr: 0,
    redTeamAvgMmr: 0,
    map: '',
    matchId: '',
    channelCreator: ''
  });

  // 맵 배열 선언
  const maps = [
    '용의 둥지', '저주받은 골짜기', '공포의 정원', '하늘 사원', 
    '거미 여왕의 무덤', '영원의 전쟁터', '불지옥 신단', 
    '파멸의 탑', '볼스카야 공장', '알터랙 고개'
  ];

  // 대기열 업데이트를 위한 폴링 함수
  useEffect(() => {
    let interval;
    
    if (inQueue && !matchFound) {
      interval = setInterval(() => {
        // 서버에서 대기열 상태 가져오기
        axios.get('/api/matchmaking/status')
          .then(res => {
            setQueueStatus(res.data);
            
            // 10명이 모이면 매치 찾음 처리
            if (res.data.currentPlayers === res.data.requiredPlayers) {
              setMatchFound(true);
              clearInterval(interval);
            }
          })
          .catch(err => {
            console.error('대기열 상태 가져오기 오류:', err);
            setError('대기열 상태를 가져오는데 실패했습니다.');
          });
      }, 3000); // 3초마다 업데이트
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [inQueue, matchFound]);

  // 매치가 찾아졌을 때 매치 정보 생성 (한 번만 실행)
  useEffect(() => {
    if (matchFound && matchInfo.blueTeam.length === 0) {
      generateMatchInfo();
    }
  }, [matchFound, matchInfo.blueTeam.length]);

  // 매치메이킹 대기열 참가
  const joinQueue = async () => {
    try {
      setError('');
      const response = await axios.post('/api/matchmaking/join', {
        userId: user._id
      });
      
      if (response.data.success) {
        setInQueue(true);
        setQueueStatus(response.data.queueStatus);
      } else {
        setError(response.data.message || '대기열 참가에 실패했습니다.');
      }
    } catch (err) {
      console.error('대기열 참가 오류:', err);
      setError('대기열 참가 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  // 매치메이킹 대기열 취소
  const leaveQueue = async () => {
    try {
      const response = await axios.post('/api/matchmaking/leave', {
        userId: user._id
      });
      
      if (response.data.success) {
        setInQueue(false);
      } else {
        setError(response.data.message || '대기열 취소에 실패했습니다.');
      }
    } catch (err) {
      console.error('대기열 취소 오류:', err);
      setError('대기열 취소 중 오류가 발생했습니다.');
    }
  };

  // 개발용 모의 대기열 참가
  const simulateQueue = () => {
    setInQueue(true);
    // 개발용 타이머: 플레이어 수를 점진적으로 증가시키는 시뮬레이션
    let players = 1;
    const demoInterval = setInterval(() => {
      players = Math.min(10, players + 1);
      setQueueStatus({
        currentPlayers: players,
        requiredPlayers: 10,
        estimatedTime: players >= 10 ? '00:00' : '01:30'
      });
      
      if (players === 10) {
        setMatchFound(true);
        clearInterval(demoInterval);
      }
    }, 2000);
  };

  // 가상의 매치 정보를 생성하는 함수
  const generateMatchInfo = () => {
    // 이미 매치 정보가 있으면 다시 생성하지 않음
    if (matchInfo.blueTeam.length > 0) {
      return;
    }
    
    console.log('매치 정보 생성 중...');
    
    // 모의 플레이어 데이터
    const players = [
      { id: 1, battletag: '전부못함#3518', mmr: 1500, role: '탱커' },
      { id: 2, battletag: '메디브장인#1234', mmr: 1650, role: '전문가' },
      { id: 3, battletag: '앵그리호츠맨#5678', mmr: 1480, role: '투사' },
      { id: 4, battletag: '힐러대장#9012', mmr: 1550, role: '힐러' },
      { id: 5, battletag: '겜날림#3456', mmr: 1520, role: '원거리 암살자' },
      { id: 6, battletag: '뉴비탱커#7890', mmr: 1470, role: '탱커' },
      { id: 7, battletag: '호츠드림#2345', mmr: 1600, role: '원거리 암살자' },
      { id: 8, battletag: '지하실거주자#6789', mmr: 1530, role: '근접 암살자' },
      { id: 9, battletag: '실버판테온#0123', mmr: 1490, role: '투사' },
      { id: 10, battletag: '초보힐러#4567', mmr: 1510, role: '힐러' },
    ];
    
    // 현재 사용자를 포함
    const currentUserIndex = players.findIndex(p => p.battletag === user.battletag);
    if (currentUserIndex === -1) {
      players[0] = { 
        id: 1, 
        battletag: user.battletag, 
        mmr: user.mmr || 1500, 
        role: user.preferredRoles?.[0] || '탱커' 
      };
    }
    
    // 무작위로 팀 분배
    const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
    const blueTeam = shuffledPlayers.slice(0, 5);
    const redTeam = shuffledPlayers.slice(5, 10);
    
    // MMR 기준으로 정렬 (내림차순)
    const sortedBlueTeam = [...blueTeam].sort((a, b) => b.mmr - a.mmr);
    const sortedRedTeam = [...redTeam].sort((a, b) => b.mmr - a.mmr);
    
    // 팀 MMR 평균 계산
    const blueTeamAvgMmr = Math.round(sortedBlueTeam.reduce((acc, p) => acc + p.mmr, 0) / 5);
    const redTeamAvgMmr = Math.round(sortedRedTeam.reduce((acc, p) => acc + p.mmr, 0) / 5);
    
    // 무작위 맵 선택
    const randomMap = maps[Math.floor(Math.random() * maps.length)];
    
    // 채널 개설자 (레드팀에서 무작위로 선택)
    const channelCreator = sortedRedTeam[0].battletag;
    
    // 날짜 기반 고유 매치 ID 생성 (YYYYMMDD-HHMM-순번)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    // 순번은 시뮬레이션이므로 1~999 중 랜덤하게 생성
    const sequence = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
    
    const matchId = `${year}${month}${day}-${hours}${minutes}-${sequence}`;
    
    // 매치 정보 설정
    setMatchInfo({
      blueTeam: sortedBlueTeam,
      redTeam: sortedRedTeam,
      blueTeamAvgMmr,
      redTeamAvgMmr,
      map: randomMap,
      matchId,
      channelCreator
    });
  };

  // 관리자 호출 처리
  const callAdmin = () => {
    // 실제 구현에서는 관리자에게 알림을 보내는 API 호출
    alert('관리자에게 도움 요청이 전송되었습니다. 잠시만 기다려주세요.');
  };

  // 리플레이 제출 처리
  const submitReplay = () => {
    // 실제 구현에서는 리플레이 파일 업로드 또는 링크 제출 기능
    alert('리플레이 제출 페이지로 이동합니다.');
  };

  // 매치 상세 정보 보기
  const viewMatchDetails = (matchId) => {
    // 실제 구현에서는 매치 상세 정보 페이지로 이동하거나 모달을 표시
    alert(`매치 ID: ${matchId}의 상세 결과를 표시합니다. 실제 구현에서는 매치 결과 페이지로 이동합니다.`);
    
    // 실제 구현 시에는 아래와 같이 사용
    // navigate(`/matches/${matchId}`);
  };

  // 매치 찾음 창 닫기
  const closeMatchFound = () => {
    setMatchFound(false);
  };

  // 매치 찾기 결과 표시 컴포넌트
  const renderMatchFoundOverlay = () => {
    if (!matchFound) return null;
    
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 overflow-auto">
        <div className="bg-slate-800 p-6 rounded-lg max-w-4xl w-full match-found-animation relative">
          {/* 닫기 버튼 */}
          <button 
            onClick={closeMatchFound}
            className="absolute top-2 right-2 text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-700/50 transition"
            aria-label="닫기"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>

          <h2 className="text-3xl font-bold text-indigo-400 mb-4 text-center">매치 찾음!</h2>
          <p className="text-white text-xl mb-6 text-center">곧 게임이 시작됩니다...</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* 전장 정보 */}
            <div className="bg-indigo-900/30 p-4 rounded-lg text-center flex flex-col justify-center relative">
              <div className="absolute top-0 left-0 right-0 bg-indigo-900/60 py-1 px-3 rounded-t-lg">
                <h3 className="text-lg font-semibold text-indigo-300 text-center">전장</h3>
              </div>
              <div className="mt-6">
                <p className="text-white text-2xl font-bold mb-4">{matchInfo.map}</p>
              </div>
            </div>
            
            {/* 채널 정보 - 우측에 배치 */}
            <div className="bg-indigo-900/30 p-4 rounded-lg text-center flex flex-col justify-center relative">
              <div className="absolute top-0 left-0 right-0 bg-indigo-900/60 py-1 px-3 rounded-t-lg">
                <h3 className="text-lg font-semibold text-indigo-300 text-center">채널 정보</h3>
              </div>
              <div className="mt-6">
                <p className="text-white mb-2">
                  <span className="text-gray-400">채널위치:</span> HotsTinder
                </p>
                <p className="text-white flex items-center justify-center">
                  <span className="text-gray-400 mr-1">게임 개설자:</span>
                  <span className="text-yellow-300 flex items-center ml-1">
                    <span className="text-yellow-500 mr-1">👑</span>
                    {matchInfo.channelCreator}
                  </span>
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* 레드 팀 (왼쪽) */}
            <div className="bg-red-900/20 p-4 rounded-lg border-2 border-red-800 shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-red-400">레드 팀</h3>
                <div className="text-red-300">평균 MMR: <span className="font-bold">{matchInfo.redTeamAvgMmr}</span></div>
              </div>
              <ul className="space-y-2">
                {matchInfo.redTeam.map((player, index) => (
                  <li 
                    key={player.id} 
                    className={`${index === 0 ? 'bg-red-900/40' : 'bg-red-900/30'} p-2 rounded flex justify-between items-center ${index === 0 ? 'border border-yellow-500/50' : ''}`}
                  >
                    <div className="flex items-center">
                      {index === 0 && <span className="text-yellow-500 mr-1">👑</span>}
                      <div>
                        <span className="text-white font-medium">{player.battletag}</span>
                        <span className="text-red-300 text-sm ml-2">({player.role})</span>
                      </div>
                    </div>
                    <div className="text-red-200 font-semibold">{player.mmr}</div>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* 블루 팀 (오른쪽) */}
            <div className="bg-blue-900/20 p-4 rounded-lg border-2 border-blue-800 shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-blue-400">블루 팀</h3>
                <div className="text-blue-300">평균 MMR: <span className="font-bold">{matchInfo.blueTeamAvgMmr}</span></div>
              </div>
              <ul className="space-y-2">
                {matchInfo.blueTeam.map((player, index) => (
                  <li 
                    key={player.id} 
                    className={`${index === 0 ? 'bg-blue-900/40' : 'bg-blue-900/30'} p-2 rounded flex justify-between items-center ${index === 0 ? 'border border-yellow-500/50' : ''}`}
                  >
                    <div className="flex items-center">
                      {index === 0 && <span className="text-yellow-500 mr-1">👑</span>}
                      <div>
                        <span className="text-white font-medium">{player.battletag}</span>
                        <span className="text-blue-300 text-sm ml-2">({player.role})</span>
                      </div>
                    </div>
                    <div className="text-blue-200 font-semibold">{player.mmr}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* MMR 계산식 요약 - 이전 위치로 이동 */}
          <div className="bg-slate-700/50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-semibold text-white mb-2 text-center">팀 밸런스 정보</h3>
            <div className="flex justify-between items-center">
              <div className="text-red-300">레드 팀: {matchInfo.redTeamAvgMmr} MMR</div>
              <div className="text-gray-400">차이: {Math.abs(matchInfo.blueTeamAvgMmr - matchInfo.redTeamAvgMmr)} MMR</div>
              <div className="text-blue-300">블루 팀: {matchInfo.blueTeamAvgMmr} MMR</div>
            </div>
            <div className="text-center text-gray-300 mt-2 text-sm">
              👑이 각 팀의 밴픽을 담당합니다.
            </div>
          </div>
          
          {/* 버튼 영역 */}
          <div className="text-center flex justify-center space-x-4">
            <button 
              onClick={callAdmin}
              className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded transition"
            >
              관리자 호출
            </button>
            <button 
              onClick={submitReplay}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded transition"
            >
              리플레이 제출
            </button>
          </div>
          
          {/* 매치 ID 우측 하단에 작게 표시 */}
          <div className="text-right mt-4">
            <button
              onClick={() => viewMatchDetails(matchInfo.matchId)}
              className="text-gray-500/70 hover:text-indigo-400/90 text-xs font-mono transition-colors duration-200 cursor-pointer"
              title="클릭하여 매치 상세 정보 보기"
            >
              {matchInfo.matchId}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fadeIn">
      {renderMatchFoundOverlay()}
      
      <div className="mb-6">
        <Link to="/" className="text-indigo-400 hover:text-indigo-300">
          &larr; 홈으로 돌아가기
        </Link>
      </div>
      
      <div className="card">
        <h1 className="text-3xl font-bold text-indigo-400 mb-6">매치 찾기</h1>
        
        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">내 정보</h2>
          {isAuthenticated && user ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-300">
              <div className="bg-slate-700/50 p-4 rounded">
                <div className="text-sm text-gray-400">배틀태그</div>
                <div className="font-semibold">{user.battletag}</div>
              </div>
              <div className="bg-slate-700/50 p-4 rounded">
                <div className="text-sm text-gray-400">MMR</div>
                <div className="font-semibold">{user.mmr || 1500}</div>
              </div>
              <div className="bg-slate-700/50 p-4 rounded">
                <div className="text-sm text-gray-400">주요 역할</div>
                <div className="font-semibold">{user.mainRole || '미정'}</div>
              </div>
            </div>
          ) : (
            <div className="text-yellow-300 mb-4">
              로그인이 필요합니다. <Link to="/login" className="text-indigo-400 hover:underline">로그인하기</Link>
            </div>
          )}
        </div>
        
        {inQueue ? (
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-semibold text-white mb-4">대기열에 등록됨</h2>
            
            <div className="bg-slate-700/50 p-6 rounded-lg mb-6">
              <div className="flex justify-center items-center mb-4">
                <div className="text-4xl font-bold text-indigo-400">{queueStatus.currentPlayers}</div>
                <div className="text-2xl text-gray-400 mx-2">/</div>
                <div className="text-4xl font-bold text-white">{queueStatus.requiredPlayers}</div>
              </div>
              
              <div className="w-full bg-slate-800 h-4 rounded-full overflow-hidden mb-2">
                <div 
                  className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(queueStatus.currentPlayers / queueStatus.requiredPlayers) * 100}%` }}
                ></div>
              </div>
              
              <div className="text-gray-300 text-center">
                예상 대기 시간: <span className="text-indigo-300">{queueStatus.estimatedTime}</span>
              </div>
            </div>
            
            <button
              onClick={leaveQueue}
              className="btn btn-danger w-full md:w-auto"
            >
              대기열 취소
            </button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-gray-300 mb-6">
              매치 찾기를 시작하면 동일한 MMR대의 플레이어 10명이 모일 때까지 대기합니다.
              10명이 모이면 자동으로 팀이 구성되고 게임이 시작됩니다.
            </p>
            
            <div className="flex flex-col md:flex-row justify-center gap-4">
              <button
                onClick={joinQueue}
                disabled={!isAuthenticated}
                className="btn btn-primary"
              >
                매치 찾기 시작
              </button>
              
              {process.env.NODE_ENV === 'development' && (
                <button
                  onClick={simulateQueue}
                  className="btn btn-secondary"
                >
                  [개발용] 매치 시뮬레이션
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FindMatchPage; 