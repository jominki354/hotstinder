import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { toast } from 'react-toastify';
import ReplayUploadModal from '../components/common/ReplayUploadModal';

const MatchDetailsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, setMatchProgress, clearMatchInfo, setQueueStatus } = useAuthStore();
  const [showReplayUpload, setShowReplayUpload] = useState(false);

  const matchInfo = location.state?.matchInfo;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!matchInfo) {
      toast.error('매치 정보를 찾을 수 없습니다.');
      navigate('/matchmaking');
      return;
    }
  }, [isAuthenticated, matchInfo, navigate]);

  const handleReplayUploadComplete = (success) => {
    setShowReplayUpload(false);

    if (success) {
      toast.success('매치가 완료되었습니다!');

      // 매치 상태 정리
      setMatchProgress(false);
      clearMatchInfo();
      setQueueStatus(false);

      // localStorage 정리
      localStorage.removeItem('matchInProgress');
      localStorage.removeItem('currentMatchId');
      localStorage.removeItem('lastMatchInfo');
      localStorage.removeItem('inQueue');
      localStorage.removeItem('redirectedToMatch');
      localStorage.removeItem('justFoundMatch');

      // 매치메이킹 페이지로 이동
      navigate('/matchmaking');
    }
  };

  const handleCallAdmin = () => {
    toast.info('관리자에게 호출 요청을 보냈습니다.');
    // 실제로는 관리자 알림 API 호출
  };

  const handleCancelMatch = () => {
    if (window.confirm('정말로 매치를 취소하시겠습니까?')) {
      // authStore에서 매치 진행 상태 해제
      setMatchProgress(false);
      clearMatchInfo();

      toast.warning('매치가 취소되었습니다.');
      navigate('/matchmaking');
    }
  };

  // 실제 DB 기반 팀 생성
  const generateRealUserTeams = () => {
    // 1순위: 실제 DB에서 가져온 매치 정보가 있으면 사용
    if (matchInfo && matchInfo.players && matchInfo.players.length === 10) {
      console.log('매치 정보에서 플레이어 데이터 사용:', matchInfo.players.length);
      return matchInfo.players;
    }

    // 2순위: 매치 정보에 팀 정보가 있으면 사용
    if (matchInfo && matchInfo.blueTeam && matchInfo.redTeam) {
      console.log('매치 정보에서 팀 데이터 사용:', matchInfo.blueTeam.length + matchInfo.redTeam.length);
      return [...matchInfo.blueTeam, ...matchInfo.redTeam];
    }

    // 3순위: 현재 사용자를 포함한 시뮬레이션 데이터 백업
    console.log('백업 시뮬레이션 데이터 사용');
    const simulatedUsers = [
      {
        id: user?.id || 1,
        name: user?.battleTag || user?.battletag || 'Player1',
        mmr: user?.mmr || 1500,
        role: user?.preferredRoles?.[0] || '탱커'
      },
      { id: 2, name: 'ShadowHunter#1234', mmr: 1520, role: '브루저' },
      { id: 3, name: 'IceQueen#5678', mmr: 1480, role: '원거리 딜러' },
      { id: 4, name: 'FireStorm#9012', mmr: 1510, role: '근접 딜러' },
      { id: 5, name: 'LightBringer#3456', mmr: 1490, role: '힐러' },
      { id: 6, name: 'DragonSlayer#7890', mmr: 1530, role: '탱커' },
      { id: 7, name: 'MysticMage#2345', mmr: 1470, role: '지원가' },
      { id: 8, name: 'StormRider#6789', mmr: 1540, role: '원거리 딜러' },
      { id: 9, name: 'NightBlade#0123', mmr: 1460, role: '근접 딜러' },
      { id: 10, name: 'HolyPriest#4567', mmr: 1500, role: '힐러' }
    ];

    return simulatedUsers;
  };

  // 플레이어 데이터 정규화 함수
  const normalizePlayerData = (player) => {
    // 다양한 데이터 구조를 통일된 형태로 변환
    return {
      id: player.id || player.userId || Math.random(),
      name: player.name || player.battleTag || player.battletag || player.nickname || `Player${Math.floor(Math.random() * 1000)}`,
      mmr: Math.round(player.mmr || player.currentMmr || 1500), // MMR을 정수로 변환
      role: player.role || player.preferredRole || '알 수 없음',
      hero: player.hero || '미정',
      isCurrentUser: player.isCurrentUser || (user && (player.id === user.id || player.userId === user.id))
    };
  };

  // 팀 데이터 처리
  let blueTeam = [];
  let redTeam = [];

  if (matchInfo && matchInfo.blueTeam && matchInfo.redTeam) {
    // 시뮬레이션에서 이미 팀이 분배되어 있으면 사용
    blueTeam = matchInfo.blueTeam.map(normalizePlayerData);
    redTeam = matchInfo.redTeam.map(normalizePlayerData);
    console.log('시뮬레이션 팀 데이터 사용:', { blueTeam: blueTeam.length, redTeam: redTeam.length });
  } else {
    // 백업: 플레이어 데이터에서 팀 생성
    const players = generateRealUserTeams().map(normalizePlayerData);
    redTeam = players.slice(0, 5);
    blueTeam = players.slice(5, 10);
    console.log('백업 팀 데이터 생성:', { blueTeam: blueTeam.length, redTeam: redTeam.length });
  }

  // 안전장치: 정확히 5명씩 되도록 보장
  while (redTeam.length < 5 && blueTeam.length > 5) {
    redTeam.push(blueTeam.pop());
  }
  while (blueTeam.length < 5 && redTeam.length > 5) {
    blueTeam.push(redTeam.pop());
  }

  console.log(`최종 팀 분배: 레드팀 ${redTeam.length}명, 블루팀 ${blueTeam.length}명`);
  console.log('레드팀 데이터:', redTeam);
  console.log('블루팀 데이터:', blueTeam);

  // MMR 차이에 따른 밸런스 상태 계산
  const getBalanceStatus = () => {
    const blueAvg = blueTeam.reduce((sum, p) => sum + (p.mmr || 1500), 0) / Math.max(blueTeam.length, 1);
    const redAvg = redTeam.reduce((sum, p) => sum + (p.mmr || 1500), 0) / Math.max(redTeam.length, 1);
    const mmrDiff = Math.abs(blueAvg - redAvg);

    if (mmrDiff <= 50) return { status: '완벽', color: 'text-green-400', bgColor: 'bg-green-500/20' };
    if (mmrDiff <= 100) return { status: '양호', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' };
    return { status: '불균형', color: 'text-red-400', bgColor: 'bg-red-500/20' };
  };

  const balanceStatus = getBalanceStatus();
  const blueTeamAvgMmr = Math.round(blueTeam.reduce((sum, p) => sum + (p.mmr || 1500), 0) / Math.max(blueTeam.length, 1));
  const redTeamAvgMmr = Math.round(redTeam.reduce((sum, p) => sum + (p.mmr || 1500), 0) / Math.max(redTeam.length, 1));

  if (!matchInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-white mb-4">매치 정보를 불러오는 중...</div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* 배경 효과 */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900"></div>
      <div className="fixed inset-0 opacity-10 pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>

      <div className="relative z-10 p-4">
        <div className="max-w-6xl mx-auto">
          {/* 헤더 */}
          <div className="grid grid-cols-3 items-center mb-8 gap-4">
            {/* 왼쪽: 돌아가기 버튼 */}
            <div className="flex justify-start">
              <button
                onClick={() => {
                  // 매치 찾기 상태 초기화
                  setMatchProgress(false);
                  clearMatchInfo();

                  // 대기열 상태 정리
                  setQueueStatus(false);
                  localStorage.setItem('inQueue', 'false');
                  localStorage.removeItem('lastMatchInfo');
                  localStorage.removeItem('matchInProgress');
                  localStorage.removeItem('currentMatchId');

                  navigate('/matchmaking');
                }}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-white rounded-xl transition-all duration-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l-7-7 7-7M19 12H5" />
                </svg>
                돌아가기
              </button>
            </div>

            {/* 중앙: 제목 및 개발용 매치 표시 */}
            <div className="flex flex-col items-center justify-center text-center">
              <h1 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                매치 정보
              </h1>
              {/* 개발용 매치 표시 */}
              {matchInfo?.isDevelopmentMatch && (
                <div className="flex justify-center">
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/20 border border-orange-500/30 rounded-full text-orange-400 text-sm font-medium">
                    🔧 개발용 매치
                  </span>
                </div>
              )}
            </div>

            {/* 오른쪽: 매치 ID */}
            <div className="flex justify-end">
              <div className="text-right">
                <div className="text-sm text-gray-400">매치 ID</div>
                <div className="text-lg font-mono text-blue-400">{matchInfo.matchId}</div>
              </div>
            </div>
          </div>

          {/* 게임 정보 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* 전장 정보 */}
            <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-600/30 rounded-3xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center text-2xl">
                  🗺️
                </div>
                <h3 className="text-xl font-bold text-white">전장</h3>
              </div>
              <div className="text-2xl font-bold text-blue-400 text-center">{matchInfo.map}</div>
            </div>

            {/* 알림 정보 */}
            <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-600/30 rounded-3xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-orange-500/20 rounded-2xl flex items-center justify-center text-2xl">
                  🔔
                </div>
                <h3 className="text-xl font-bold text-white">알림</h3>
              </div>
              <div className="space-y-2 text-center">
                <div className="text-sm text-gray-300">
                  <span className="text-orange-400 font-medium">채널:</span> 핫츠틴더
                </div>
                <div className="text-sm text-gray-300">
                  <span className="text-orange-400 font-medium">게임개설자:</span> 레드팀 👑
                </div>
                <div className="text-sm text-gray-300">
                  <span className="text-orange-400 font-medium">리플레이제출:</span> 승리팀 👑
                </div>
              </div>
            </div>

            {/* 팀 밸런스 */}
            <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-600/30 rounded-3xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center text-2xl">
                  ⚖️
                </div>
                <h3 className="text-xl font-bold text-white">팀 밸런스</h3>
              </div>
              <div className={`${balanceStatus.bgColor} rounded-xl p-3`}>
                <div className={`text-lg font-bold ${balanceStatus.color}`}>
                  {balanceStatus.status}
                </div>
                <div className="text-sm text-gray-300">
                  차이: {Math.abs(blueTeamAvgMmr - redTeamAvgMmr)} MMR
                </div>
              </div>
            </div>
          </div>

          {/* 팀 정보 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* 레드 팀 */}
            <div className="bg-red-900/20 border border-red-500/30 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-red-500 rounded-full"></div>
                  <h3 className="text-xl font-bold text-red-400">레드 팀</h3>
                </div>
                <div className="text-red-400 font-bold">
                  평균 MMR: {redTeamAvgMmr}
                </div>
              </div>

              <div className="space-y-3">
                {redTeam.map((player, index) => (
                  <div key={player.id} className={`flex items-center justify-between rounded-xl p-3 ${
                    player.isCurrentUser
                      ? 'bg-yellow-500/20 border border-yellow-500/30'
                      : 'bg-slate-700/30'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center relative">
                        {index === 0 && (
                          <span className="absolute -top-1 -right-1 text-yellow-400">👑</span>
                        )}
                        {player.isCurrentUser && (
                          <span className="absolute -bottom-1 -right-1 text-green-400 text-xs">●</span>
                        )}
                        <span className="text-red-400 font-bold">{index + 1}</span>
                      </div>
                      <div>
                        <div className={`font-medium ${player.isCurrentUser ? 'text-yellow-300' : 'text-white'}`}>
                          {player.name}
                          {player.isCurrentUser && <span className="ml-2 text-xs text-yellow-400">(나)</span>}
                        </div>
                        <div className="text-xs text-gray-400">{player.role}</div>
                        {player.hero && player.hero !== '미정' && (
                          <div className="text-xs text-blue-400">{player.hero}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-red-400 font-bold">{player.mmr || 1500}</div>
                      <div className="text-xs text-gray-400">MMR</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* VS 구분선 */}
            <div className="flex items-center justify-center">
              <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-black text-xl">VS</span>
              </div>
            </div>

            {/* 블루 팀 */}
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
                  <h3 className="text-xl font-bold text-blue-400">블루 팀</h3>
                </div>
                <div className="text-blue-400 font-bold">
                  평균 MMR: {blueTeamAvgMmr}
                </div>
              </div>

              <div className="space-y-3">
                {blueTeam.map((player, index) => (
                  <div key={player.id} className={`flex items-center justify-between rounded-xl p-3 ${
                    player.isCurrentUser
                      ? 'bg-yellow-500/20 border border-yellow-500/30'
                      : 'bg-slate-700/30'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center relative">
                        {index === 0 && (
                          <span className="absolute -top-1 -right-1 text-yellow-400">👑</span>
                        )}
                        {player.isCurrentUser && (
                          <span className="absolute -bottom-1 -right-1 text-green-400 text-xs">●</span>
                        )}
                        <span className="text-blue-400 font-bold">{index + 1}</span>
                      </div>
                      <div>
                        <div className={`font-medium ${player.isCurrentUser ? 'text-yellow-300' : 'text-white'}`}>
                          {player.name}
                          {player.isCurrentUser && <span className="ml-2 text-xs text-yellow-400">(나)</span>}
                        </div>
                        <div className="text-xs text-gray-400">{player.role}</div>
                        {player.hero && player.hero !== '미정' && (
                          <div className="text-xs text-blue-400">{player.hero}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-blue-400 font-bold">{player.mmr || 1500}</div>
                      <div className="text-xs text-gray-400">MMR</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 게임 규칙 안내 */}
          <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-600/30 rounded-3xl p-6 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                📋
              </div>
              <h3 className="text-xl font-bold text-white">게임 규칙</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl">
                <span className="text-2xl">👑</span>
                <span className="text-gray-300">각 팀의 리더가 밴픽을 담당합니다</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl">
                <span className="text-2xl">🎯</span>
                <span className="text-gray-300">게임 종료 후 리플레이 파일을 제출해주세요</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl">
                <span className="text-2xl">⚡</span>
                <span className="text-gray-300">문제 발생 시 관리자 호출을 이용해주세요</span>
              </div>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 리플레이 제출 */}
            <button
              onClick={() => setShowReplayUpload(true)}
              className="px-6 py-4 bg-green-600 hover:bg-green-700 text-white font-bold text-lg rounded-2xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              리플레이 제출
            </button>

            {/* 관리자 호출 */}
            <button
              onClick={handleCallAdmin}
              className="px-6 py-4 bg-yellow-600 hover:bg-yellow-700 text-white font-bold text-lg rounded-2xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              관리자 호출
            </button>

            {/* 매치 취소 */}
            <button
              onClick={handleCancelMatch}
              className="px-6 py-4 bg-red-600 hover:bg-red-700 text-white font-bold text-lg rounded-2xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              매치 취소
            </button>
          </div>
        </div>
      </div>

      {/* 리플레이 업로드 모달 */}
      {showReplayUpload && (
        <ReplayUploadModal
          isOpen={showReplayUpload}
          onClose={handleReplayUploadComplete}
          matchId={matchInfo?.matchId}
        />
      )}
    </div>
  );
};

export default MatchDetailsPage;


