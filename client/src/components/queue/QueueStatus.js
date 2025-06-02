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

    // 1초마다 시간 업데이트
    this.intervalId = setInterval(() => {
      if (this.serverStartTime) {
        const adjustedClientTime = Date.now() + this.serverTimeOffset;
        const elapsedMs = adjustedClientTime - this.serverStartTime.getTime();
        const elapsedSeconds = Math.floor(elapsedMs / 1000);

        if (elapsedSeconds >= 0) {
          this.time = elapsedSeconds;
          this.notify();
        }
      } else {
        // 서버 시작 시간이 없으면 단순히 시간 증가
        this.time++;
        this.notify();
      }
    }, 1000);

    this.notify();
  },

  // 로컬 타이머 시작 (서버 정보 없을 때)
  startLocalTimer() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.time = 0;
    this.intervalId = setInterval(() => {
      this.time++;
      this.notify();
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

// 전역 접근을 위해 window 객체에 노출
window.queueTimeState = queueTimeState;

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
    setMatchInfo
  } = useAuthStore();

  const navigate = useNavigate();
  const location = useLocation();

  // 컴포넌트 상태
  const [queueTime, setQueueTime] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLeavingQueue, setIsLeavingQueue] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [matchFound, setMatchFound] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [notification, setNotification] = useState(null);
  const [error, setError] = useState(null);

  // 대기열 상태 관리
  const [queueStatusState, setQueueStatusState] = useState({
    currentPlayers: 0,
    requiredPlayers: 10,
    message: '대기 중...'
  });

  // 폴링 인터벌 참조
  const pollingIntervalRef = useRef(null);
  const lastSyncTime = useRef(0);

  // 개선된 대기열 상태 폴링 함수
  const pollQueueStatus = useCallback(async () => {
    // 대기열 나가기 중이거나 인증되지 않았거나 대기열/매치 상태가 아니면 폴링 중지
    if (isLeavingQueue || !isAuthenticated || (!inQueue && !matchInProgress)) {
      console.log('[QueueStatus] 폴링 조건 불만족:', {
        isLeavingQueue,
        isAuthenticated,
        inQueue,
        matchInProgress
      });
      return;
    }

    // 너무 빈번한 요청 방지 (최소 2초 간격)
    const now = Date.now();
    if (now - lastSyncTime.current < 2000) return;
    lastSyncTime.current = now;

    try {
      const response = await axios.get('/api/matchmaking/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        timeout: 8000
      });

      // 대기열 나가기 중이면 응답 무시
      if (isLeavingQueue) {
        console.log('[QueueStatus] 대기열 나가기 중이므로 서버 응답 무시');
        return;
      }

      if (response.data) {
        const statusData = response.data;

        // 서버에서 대기열에 없다고 하면 로컬 상태도 정리
        if (!statusData.inQueue && inQueue) {
          console.log('[QueueStatus] 서버에서 대기열 없음 확인, 로컬 상태 정리');
          setQueueStatus(false);
          queueTimeState.reset();
          return;
        }

        // 서버 상태와 클라이언트 상태 동기화 (신중하게)
        if (statusData.inQueue !== inQueue) {
          console.log('[QueueStatus] 서버 대기열 상태 동기화:', statusData.inQueue);
          setQueueStatus(statusData.inQueue);
        }

        if (statusData.matchInProgress !== matchInProgress) {
          console.log('[QueueStatus] 서버 매치 상태 동기화:', statusData.matchInProgress);
          setMatchProgress(statusData.matchInProgress, statusData.matchInfo?.matchId);
        }

        // 대기열 상태 업데이트
        if (statusData.inQueue) {
          setQueueStatusState({
            currentPlayers: statusData.currentPlayers || 1,
            requiredPlayers: 10,
            message: statusData.message || '대기 중...'
          });

          // 서버 시간 동기화 - 우선순위 개선
          if (statusData.waitTime !== undefined && statusData.joinedAt && statusData.serverTime) {
            // 1순위: 완전한 서버 시간 정보가 있는 경우
            queueTimeState.setServerTime(
              statusData.waitTime,
              statusData.joinedAt,
              statusData.serverTime
            );
          } else if (statusData.queueTime !== undefined && statusData.joinedAt && statusData.serverTime) {
            // 2순위: queueTime 필드 사용
            queueTimeState.setServerTime(
              statusData.queueTime,
              statusData.joinedAt,
              statusData.serverTime
            );
          } else if (statusData.waitTime !== undefined) {
            // 3순위: waitTime만 있는 경우
            if (queueTimeState.time === 0 || Math.abs(queueTimeState.time - statusData.waitTime) > 5) {
              queueTimeState.time = statusData.waitTime;
              if (!queueTimeState.intervalId) {
                queueTimeState.startLocalTimer();
              }
              queueTimeState.notify();
            }
          } else if (statusData.queueTime !== undefined) {
            // 4순위: queueTime만 있는 경우
            if (queueTimeState.time === 0 || Math.abs(queueTimeState.time - statusData.queueTime) > 5) {
              queueTimeState.time = statusData.queueTime;
              if (!queueTimeState.intervalId) {
                queueTimeState.startLocalTimer();
              }
              queueTimeState.notify();
            }
          } else if (!queueTimeState.intervalId) {
            // 5순위: 서버 시간 정보가 없고 타이머가 시작되지 않은 경우
            console.log('[QueueStatus] 서버 시간 정보 없음, 로컬 타이머 시작');
            queueTimeState.startLocalTimer();
          }
        } else {
          // 대기열에 없으면 타이머 리셋
          queueTimeState.reset();
        }

        // 매치 정보 업데이트
        if (statusData.matchInfo && statusData.matchInProgress) {
          setMatchInfo(statusData.matchInfo);
        }
      }
    } catch (error) {
      console.error('[QueueStatus] 대기열 상태 폴링 오류:', error);

      // 네트워크 오류 시 로컬 상태 유지하되, 서버 재연결 시도
      if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED') {
        console.log('[QueueStatus] 네트워크 오류로 인한 폴링 실패, 로컬 상태 유지');
      }
    }
  }, [isAuthenticated, inQueue, matchInProgress, isLeavingQueue, setQueueStatus, setMatchProgress, setMatchInfo]);

  // 폴링 시작/중지 - 개선된 로직
  useEffect(() => {
    // 대기열 나가기 중이면 폴링 시작하지 않음
    if (isLeavingQueue) {
      console.log('[QueueStatus] 대기열 나가기 중이므로 폴링 시작하지 않음');
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    if (isAuthenticated && (inQueue || matchInProgress)) {
      // 즉시 한 번 실행
      pollQueueStatus();

      // 3초마다 폴링 (성능 개선)
      const interval = 3000;
      pollingIntervalRef.current = setInterval(pollQueueStatus, interval);
      console.log('[QueueStatus] 폴링 시작됨 (3초 간격)');
    } else {
      // 폴링 중지
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
        console.log('[QueueStatus] 폴링 중지됨 (조건 불만족)');
      }
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [isAuthenticated, inQueue, matchInProgress, isLeavingQueue, pollQueueStatus]);

  // 컴포넌트 마운트 시 즉시 상태 확인
  useEffect(() => {
    if (isAuthenticated && user) {
      // 마운트 시 즉시 상태 확인
      pollQueueStatus();
    }
  }, [isAuthenticated, user, pollQueueStatus]);

  // 대기 시간 구독
  useEffect(() => {
    const unsubscribe = queueTimeState.subscribe(setQueueTime);
    return unsubscribe;
  }, []);

  // 개선된 대기열 취소 함수
  const leaveQueue = useCallback(async () => {
    if (isLeavingQueue) {
      console.log('[QueueStatus] 이미 대기열 나가기 진행 중');
      return;
    }

    console.log('[QueueStatus] 대기열 나가기 시작');

    try {
      setIsLeavingQueue(true);

      // 1. 폴링 즉시 중지
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
        console.log('[QueueStatus] 폴링 중지됨');
      }

      // 2. 시뮬레이션 모드 정리
      if (window.isSimulationRunning || localStorage.getItem('simulatedPlayers')) {
        localStorage.removeItem('simulatedPlayers');
        localStorage.removeItem('simulationStartTime');
        window.isSimulationRunning = false;
        console.log('[QueueStatus] 시뮬레이션 모드 정리 완료');
      }

      // 3. 로컬 상태 즉시 정리 (서버 요청 전에)
      localStorage.setItem('inQueue', 'false');
      localStorage.removeItem('queueStartTime');
      queueTimeState.reset();
      setMatchFound(false);
      console.log('[QueueStatus] 로컬 상태 즉시 정리 완료');

      // 4. 서버에 대기열 취소 요청
      try {
        const response = await axios.post('/api/matchmaking/leave', {}, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          timeout: 10000
        });

        console.log('[QueueStatus] 서버 응답:', response.data);

        if (response.data && (response.data.success || response.status === 200)) {
          console.log('[QueueStatus] 서버 대기열 취소 성공');
        } else {
          console.warn('[QueueStatus] 서버 응답이 예상과 다름:', response.data);
        }
      } catch (serverError) {
        console.error('[QueueStatus] 서버 대기열 취소 요청 실패:', serverError);

        // 서버 오류가 있어도 로컬 상태는 이미 정리했으므로 계속 진행
        if (serverError.response?.status === 400) {
          console.log('[QueueStatus] 서버에서 이미 대기열에 없다고 응답 (정상)');
        }
      }

      // 5. authStore 상태 업데이트
      setQueueStatus(false);
      console.log('[QueueStatus] authStore 상태 업데이트 완료');

    } catch (err) {
      console.error('[QueueStatus] 대기열 취소 중 예상치 못한 오류:', err);
    } finally {
      // 6. 최종 상태 정리 (중복이지만 확실히 하기 위해)
      setIsLeavingQueue(false);
      localStorage.setItem('inQueue', 'false');
      localStorage.removeItem('queueStartTime');
      setQueueStatus(false);
      queueTimeState.reset();
      setMatchFound(false);
      setError(null);
      setNotification(null);

      console.log('[QueueStatus] 대기열 나가기 완료 - 모든 상태 정리됨');

      // 7. 성공 알림 표시
      setNotification({
        type: 'success',
        message: '대기열에서 나갔습니다'
      });

      // 8. 알림 자동 제거
      setTimeout(() => {
        setNotification(null);
      }, 3000);
    }
  }, [isLeavingQueue, setQueueStatus]);

  // 네비게이션 함수들
  const goToMatchmaking = useCallback(() => {
    navigate('/matchmaking');
  }, [navigate]);

  const goToMatchDetails = useCallback(() => {
    navigate('/match-details');
  }, [navigate]);

  // 매치 정보 지우기 함수
  const handleClearMatch = useCallback(() => {
    setMatchProgress(false, null);
    setMatchInfo(null);
    localStorage.removeItem('lastMatchInfo');
    localStorage.removeItem('currentMatchId');
  }, [setMatchProgress, setMatchInfo]);

  // 대기열 나가기 함수
  const handleLeaveQueue = useCallback(async () => {
    setIsLoading(true);
    try {
      await leaveQueue();
    } finally {
      setIsLoading(false);
    }
  }, [leaveQueue]);

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

  // 표시 여부 결정 - authStore 상태에만 의존
  useEffect(() => {
    const shouldShow = (inQueue || matchInProgress) && user && isAuthenticated;

    console.log('[QueueStatus] 표시 조건 확인:', {
      inQueue,
      matchInProgress,
      user: user ? { id: user.id, battleTag: user.battleTag || user.battletag } : null,
      isAuthenticated,
      shouldShow,
      currentVisible: isVisible
    });

    setIsVisible(shouldShow);

    if (!shouldShow) {
      setIsMinimized(false);
      setError(null);
      setNotification(null);
    }
  }, [inQueue, matchInProgress, user, isAuthenticated, isVisible]);

  // 매치메이킹 페이지에서는 최소화된 형태로 표시
  const isMatchmakingPage = location.pathname === '/matchmaking';
  const isMatchDetailsPage = location.pathname === '/match-details';

  // 매치메이킹 페이지나 매치 상세 페이지에서는 숨김 또는 표시되지 않을 때 숨김
  if (!isVisible || isMatchmakingPage || isMatchDetailsPage) {
    return null;
  }

  return (
    <div className={`fixed top-20 right-4 z-[200] transition-all duration-300 pointer-events-auto ${
      isMinimized ? 'w-48' : 'w-56'
    }`}>
      {/* 알림 메시지 */}
      {notification && (
        <div className={`mb-2 p-2 rounded-lg text-xs font-medium pointer-events-auto backdrop-blur-sm border transition-all duration-300 ${
          notification.type === 'success'
            ? 'bg-green-500/10 border-green-500/30 text-green-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          <div className="flex items-center gap-1.5">
            {notification.type === 'success' ? (
              <svg className="w-2.5 h-2.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-2.5 h-2.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* 메인 상태창 */}
      <div className="bg-slate-800/95 backdrop-blur-sm border border-slate-600/50 rounded-lg shadow-2xl overflow-hidden pointer-events-auto">
        {/* 헤더 - 전체 클릭 가능 */}
        <div
          className="bg-gradient-to-r from-slate-700/80 to-slate-600/80 backdrop-blur-sm px-2.5 py-2 flex items-center justify-between pointer-events-auto border-b border-slate-600/30 cursor-pointer hover:from-slate-600/80 hover:to-slate-500/80 transition-all duration-200"
          onClick={(e) => {
            console.log('[QueueStatus] 헤더 클릭됨');
            e.preventDefault();
            e.stopPropagation();
            toggleMinimize();
          }}
          role="button"
          aria-label={isMinimized ? '대기열 상태창 확장' : '대기열 상태창 최소화'}
        >
          <div className="flex items-center space-x-1.5">
            <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
              matchInProgress ? 'bg-green-400 animate-pulse shadow-lg shadow-green-400/50' :
                inQueue ? 'bg-blue-400 animate-pulse shadow-lg shadow-blue-400/50' : 'bg-gray-400'
            }`} />
            <h3 className="text-white font-semibold text-xs">
              {matchInProgress ? '매치 진행 중' :
                inQueue ? `대기열 (${queueStatusState.currentPlayers}/${queueStatusState.requiredPlayers})` : '상태'}
            </h3>
          </div>

          {/* 최소화/확장 표시 아이콘 */}
          <div className="text-slate-300 transition-transform duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${isMinimized ? 'rotate-180' : ''}`}>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </div>

        {/* 내용 */}
        {!isMinimized && (
          <div className="p-3 pointer-events-auto">
            {/* 대기열 상태 */}
            {inQueue && (
              <div className="space-y-3 pointer-events-auto">
                {/* 대기 시간 표시 */}
                <div className="text-center">
                  <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg p-2.5 border border-blue-500/20">
                    <div className="font-bold text-blue-400 mb-1 text-lg font-mono tracking-wider">
                      {formatTime(queueTime)}
                    </div>
                    <div className="text-gray-400 text-xs">대기 시간</div>
                  </div>
                </div>

                {/* 플레이어 진행률 */}
                <div className="bg-gradient-to-br from-slate-700/30 to-slate-600/20 rounded-lg p-2.5 border border-slate-600/30">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-gray-400">플레이어 모집</span>
                    <span className="text-xs text-gray-400">MMR 매칭</span>
                  </div>

                  <div className="text-center mb-1.5">
                    <div className="text-sm font-bold text-white mb-1">
                      {queueStatusState.currentPlayers}/{queueStatusState.requiredPlayers}
                    </div>
                    <div className="text-xs text-gray-300">
                      {queueStatusState.currentPlayers < 10 ? `${10 - queueStatusState.currentPlayers}명 더 필요` : '매치 준비 완료!'}
                    </div>
                  </div>

                  {/* 진행률 바 */}
                  <div className="w-full bg-slate-700/50 rounded-full h-1 mb-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${Math.min(100, (queueStatusState.currentPlayers / queueStatusState.requiredPlayers) * 100)}%` }}
                    />
                  </div>

                  {/* 플레이어 아이콘 */}
                  <div className="flex justify-center gap-0.5">
                    {Array.from({ length: 10 }, (_, i) => (
                      <div
                        key={i}
                        className={`w-2.5 h-2.5 rounded-full border transition-all duration-300 ${
                          i < queueStatusState.currentPlayers
                            ? 'bg-gradient-to-br from-blue-400 to-purple-500 border-blue-300 shadow-lg shadow-blue-500/30 scale-110'
                            : 'bg-slate-600/50 border-slate-500/50'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="text-red-400 text-xs text-center bg-red-900/20 border border-red-500/30 p-1.5 rounded-lg">
                    <div className="flex items-center justify-center gap-1">
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {error}
                    </div>
                  </div>
                )}

                {/* 액션 버튼들 */}
                <div className="flex space-x-1.5 pointer-events-auto">
                  <button
                    onClick={(e) => {
                      console.log('[QueueStatus] 상세보기 버튼 클릭됨');
                      e.preventDefault();
                      e.stopPropagation();
                      goToMatchmaking();
                    }}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-md py-1.5 px-2 text-xs font-medium transition-all duration-200 cursor-pointer pointer-events-auto group transform hover:scale-105"
                    style={{ zIndex: 1000 }}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <svg className="w-2.5 h-2.5 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      상세보기
                    </div>
                  </button>
                  <button
                    onClick={(e) => {
                      console.log('[QueueStatus] 나가기 버튼 클릭됨', { isLoading });
                      e.preventDefault();
                      e.stopPropagation();
                      if (!isLoading) {
                        handleLeaveQueue();
                      }
                    }}
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:from-red-800 disabled:to-red-900 disabled:cursor-not-allowed text-white rounded-md transition-all duration-200 cursor-pointer pointer-events-auto py-1.5 px-2 text-xs font-medium group transform hover:scale-105 disabled:hover:scale-100"
                    style={{ zIndex: 1000 }}
                  >
                    <div className="flex items-center justify-center gap-1">
                      {isLoading ? (
                        <svg className="animate-spin w-2.5 h-2.5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg className="w-2.5 h-2.5 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      {isLoading ? '처리 중...' : '나가기'}
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* 매치 진행 상태 */}
            {matchInProgress && (
              <div className="space-y-3 pointer-events-auto">
                <div className="text-center">
                  <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg p-2.5 border border-green-500/20">
                    <div className="font-bold text-green-400 mb-1 text-sm">
          매치 진행 중
                    </div>
                    <div className="text-gray-400 text-xs">매치 ID: #{currentMatchId?.slice(-6) || 'Unknown'}</div>
                  </div>
                </div>

                <div className="flex space-x-1.5 pointer-events-auto">
                  <button
                    onClick={(e) => {
                      console.log('[QueueStatus] 매치 정보 버튼 클릭됨');
                      e.preventDefault();
                      e.stopPropagation();
                      goToMatchDetails();
                    }}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-md py-1.5 px-2 text-xs font-medium transition-all duration-200 cursor-pointer pointer-events-auto group transform hover:scale-105"
                    style={{ zIndex: 1000 }}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <svg className="w-2.5 h-2.5 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
            매치 정보
                    </div>
                  </button>
                  <button
                    onClick={(e) => {
                      console.log('[QueueStatus] 정리 버튼 클릭됨');
                      e.preventDefault();
                      e.stopPropagation();
                      handleClearMatch();
                    }}
                    className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white rounded-md py-1.5 px-2 text-xs font-medium transition-all duration-200 cursor-pointer pointer-events-auto group transform hover:scale-105"
                    title="매치 정보 지우기"
                    style={{ zIndex: 1000 }}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <svg className="w-2.5 h-2.5 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      정리
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QueueStatus;
