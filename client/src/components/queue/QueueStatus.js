import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './QueueStatus.css';

// 대기 시간을 전역적으로 관리하기 위한 상태 객체
const queueTimeState = {
  time: 0,
  listeners: new Set(),
  serverStartTime: null,
  serverWaitTime: 0,
  serverTimeOffset: 0,
  intervalId: null,
  isNotifying: false,

  // 서버 시간 기준으로 대기 시간 설정
  setServerTime(serverWaitTime, serverJoinedAt, serverTime) {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (serverWaitTime === 0 && !serverJoinedAt) {
      this.reset();
      return;
    }

    const clientTime = Date.now();
    const serverTimeMs = new Date(serverTime).getTime();
    this.serverTimeOffset = serverTimeMs - clientTime;

    this.serverWaitTime = serverWaitTime;
    this.serverStartTime = serverJoinedAt ? new Date(serverJoinedAt) : null;
    this.time = serverWaitTime;

    this.intervalId = setInterval(() => {
      if (this.serverStartTime) {
        const adjustedClientTime = Date.now() + this.serverTimeOffset;
        const elapsedMs = adjustedClientTime - this.serverStartTime.getTime();
        const elapsedSeconds = Math.floor(elapsedMs / 1000);

        if (this.time !== elapsedSeconds && elapsedSeconds >= 0) {
          this.time = elapsedSeconds;
          this.notify();
        }
      }
    }, 1000);

    this.notify();
  },

  // 대기 시간 초기화
  reset() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    const prevTime = this.time;
    this.time = 0;
    this.startTime = null;
    this.serverStartTime = null;
    this.serverWaitTime = 0;
    this.serverTimeOffset = 0;

    if (prevTime !== 0) {
      setTimeout(() => {
        this.notify();
      }, 0);
    }
  },

  // 리스너 추가
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  },

  // 모든 리스너에게 변경 알림
  notify() {
    if (this.isNotifying) {
      return;
    }

    this.isNotifying = true;

    try {
      this.listeners.forEach(callback => {
        try {
          callback(this.time);
        } catch (err) {
          console.error('Queue time listener error:', err);
        }
      });
    } finally {
      this.isNotifying = false;
    }
  }
};

// 시간 포맷팅 함수
const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds < 0) {
    return '00:00';
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// QueueStatus 컴포넌트
const QueueStatus = () => {
  const {
    isAuthenticated,
    user,
    inQueue,
    setQueueStatus,
    matchInProgress,
    setMatchProgress,
    currentMatchId,
    matchInfo,
    setMatchInfo
  } = useAuthStore();

  const navigate = useNavigate();
  const location = useLocation();

  // 컴포넌트 상태
  const [queueTime, setQueueTime] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLeavingQueue, setIsLeavingQueue] = useState(false);
  const [matchFound, setMatchFound] = useState(false);

  // 대기열 상태 관리
  const [queueStatusState, setQueueStatusState] = useState({
    currentPlayers: 0,
    requiredPlayers: 10,
    message: '대기 중...'
  });

  // 폴링 인터벌 참조
  const pollingIntervalRef = useRef(null);

  // 대기열 상태 폴링 함수
  const pollQueueStatus = useCallback(async () => {
    if (!isAuthenticated || !inQueue) return;

    try {
      const response = await axios.get('/api/matchmaking/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success && response.data.data) {
        const statusData = response.data.data;

        // 대기열 상태 업데이트
        setQueueStatusState({
          currentPlayers: statusData.totalInQueue || 0,
          requiredPlayers: 10,
          message: statusData.message || '대기 중...'
        });

        // 서버 시간 동기화
        if (statusData.waitTimeSeconds !== undefined) {
          queueTimeState.setServerTime(
            statusData.waitTimeSeconds,
            statusData.queueTime,
            new Date().toISOString()
          );
        }

        // 매치가 찾아졌는지 확인
        if (statusData.matchFound) {
          setMatchFound(true);
          if (statusData.matchInfo) {
            setMatchInfo(statusData.matchInfo);
            setMatchProgress(true, statusData.matchInfo.matchId);
          }
        }
      }
    } catch (error) {
      console.error('[QueueStatus] 대기열 상태 폴링 오류:', error);
    }
  }, [isAuthenticated, inQueue, setMatchInfo, setMatchProgress]);

  // 폴링 시작/중지
  useEffect(() => {
    if (isAuthenticated && inQueue) {
      // 즉시 한 번 실행
      pollQueueStatus();

      // 3초마다 폴링
      pollingIntervalRef.current = setInterval(pollQueueStatus, 3000);
    } else {
      // 폴링 중지
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [isAuthenticated, inQueue, pollQueueStatus]);

  // 대기 시간 구독
  useEffect(() => {
    const unsubscribe = queueTimeState.subscribe(setQueueTime);
    return unsubscribe;
  }, []);

  // 대기열 취소
  const leaveQueue = useCallback(async () => {
    if (isLeavingQueue) return;

    try {
      setIsLeavingQueue(true);

      // 시뮬레이션 모드인 경우
      if (window.isSimulationRunning || localStorage.getItem('simulatedPlayers')) {
        localStorage.removeItem('simulatedPlayers');
        localStorage.removeItem('simulationStartTime');
        window.isSimulationRunning = false;
      }

      // API 호출 - 실제 대기열 취소
      await axios.post('/api/matchmaking/leave');

      // 로컬 스토리지와 전역 상태 업데이트
      localStorage.setItem('inQueue', 'false');
      setQueueStatus(false);

      // 타이머 초기화
      queueTimeState.reset();

      // 매치 찾음 상태 초기화
      setMatchFound(false);
    } catch (err) {
      // 오류 발생 시에도 로컬 상태는 취소 처리
      localStorage.setItem('inQueue', 'false');
      setQueueStatus(false);
      queueTimeState.reset();

      console.error('[QueueStatus] 대기열 취소 중 오류:', err);
      setMatchFound(false);
    } finally {
      setIsLeavingQueue(false);
    }
  }, [isLeavingQueue, setQueueStatus]);

  // 네비게이션 함수들
  const goToMatchmaking = useCallback(() => {
    navigate('/matchmaking');
  }, [navigate]);

  const goToMatchDetails = useCallback(() => {
    navigate('/match-details');
  }, [navigate]);

  // 최소화 토글
  const toggleMinimize = useCallback(() => {
    setIsMinimized(prev => !prev);
  }, []);

  // 매치 찾음 알림 렌더링
  const renderMatchFoundNotification = useCallback(() => {
    return (
      <div className={`queue-status-match-found ${matchFound ? 'visible' : ''}`}>
        <div className="queue-status-match-found-icon"></div>
        <div className="queue-status-match-found-title">매치 찾음!</div>
        <div className="queue-status-match-found-message">
          10명의 플레이어가 모였습니다. 매치 정보 페이지로 이동하세요.
        </div>
        <button
          className="queue-status-match-found-button"
          onClick={goToMatchDetails}
        >
          매치 정보 보기
        </button>
      </div>
    );
  }, [matchFound, goToMatchDetails]);

  // 최소화된 UI 렌더링
  const renderMinimizedUI = useCallback(() => {
    const timeString = formatTime(queueTime);
    const displayPlayers = queueStatusState.currentPlayers;
    const progressPercentage = Math.min(100, (displayPlayers / queueStatusState.requiredPlayers) * 100);

    return (
      <div
        className="queue-status-minimized-content"
        onClick={toggleMinimize}
        title="클릭하여 확장"
        role="button"
        aria-label="대기열 상태 확장하기"
      >
        <div className="queue-status-minimized-info">
          <span className="queue-status-minimized-time">{timeString}</span>
          <span className="queue-status-minimized-players">
            {displayPlayers}/{queueStatusState.requiredPlayers}
          </span>
        </div>
        <div className="queue-status-minimized-progress">
          <div
            className="queue-status-minimized-progress-bar"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>
    );
  }, [queueTime, queueStatusState, toggleMinimize]);

  // 대기열 UI 렌더링
  const renderQueueUI = useCallback(() => {
    const timeString = formatTime(queueTime);

    if (isMinimized) {
      return renderMinimizedUI();
    }

    // 시뮬레이션 중인지 확인
    const simulationRunning = localStorage.getItem('simulatedPlayers') !== null &&
                             localStorage.getItem('simulationStartTime') !== null;

    // 대기열 진행률 계산
    let displayPlayers = queueStatusState.currentPlayers;

    if (simulationRunning) {
      const storedPlayers = parseInt(localStorage.getItem('simulatedPlayers') || '1');
      const startTime = parseInt(localStorage.getItem('simulationStartTime') || Date.now().toString());
      const timeElapsed = Math.floor((Date.now() - startTime) / 1000);
      const expectedPlayers = Math.min(10, 1 + Math.floor(timeElapsed / 0.5));

      displayPlayers = Math.max(displayPlayers, storedPlayers, expectedPlayers);
    }

    const progressPercentage = Math.min(100, (displayPlayers / queueStatusState.requiredPlayers) * 100);

    return (
      <div className={`queue-status-content ${matchFound ? 'match-found' : ''}`}>
        <button
          className="queue-status-minimize-btn"
          onClick={toggleMinimize}
          title="최소화"
          aria-label="대기열 상태 최소화"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <div className="queue-status-title" role="status">
          대기열 상태
        </div>

        <div className="queue-status-time" aria-live="polite" aria-atomic="true">
          {timeString}
        </div>

        <div className="queue-status-info">
          <div className="queue-status-info-numbers">
            <div className="queue-status-info-player-count">
              <span>{displayPlayers}</span>
              <span className="queue-status-info-slash">/</span>
              <span>{queueStatusState.requiredPlayers}</span>
            </div>
            <div className="queue-status-info-label">플레이어</div>
          </div>

          <div className="queue-status-info-progress" role="progressbar" aria-valuenow={displayPlayers} aria-valuemin="0" aria-valuemax={queueStatusState.requiredPlayers}>
            <div
              className="queue-status-info-progress-bar"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        <div className="queue-status-actions">
          <button
            className="queue-status-view-btn"
            onClick={goToMatchmaking}
            aria-label="대기열 상태 자세히 보기"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            보기
          </button>
          <button
            className="queue-status-cancel-btn"
            onClick={leaveQueue}
            disabled={isLeavingQueue}
            aria-label="대기열 취소"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
            {isLeavingQueue ? '처리 중...' : '취소'}
          </button>
        </div>

        {renderMatchFoundNotification()}
      </div>
    );
  }, [queueTime, isMinimized, queueStatusState, goToMatchmaking, leaveQueue, isLeavingQueue, renderMinimizedUI, matchFound, renderMatchFoundNotification, toggleMinimize]);

  // 매치 상태 UI 렌더링
  const renderMatchUI = useCallback(() => {
    if (isMinimized) {
      return (
        <div
          className="queue-status-minimized-content"
          onClick={toggleMinimize}
          title="클릭하여 확장"
          role="button"
          aria-label="매치 상태 확장하기"
        >
          <div className="queue-status-minimized-info">
            <span className="queue-status-minimized-match">매치 진행 중</span>
            <span className="queue-status-minimized-id">#{currentMatchId?.slice(-6) || 'Unknown'}</span>
          </div>
        </div>
      );
    }

    return (
      <div className="queue-status-content match-in-progress">
        <button
          className="queue-status-minimize-btn"
          onClick={toggleMinimize}
          title="최소화"
          aria-label="매치 상태 최소화"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <div className="queue-status-title" role="status">
          매치 진행 중
        </div>

        <div className="queue-status-match-id">
          매치 ID: #{currentMatchId?.slice(-6) || 'Unknown'}
        </div>

        <div className="queue-status-actions">
          <button
            className="queue-status-view-btn"
            onClick={goToMatchDetails}
            aria-label="매치 정보 보기"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            매치 정보
          </button>
        </div>
      </div>
    );
  }, [isMinimized, currentMatchId, goToMatchDetails, toggleMinimize]);

  // 컴포넌트가 표시되어야 하는지 확인
  if (!isAuthenticated || (!inQueue && !matchInProgress)) {
    return null;
  }

  // 매치메이킹 페이지에서는 숨김
  if (location.pathname === '/matchmaking' || location.pathname === '/match-details') {
    return null;
  }

  return (
    <div className={`queue-status ${isMinimized ? 'minimized' : ''}`}>
      {matchInProgress ? renderMatchUI() : renderQueueUI()}
    </div>
  );
};

export default QueueStatus;
