import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { toast } from 'react-toastify';

const MatchDetailsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, setMatchProgress, clearMatchInfo } = useAuthStore();
  const [showReplayUpload, setShowReplayUpload] = useState(false);
  const [replayFile, setReplayFile] = useState(null);

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

  const handleReplayUpload = () => {
    if (!replayFile) {
      toast.error('리플레이 파일을 선택해주세요.');
      return;
    }

    // 실제로는 서버에 파일 업로드
    toast.success('리플레이가 성공적으로 제출되었습니다.');
    setShowReplayUpload(false);
    setReplayFile(null);
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

  // 실제 유저 기반 팀 생성
  const generateRealUserTeams = () => {
    // 현재 사용자를 포함한 10명의 플레이어 생성
    const realUsers = [
      { id: user?.id || 1, name: user?.battleTag || user?.battletag || 'Player1', mmr: user?.mmr || 1500, role: '탱커' },
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

    return realUsers;
  };

  const players = generateRealUserTeams();
  const blueTeam = players.slice(0, 5);
  const redTeam = players.slice(5, 10);

  // MMR 차이에 따른 밸런스 상태 계산
  const getBalanceStatus = () => {
    const blueAvg = blueTeam.reduce((sum, p) => sum + p.mmr, 0) / 5;
    const redAvg = redTeam.reduce((sum, p) => sum + p.mmr, 0) / 5;
    const mmrDiff = Math.abs(blueAvg - redAvg);

    if (mmrDiff <= 50) return { status: '완벽', color: 'text-green-400', bgColor: 'bg-green-500/20' };
    if (mmrDiff <= 100) return { status: '양호', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' };
    return { status: '불균형', color: 'text-red-400', bgColor: 'bg-red-500/20' };
  };

  const balanceStatus = getBalanceStatus();
  const blueTeamAvgMmr = Math.round(blueTeam.reduce((sum, p) => sum + p.mmr, 0) / 5);
  const redTeamAvgMmr = Math.round(redTeam.reduce((sum, p) => sum + p.mmr, 0) / 5);

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
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => navigate('/matchmaking')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-white rounded-xl transition-all duration-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l-7-7 7-7M19 12H5" />
              </svg>
              돌아가기
            </button>

            <div className="text-center flex-1">
              <h1 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                매치 정보
              </h1>
            </div>

            <div className="text-right">
              <div className="text-sm text-gray-400">매치 ID</div>
              <div className="text-lg font-mono text-blue-400">{matchInfo.matchId}</div>
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
                  <div key={player.id} className="flex items-center justify-between bg-slate-700/30 rounded-xl p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center relative">
                        {index === 0 && (
                          <span className="absolute -top-1 -right-1 text-yellow-400">👑</span>
                        )}
                        <span className="text-red-400 font-bold">{index + 1}</span>
                      </div>
                      <div>
                        <div className="text-white font-medium">{player.name}</div>
                        <div className="text-xs text-gray-400">{player.role}</div>
                      </div>
                    </div>
                    <div className="text-red-400 font-bold">{player.mmr}</div>
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
                  <div key={player.id} className="flex items-center justify-between bg-slate-700/30 rounded-xl p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center relative">
                        {index === 0 && (
                          <span className="absolute -top-1 -right-1 text-yellow-400">👑</span>
                        )}
                        <span className="text-blue-400 font-bold">{index + 1}</span>
                      </div>
                      <div>
                        <div className="text-white font-medium">{player.name}</div>
                        <div className="text-xs text-gray-400">{player.role}</div>
                      </div>
                    </div>
                    <div className="text-blue-400 font-bold">{player.mmr}</div>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-3xl p-8 max-w-md w-full">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">리플레이 파일 제출</h3>
              <p className="text-gray-300">게임 종료 후 리플레이 파일을 업로드해주세요</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                리플레이 파일 (.StormReplay)
              </label>
              <input
                type="file"
                accept=".StormReplay"
                onChange={(e) => setReplayFile(e.target.files[0])}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-xl focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowReplayUpload(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleReplayUpload}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors"
              >
                제출
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchDetailsPage;
