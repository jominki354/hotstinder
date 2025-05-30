import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import axios from 'axios';
import ReplayUploadModal from '../components/common/ReplayUploadModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { translateHero, translateMap } from '../utils/hotsTranslations';
import './MatchDetailsPage.css'; // 새로운 CSS 파일

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
  const [isLoading, setIsLoading] = useState(false);

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
  const callAdmin = async () => {
    setCallingAdmin(true);

    // 매치 ID 확인
    const matchId = matchInfo?.matchId || currentMatchId;
    if (!matchId) {
      alert('매치 정보가 없습니다. 관리자에게 문의해주세요.');
      setCallingAdmin(false);
      return;
    }

    try {
      // 실제 관리자 호출 API (임시 구현)
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert('관리자에게 도움 요청이 전송되었습니다. 잠시만 기다려주세요.');
    } catch (error) {
      console.error('관리자 호출 오류:', error);
      alert('관리자 호출 중 오류가 발생했습니다.');
    } finally {
      setCallingAdmin(false);
    }
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
    localStorage.removeItem('redirectedToMatch'); // 리디렉션 플래그도 초기화

    // 메인 페이지로 이동
    navigate('/');
  };

  // 리플레이 제출 처리
  const submitReplay = () => {
    setSubmittingReplay(true);

    // 매치 ID가 있는지 확인
    const matchId = matchInfo?.matchId || currentMatchId;
    if (!matchId) {
      alert('매치 정보가 없습니다. 관리자에게 문의해주세요.');
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
      localStorage.removeItem('matchInProgress');
      localStorage.removeItem('currentMatchId');
      localStorage.removeItem('redirectedToMatch'); // 리디렉션 플래그도 초기화

      // 성공 메시지와 함께 대시보드로 이동
      alert('리플레이가 성공적으로 제출되었습니다! 매치 기록이 저장되었습니다.');
      navigate('/dashboard');
    }
  };

  // MMR 차이에 따른 밸런스 상태 계산
  const getBalanceStatus = () => {
    const mmrDiff = Math.abs(matchInfo.blueTeamAvgMmr - matchInfo.redTeamAvgMmr);
    if (mmrDiff <= 50) return { status: '완벽', color: 'text-green-400', bgColor: 'bg-green-500/20' };
    if (mmrDiff <= 100) return { status: '양호', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' };
    return { status: '불균형', color: 'text-red-400', bgColor: 'bg-red-500/20' };
  };

  const balanceStatus = getBalanceStatus();

  return (
    <div className="match-details-container">
      {/* 배경 그라데이션 */}
      <div className="match-details-background"></div>

      {/* 메인 컨텐츠 */}
      <div className="match-details-content">
        {/* 헤더 */}
        <div className="match-details-header">
          <button
            onClick={() => navigate('/findmatch')}
            className="match-details-back-btn"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 19-7-7 7-7"/>
              <path d="M19 12H5"/>
            </svg>
            돌아가기
          </button>

          <div className="match-details-title-section">
            <h1 className="match-details-title">매치 정보</h1>
            <p className="match-details-subtitle">진행 중인 게임의 상세 정보입니다</p>
          </div>

          <div className="match-details-id">
            <span className="match-details-id-label">매치 ID</span>
            <span className="match-details-id-value">{matchInfo.matchId || currentMatchId}</span>
          </div>
        </div>

        {/* 게임 정보 카드 */}
        <div className="match-details-game-info">
          <div className="match-details-card match-details-map-card">
            <div className="match-details-card-header">
              <div className="match-details-card-icon">🗺️</div>
              <h3>전장</h3>
            </div>
            <div className="match-details-card-content">
              <div className="match-details-map-name">{translateMap(matchInfo.map)}</div>
            </div>
          </div>

          <div className="match-details-card match-details-channel-card">
            <div className="match-details-card-header">
              <div className="match-details-card-icon">🎮</div>
              <h3>채널 정보</h3>
            </div>
            <div className="match-details-card-content">
              <div className="match-details-channel-info">
                <div className="match-details-channel-location">
                  <span>채널위치:</span>
                  <span>HotsTinder</span>
                </div>
                <div className="match-details-channel-creator">
                  <span>게임 개설자:</span>
                  <span className="match-details-creator-name">
                    <span className="match-details-crown">👑</span>
                    {matchInfo.channelCreator}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="match-details-card match-details-balance-card">
            <div className="match-details-card-header">
              <div className="match-details-card-icon">⚖️</div>
              <h3>팀 밸런스</h3>
            </div>
            <div className="match-details-card-content">
              <div className={`match-details-balance-status ${balanceStatus.bgColor}`}>
                <span className={`match-details-balance-text ${balanceStatus.color}`}>
                  {balanceStatus.status}
                </span>
                <span className="match-details-balance-diff">
                  차이: {Math.abs(matchInfo.blueTeamAvgMmr - matchInfo.redTeamAvgMmr)} MMR
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 팀 정보 */}
        <div className="match-details-teams">
          {/* 레드 팀 */}
          <div className="match-details-team match-details-team-red">
            <div className="match-details-team-header">
              <div className="match-details-team-title">
                <div className="match-details-team-icon">🔴</div>
                <h3>레드 팀</h3>
              </div>
              <div className="match-details-team-mmr">
                평균 MMR: <span>{matchInfo.redTeamAvgMmr}</span>
              </div>
            </div>

            <div className="match-details-team-players">
              {matchInfo.redTeam.map((player, index) => (
                <div
                  key={player.id || index}
                  className={`match-details-player ${index === 0 ? 'match-details-player-leader' : ''}`}
                >
                  <div className="match-details-player-info">
                    <div className="match-details-player-avatar">
                      {index === 0 && <span className="match-details-player-crown">👑</span>}
                      <div className="match-details-player-initial">
                        {player.battletag?.charAt(0) || 'P'}
                      </div>
                    </div>
                    <div className="match-details-player-details">
                      <div className="match-details-player-name">{player.battletag}</div>
                      <div className="match-details-player-role">{player.role}</div>
                      {player.hero && (
                        <div className="match-details-player-hero">{translateHero(player.hero)}</div>
                      )}
                    </div>
                  </div>
                  <div className="match-details-player-mmr">{player.mmr}</div>
                </div>
              ))}
            </div>
          </div>

          {/* VS 구분선 */}
          <div className="match-details-vs">
            <div className="match-details-vs-circle">
              <span>VS</span>
            </div>
          </div>

          {/* 블루 팀 */}
          <div className="match-details-team match-details-team-blue">
            <div className="match-details-team-header">
              <div className="match-details-team-title">
                <div className="match-details-team-icon">🔵</div>
                <h3>블루 팀</h3>
              </div>
              <div className="match-details-team-mmr">
                평균 MMR: <span>{matchInfo.blueTeamAvgMmr}</span>
              </div>
            </div>

            <div className="match-details-team-players">
              {matchInfo.blueTeam.map((player, index) => (
                <div
                  key={player.id || index}
                  className={`match-details-player ${index === 0 ? 'match-details-player-leader' : ''}`}
                >
                  <div className="match-details-player-info">
                    <div className="match-details-player-avatar">
                      {index === 0 && <span className="match-details-player-crown">👑</span>}
                      <div className="match-details-player-initial">
                        {player.battletag?.charAt(0) || 'P'}
                      </div>
                    </div>
                    <div className="match-details-player-details">
                      <div className="match-details-player-name">{player.battletag}</div>
                      <div className="match-details-player-role">{player.role}</div>
                      {player.hero && (
                        <div className="match-details-player-hero">{translateHero(player.hero)}</div>
                      )}
                    </div>
                  </div>
                  <div className="match-details-player-mmr">{player.mmr}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 게임 규칙 안내 */}
        <div className="match-details-rules">
          <div className="match-details-rules-header">
            <div className="match-details-rules-icon">📋</div>
            <h3>게임 규칙</h3>
          </div>
          <div className="match-details-rules-content">
            <div className="match-details-rule">
              <span className="match-details-rule-icon">👑</span>
              <span>각 팀의 리더(👑)가 밴픽을 담당합니다</span>
            </div>
            <div className="match-details-rule">
              <span className="match-details-rule-icon">🎯</span>
              <span>게임 종료 후 반드시 리플레이 파일을 제출해주세요</span>
            </div>
            <div className="match-details-rule">
              <span className="match-details-rule-icon">⚡</span>
              <span>문제 발생 시 관리자 호출 버튼을 이용해주세요</span>
            </div>
          </div>
        </div>

        {/* 액션 버튼들 */}
        <div className="match-details-actions">
          <button
            onClick={submitReplay}
            disabled={submittingReplay}
            className="match-details-btn match-details-btn-primary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7,10 12,15 17,10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            {submittingReplay ? '처리 중...' : '리플레이 제출'}
          </button>

          <button
            onClick={callAdmin}
            disabled={callingAdmin}
            className="match-details-btn match-details-btn-warning"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            {callingAdmin ? '요청 중...' : '관리자 호출'}
          </button>

          <button
            onClick={cancelMatch}
            className="match-details-btn match-details-btn-danger"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"/>
              <path d="m6 6 12 12"/>
            </svg>
            매치 취소
          </button>
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
