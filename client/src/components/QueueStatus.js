import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

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

  start() {
    if (this.serverStartTime || this.intervalId) return;

    this.startTime = Date.now();
    this.time = 0;

    this.intervalId = setInterval(() => {
      if (this.startTime) {
        const elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);
        if (this.time !== elapsedSeconds) {
          this.time = elapsedSeconds;
          this.notify();
        }
      }
    }, 1000);

    this.notify();
  },

  reset() {
    if (this.intervalId === null && this.startTime === null && this.serverStartTime === null && this.time === 0) {
      return;
    }

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

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  },

  notify() {
    if (this.isNotifying) return;

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

const QueueStatus = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    inQueue,
    matchInProgress,
    currentMatchId,
    matchInfo,
    setQueueStatus,
    setMatchProgress,
    setMatchInfo,
    clearMatchInfo,
    user
  } = useAuthStore();

  const [queueTime, setQueueTime] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showMatchDetails, setShowMatchDetails] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 폴링을 위한 상태
  const pollIntervalRef = useRef(null);
  const lastPollTime = useRef(0);

  // 시간 포맷팅 함수
  const formatTime = useCallback((seconds) => {
    if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) {
      return '00:00';
    }

    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    if (isNaN(mins) || isNaN(secs)) {
      return '00:00';
    }

    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // 대기열 상태 폴링 (Vercel 환경용)
  const pollQueueStatus = useCallback(async () => {
    if (!user || Date.now() - lastPollTime.current < 2000) return;

    lastPollTime.current = Date.now();

    try {
      const response = await axios.get('/api/matchmaking/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        timeout: 10000
      });

      if (response.data.success) {
        const {
          inQueue: serverInQueue,
          matchInProgress: serverMatchInProgress,
          matchInfo: serverMatchInfo,
          queueTime: serverQueueTime,
          joinedAt: serverJoinedAt,
          serverTime
        } = response.data;

        // 서버 상태와 클라이언트 상태 동기화
        if (serverInQueue !== inQueue) {
          setQueueStatus(serverInQueue);

          if (serverInQueue) {
            // 서버 시간 기준으로 대기 시간 설정
            queueTimeState.setServerTime(serverQueueTime || 0, serverJoinedAt, serverTime);
          } else {
            queueTimeState.reset();
          }
        }

        if (serverMatchInProgress !== matchInProgress) {
          setMatchProgress(serverMatchInProgress, serverMatchInfo?.matchId);

          if (serverMatchInfo) {
            setMatchInfo(serverMatchInfo);
          }
        }
      }
    } catch (error) {
      console.error('대기열 상태 폴링 오류:', error);
    }
  }, [user, inQueue, matchInProgress, setQueueStatus, setMatchProgress, setMatchInfo]);

  // 폴링 시작/중지
  useEffect(() => {
    if (inQueue || matchInProgress) {
      // 즉시 한 번 실행
      pollQueueStatus();

      // 3초마다 폴링
      pollIntervalRef.current = setInterval(pollQueueStatus, 3000);
    } else {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [inQueue, matchInProgress, pollQueueStatus]);

  // 대기 시간 구독
  useEffect(() => {
    const unsubscribe = queueTimeState.subscribe(setQueueTime);
    return unsubscribe;
  }, []);

  // 표시 여부 결정
  useEffect(() => {
    const shouldShow = (inQueue || matchInProgress) && user;
    setIsVisible(shouldShow);

    if (!shouldShow) {
      setIsMinimized(false);
      setShowMatchDetails(false);
      setNotification(null);
      setError(null);
    }
  }, [inQueue, matchInProgress, user]);

  // 매치메이킹 페이지에서는 숨김 (중복 방지)
  const isMatchmakingPage = location.pathname === '/matchmaking';
  if (!isVisible || isMatchmakingPage) {
    return null;
  }

  // 대기열 취소 함수
  const handleLeaveQueue = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await axios.post('/api/matchmaking/leave', {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        timeout: 10000
      });

      if (response.data.success) {
        setQueueStatus(false);
        queueTimeState.reset();
        setNotification({ type: 'success', message: '대기열에서 나왔습니다.' });

        setTimeout(() => setNotification(null), 3000);
      } else {
        throw new Error(response.data.message || '대기열 취소에 실패했습니다.');
      }
    } catch (error) {
      console.error('대기열 취소 오류:', error);
      setError(error.response?.data?.message || '대기열 취소 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 매치 상세 보기
  const handleViewMatch = () => {
    if (matchInfo?.matchId) {
      navigate(`/match/${matchInfo.matchId}`);
    }
  };

  // 매치 정보 지우기
  const handleClearMatch = () => {
    setMatchProgress(false);
    clearMatchInfo();
    setShowMatchDetails(false);
  };

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ${isMinimized ? 'w-64' : 'w-80'}`}>
      {/* 알림 메시지 */}
      {notification && (
        <div className={`mb-2 p-3 rounded-lg text-sm font-medium ${
          notification.type === 'success'
            ? 'bg-green-600 text-white'
            : 'bg-red-600 text-white'
        }`}>
          {notification.message}
        </div>
      )}

      {/* 메인 상태창 */}
      <div className="bg-slate-800 border border-slate-600 rounded-lg shadow-xl overflow-hidden">
        {/* 헤더 */}
        <div className="bg-slate-700 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              matchInProgress ? 'bg-green-400 animate-pulse' :
              inQueue ? 'bg-blue-400 animate-pulse' : 'bg-gray-400'
            }`} />
            <h3 className="text-white font-medium">
              {matchInProgress ? '매치 진행 중' : inQueue ? '대기열 대기 중' : '상태'}
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            {!matchInProgress && (
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-gray-400 hover:text-white transition-colors"
                title={isMinimized ? '확장' : '최소화'}
              >
                {isMinimized ? '📈' : '📉'}
              </button>
            )}

            {matchInProgress && (
              <button
                onClick={handleClearMatch}
                className="text-gray-400 hover:text-red-400 transition-colors"
                title="매치 정보 지우기"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* 내용 */}
        {!isMinimized && (
          <div className="p-4">
            {/* 대기열 상태 */}
            {inQueue && (
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400 mb-1">
                    {formatTime(queueTime)}
                  </div>
                  <div className="text-sm text-gray-400">대기 시간</div>
                </div>

                {error && (
                  <div className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleLeaveQueue}
                  disabled={isLoading}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white py-2 px-4 rounded transition-colors"
                >
                  {isLoading ? '처리 중...' : '대기열 나가기'}
                </button>
              </div>
            )}

            {/* 매치 진행 상태 */}
            {matchInProgress && matchInfo && (
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-400 mb-1">
                    매치 찾음!
                  </div>
                  <div className="text-sm text-gray-400">
                    {matchInfo.map || '알 수 없는 맵'}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={handleViewMatch}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors"
                  >
                    매치 보기
                  </button>

                  <button
                    onClick={() => setShowMatchDetails(!showMatchDetails)}
                    className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-2 px-4 rounded transition-colors"
                  >
                    {showMatchDetails ? '간단히' : '상세히'}
                  </button>
                </div>

                {/* 매치 상세 정보 */}
                {showMatchDetails && matchInfo && (
                  <div className="mt-3 p-3 bg-slate-700 rounded text-sm">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-blue-400">블루팀:</span>
                        <div className="text-gray-300">
                          {matchInfo.blueTeam?.map(p => p.nickname).join(', ') || '정보 없음'}
                        </div>
                      </div>
                      <div>
                        <span className="text-red-400">레드팀:</span>
                        <div className="text-gray-300">
                          {matchInfo.redTeam?.map(p => p.nickname).join(', ') || '정보 없음'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 최소화 상태 */}
        {isMinimized && (
          <div className="p-3 text-center">
            <div className="text-lg font-bold text-blue-400">
              {formatTime(queueTime)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QueueStatus;
