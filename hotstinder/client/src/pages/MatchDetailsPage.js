import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import axios from 'axios';
import { toast } from 'react-toastify';
import ReplayUploadModal from '../components/common/ReplayUploadModal';
import './FindMatchPage.css'; // 같은 CSS 파일 사용

const MatchDetailsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setMatchProgress, currentMatchId } = useAuthStore();
  
  // 매치 정보 상태
  const [matchInfo, setMatchInfo] = useState(location.state?.matchInfo || {
    blueTeam: [],
    redTeam: [],
    blueTeamAvgMmr: 0,
    redTeamAvgMmr: 0,
    map: '',
    matchId: '',
    channelCreator: ''
  });
  
  // 상태 변수들
  const [callingAdmin, setCallingAdmin] = useState(false);
  const [submittingReplay, setSubmittingReplay] = useState(false);
  const [showReplayModal, setShowReplayModal] = useState(false);

  // 컴포넌트 마운트 시 매치 정보 로드
  useEffect(() => {
    // location.state에서 매치 정보가 없는 경우 localStorage에서 가져오기
    if (!location.state?.matchInfo) {
      const savedMatchInfo = localStorage.getItem('lastMatchInfo');
      if (savedMatchInfo) {
        try {
          const parsedInfo = JSON.parse(savedMatchInfo);
          setMatchInfo(parsedInfo);
        } catch (error) {
          console.error('매치 정보 파싱 오류:', error);
          // 정보가 없으면 메인 페이지로 리디렉션
          navigate('/');
        }
      } else {
        // 매치 ID가 있으면 서버에서 정보 가져오기
        if (currentMatchId) {
          // 실제로는 서버에서 매치 정보를 가져오는 API 호출이 필요함
          // axios.get(`/api/matches/${currentMatchId}`)...
          console.log('매치 ID로 정보 가져오기:', currentMatchId);
        } else {
          // 정보가 없으면 메인 페이지로 리디렉션
          navigate('/');
        }
      }
    }
    
    // body 클래스 제거
    document.body.classList.remove('queue-active');
  }, [location.state, navigate, currentMatchId]);

  // 관리자 호출 처리
  const callAdmin = () => {
    setCallingAdmin(true);
    
    // 매치 ID 확인
    const matchId = matchInfo?.matchId || currentMatchId;
    if (!matchId) {
      toast.error('매치 정보가 없습니다. 관리자에게 문의해주세요.');
      setCallingAdmin(false);
      return;
    }
    
    // 임시 구현 (API 없이)
    setTimeout(() => {
      toast.success('관리자에게 도움 요청이 전송되었습니다. 잠시만 기다려주세요.');
      setCallingAdmin(false);
    }, 1500);
  };

  // 매치 취소 기능
  const cancelMatch = () => {
    if (!window.confirm('정말로 매치를 취소하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }
    
    // 매치 진행 중 상태 초기화
    setMatchProgress(false);
    
    // localStorage에서 매치 정보 삭제
    localStorage.removeItem('matchInProgress');
    localStorage.removeItem('currentMatchId');
    localStorage.removeItem('lastMatchInfo');
    
    // 알림 표시
    toast.success('매치가 취소되었습니다.');
    
    // 메인 페이지로 이동
    navigate('/');
  };

  // 리플레이 제출 처리
  const submitReplay = () => {
    setSubmittingReplay(true);
    
    // 매치 ID가 있는지 확인
    const matchId = matchInfo?.matchId || currentMatchId;
    if (!matchId) {
      toast.error('매치 정보가 없습니다. 관리자에게 문의해주세요.');
      setSubmittingReplay(false);
      return;
    }
    
    // 리플레이 업로드 모달 표시
    setShowReplayModal(true);
    setSubmittingReplay(false);
  };

  // 리플레이 모달 닫기 핸들러
  const handleReplayModalClose = (success) => {
    setShowReplayModal(false);
    
    // 업로드 성공 시 추가 작업
    if (success) {
      // 매치 진행 중 상태 초기화
      setMatchProgress(false);
      
      // 모든 매치 관련 상태 초기화
      localStorage.removeItem('lastMatchInfo');
      
      // 메인 페이지로 이동
      navigate('/');
    }
  };

  return (
    <div className="matchmaking-container min-h-screen bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-8 pt-12">
        <div className="bg-slate-800 p-6 rounded-lg max-w-4xl w-full match-found-animation relative">
          <h2 className="text-3xl font-bold text-indigo-400 mb-4 text-center">매치 정보</h2>
          <p className="text-white text-xl mb-6 text-center">진행 중인 게임 정보입니다</p>
          
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
            
            {/* 채널 정보 */}
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
                    key={player.id || index} 
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
                    key={player.id || index} 
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
          
          {/* MMR 계산식 요약 */}
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
          <div className="grid grid-cols-2 gap-4 mt-4">
            <button 
              onClick={submitReplay}
              disabled={submittingReplay}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded transition disabled:opacity-50"
            >
              {submittingReplay ? '처리 중...' : '리플레이 제출'}
            </button>
            <button 
              onClick={callAdmin}
              disabled={callingAdmin}
              className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded transition disabled:opacity-50"
            >
              {callingAdmin ? '요청 중...' : '관리자 호출'}
            </button>
            <button
              onClick={() => navigate('/findmatch')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition"
            >
              매치메이킹 화면으로
            </button>
            <button 
              onClick={cancelMatch}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition"
            >
              매치 취소
            </button>
          </div>
          
          {/* 매치 ID 우측 하단에 작게 표시 */}
          <div className="text-right mt-4">
            <span className="text-gray-500/70 text-xs font-mono">
              매치 ID: {matchInfo.matchId || currentMatchId}
            </span>
          </div>
        </div>
      </div>
      
      {/* 리플레이 업로드 모달 */}
      {showReplayModal && (
        <ReplayUploadModal 
          isOpen={showReplayModal}
          onClose={handleReplayModalClose}
          matchId={matchInfo.matchId || currentMatchId}
        />
      )}
    </div>
  );
};

export default MatchDetailsPage; 