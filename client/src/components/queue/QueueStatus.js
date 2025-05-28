import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './QueueStatus.css';

// 대기 시간을 전역적으로 관리하기 위한 상태 객체
const queueTimeState = {
  time: 0,
  listeners: new Set(),
  serverStartTime: null, // 서버에서 받은 대기 시작 시간
  serverWaitTime: 0, // 서버에서 받은 대기 시간
  serverTimeOffset: 0, // 서버와 클라이언트 시간 차이
  intervalId: null,
  isNotifying: false,
  
  // 서버 시간 기준으로 대기 시간 설정
  setServerTime(serverWaitTime, serverJoinedAt, serverTime) {
    // 이전 타이머 정리
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    if (serverWaitTime === 0 && !serverJoinedAt) {
      // 대기열에 없는 상태
      this.reset();
      return;
    }
    
    // 서버 시간과 클라이언트 시간 차이 계산
    const clientTime = Date.now();
    const serverTimeMs = new Date(serverTime).getTime();
    this.serverTimeOffset = serverTimeMs - clientTime;
    
    // 서버에서 받은 정보 저장
    this.serverWaitTime = serverWaitTime;
    this.serverStartTime = serverJoinedAt ? new Date(serverJoinedAt) : null;
    this.time = serverWaitTime;
    
    console.log('[QueueTimeState] 서버 시간 동기화:', {
      serverWaitTime,
      serverJoinedAt,
      serverTime,
      clientTime: new Date(clientTime).toISOString(),
      timeOffset: this.serverTimeOffset
    });
    
    // 타이머 시작
    this.intervalId = setInterval(() => {
      if (this.serverStartTime) {
        // 서버 시간 기준으로 경과 시간 계산
        const adjustedClientTime = Date.now() + this.serverTimeOffset;
        const elapsedMs = adjustedClientTime - this.serverStartTime.getTime();
        const elapsedSeconds = Math.floor(elapsedMs / 1000);
        
        if (this.time !== elapsedSeconds && elapsedSeconds >= 0) {
          this.time = elapsedSeconds;
          this.notify();
        }
      }
    }, 1000);
    
    // 초기 알림
    this.notify();
  },
  
  // 대기 시간 시작 (레거시 지원)
  start() {
    // 서버 동기화가 없는 경우에만 클라이언트 타이머 시작
    if (this.serverStartTime) {
      return; // 서버 동기화가 있으면 무시
    }
    
    // 이미 시작된 경우 중복 실행 방지
    if (this.intervalId) {
      return;
    }
    
    this.startTime = Date.now();
    this.time = 0;
    
    this.intervalId = setInterval(() => {
      if (this.startTime) {
        // 시작 시간 기준으로 초 단위 계산
        const elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);
        if (this.time !== elapsedSeconds) {
          this.time = elapsedSeconds;
          this.notify();
        }
      }
    }, 1000);
    
    // 초기 시간 알림은 setInterval 바깥에서 한 번만 호출
    this.notify();
  },
  
  // 대기 시간 초기화
  reset() {
    // 타이머가 이미 중지된 상태면 불필요한 작업 방지
    if (this.intervalId === null && this.startTime === null && this.serverStartTime === null && this.time === 0) {
      return;
    }
    
    // 타이머 중지
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    // 상태 초기화
    const prevTime = this.time;
    this.time = 0;
    this.startTime = null;
    this.serverStartTime = null;
    this.serverWaitTime = 0;
    this.serverTimeOffset = 0;
    
    // 실제로 상태가 변경된 경우에만 notify 호출
    if (prevTime !== 0) {
      // 다음 렌더 사이클에서 알림 처리하여 상태 업데이트 충돌 방지
      setTimeout(() => {
        this.notify();
      }, 0);
    }
  },
  
  // 수동으로 시간 설정 (초 단위) - 레거시 지원
  setTime(seconds) {
    // 서버 동기화가 있는 경우 무시
    if (this.serverStartTime) {
      return;
    }
    
    // 이미 초기화 상태에서 0으로 설정하려는 경우 무시
    if (seconds === 0 && this.time === 0 && !this.startTime) {
      return;
    }
    
    // 0으로 설정하는 경우 reset 호출
    if (seconds === 0) {
      this.reset();
      return;
    }
    
    // 이미 같은 값이면 상태 업데이트 하지 않음
    if (this.time === seconds) {
      return;
    }
    
    // 시작되지 않은 상태면 타이머 시작
    if (!this.startTime) {
      this.startTime = Date.now() - (seconds * 1000);
      if (!this.intervalId) {
        // 타이머만 시작하고 별도로 시간 설정
        this.intervalId = setInterval(() => {
          if (this.startTime) {
            const elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);
            if (this.time !== elapsedSeconds) {
              this.time = elapsedSeconds;
              this.notify();
            }
          }
        }, 1000);
      }
    }
    
    // 시간 설정
    this.time = seconds;
    
    // 다음 렌더 사이클에서 알림 처리하여 상태 업데이트 충돌 방지
    setTimeout(() => {
      this.notify();
    }, 0);
  },
  
  // 리스너 추가
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  },
  
  // 모든 리스너에게 변경 알림 - 무한 루프 방지 로직 추가
  notify() {
    // 이미 알림 중이면 중첩 호출 방지
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
      // 항상 알림 상태 초기화
      this.isNotifying = false;
    }
  }
};

const QueueStatus = () => {
  const { 
    inQueue, 
    setQueueStatus, 
    isAuthenticated,
    matchInProgress,
    currentMatchId,
    setMatchProgress,
    clearMatchInfo
  } = useAuthStore();
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // 전역 queueTimeState를 window 객체에 노출
  useEffect(() => {
    window.queueTimeState = queueTimeState;
    if (window.setGlobalQueueTimeState) {
      window.setGlobalQueueTimeState(queueTimeState);
    }
    
    return () => {
      // 컴포넌트 언마운트 시 정리
      if (window.queueTimeState === queueTimeState) {
        window.queueTimeState = null;
      }
    };
  }, []);
  
  // useRef를 사용하여 불필요한 리렌더링 방지
  const queueStatusRef = useRef({
    currentPlayers: 0,
    requiredPlayers: 10,
    estimatedTime: '00:00'
  });
  const [queueStatusState, setQueueState] = useState(queueStatusRef.current);
  const [isVisible, setIsVisible] = useState(false);
  const [isLeavingQueue, setIsLeavingQueue] = useState(false);
  const [queueTime, setQueueTime] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  // 매치 찾음 상태 추가
  const [matchFound, setMatchFound] = useState(false);
  
  // 타이머 관련 ref
  const timerRef = useRef(null);
  const apiCallCounterRef = useRef(0);
  
  // 상태 관리 - useMemo를 사용하여 계산 최적화
  const isMatchActive = useMemo(() => matchInProgress && currentMatchId, [matchInProgress, currentMatchId]);
  
  // 이전 값 추적을 위한 Ref
  const prevQueueStateRef = useRef({ inQueue, matchInProgress });

  // 애니메이션 타이밍 최적화
  const animationRef = useRef(null);

  // 시간 포맷팅 함수 (초를 MM:SS 형식으로 변환)
  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // 최소화 토글 함수
  const toggleMinimize = useCallback(() => {
    setIsMinimized(prev => !prev);
  }, []);

  // 매치메이킹 페이지로 이동하는 함수
  const goToMatchmaking = useCallback(async () => {
    try {
      // 매치메이킹 페이지로 이동하기 전에 서버 상태 동기화
      console.log('[QueueStatus] 매치메이킹 페이지 이동 전 서버 상태 동기화');
      const res = await axios.get('/api/matchmaking/status');
      
      // 서버에서 받은 대기 시간 정보로 동기화
      if (res.data.inQueue && res.data.waitTime !== undefined) {
        console.log('[QueueStatus] 매치메이킹 이동 시 서버 대기 시간 동기화:', {
          waitTime: res.data.waitTime,
          joinedAt: res.data.joinedAt,
          serverTime: res.data.serverTime
        });
        
        // 서버 시간 기준으로 대기 시간 설정
        queueTimeState.setServerTime(
          res.data.waitTime,
          res.data.joinedAt,
          res.data.serverTime
        );
      }
    } catch (error) {
      console.error('[QueueStatus] 매치메이킹 이동 전 상태 동기화 오류:', error);
      // 오류가 발생해도 페이지 이동은 계속 진행
    }
    
    // 매치메이킹 페이지로 이동
    navigate('/matchmaking');
  }, [navigate]);

  // 매치 상세 정보 보기 함수
  const viewMatchDetails = useCallback(() => {
    navigate('/match-details');
  }, [navigate]);

  // 매치 취소 함수
  const cancelMatch = useCallback(async () => {
    try {
      // 매치 취소 API 호출
      await axios.post('/api/matches/cancel', { matchId: currentMatchId });
      
      // 매치 상태 초기화
      localStorage.removeItem('matchInProgress');
      localStorage.removeItem('currentMatchId');
      
      // 전역 상태 업데이트
      localStorage.removeItem('inQueue');
      setQueueStatus(false);
      queueTimeState.reset();
      
    } catch (err) {
      console.error('[QueueStatus] 매치 취소 중 오류:', err);
      
      // 오류가 발생해도 UI는 업데이트
      localStorage.removeItem('matchInProgress');
      localStorage.removeItem('currentMatchId');
      setQueueStatus(false);
      queueTimeState.reset();
    }
  }, [currentMatchId, setQueueStatus]);

  // 최소화된 UI 렌더링 함수
  const renderMinimizedUI = useCallback(() => {
    return (
      <div 
        className="queue-status-minimized-content" 
        onClick={toggleMinimize}
        title="클릭하여 확장"
        role="button"
        aria-label="대기열 상태 확장하기"
        tabIndex="0"
      >
        <div className="queue-status-mini-icon"></div>
        <div className="queue-status-mini-time">{formatTime(queueTime)}</div>
      </div>
    );
  }, [queueTime, toggleMinimize, formatTime]);
  
  // 전역 큐 타이머에 구독
  useEffect(() => {
    // 컴포넌트 마운트 상태 추적
    let isMounted = true;
    
    // 리스너 콜백 함수
    const updateQueueTime = (time) => {
      if (isMounted) {
        setQueueTime(time);
      }
    };
    
    // 구독
    const unsubscribe = queueTimeState.subscribe(updateQueueTime);
    
    return () => {
      // 컴포넌트 언마운트 시 마운트 상태 업데이트
      isMounted = false;
      // 구독 해제
      unsubscribe();
    };
  }, []);
  
  // 대기열 상태에 따라 타이머 시작/중지
  useEffect(() => {
    // 이전 타이머 정리
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    if (inQueue) {
      // 이미 시작된 타이머가 있으면 그대로 사용, 없으면 시작
      if (!queueTimeState.serverStartTime) {
        // 동일한 렌더 사이클에서 여러 상태 업데이트가 충돌하지 않도록 지연 시작
        timerRef.current = setTimeout(() => {
          queueTimeState.start();
        }, 50);
      }
    } else if (!inQueue && !matchInProgress) {
      // 대기열에서 나가고 매치도 진행 중이 아니면 타이머 초기화
      timerRef.current = setTimeout(() => {
        queueTimeState.reset();
      }, 50);
    }
    
    // 이전 상태와 현재 상태를 저장하여 변경 사항 추적
    prevQueueStateRef.current = { inQueue, matchInProgress };
    
    // 클린업 함수에서 타임아웃 정리
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [inQueue, matchInProgress]);
  
  // 대기열 또는 매치 상태가 변경되면 표시 여부 업데이트 (효율적으로 통합)
  useEffect(() => {
    // 상태 변경을 감지하기 위한 플래그
    const { inQueue: prevInQueue, matchInProgress: prevMatchInProgress } = prevQueueStateRef.current;
    const stateChanged = prevInQueue !== inQueue || prevMatchInProgress !== matchInProgress;
    
    // 로그인 상태가 아니거나 특정 페이지에 있으면 팝업 숨김
    if (!isAuthenticated || location.pathname === '/matchmaking' || location.pathname === '/match-details') {
      if (isVisible) {
        setIsVisible(false);
      }
      return;
    }

    // 시뮬레이션 상태 확인
    const simulationRunning = localStorage.getItem('simulatedPlayers') !== null && 
                             localStorage.getItem('simulationStartTime') !== null;
    
    // 상태 변경이 있을 때만 가시성 업데이트 (최적화)
    const newVisibleState = (inQueue || isMatchActive || simulationRunning) && isAuthenticated;
    
    if (isVisible !== newVisibleState) {
      // 애니메이션 타이밍을 최적화하기 위한 requestAnimationFrame
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      animationRef.current = requestAnimationFrame(() => {
        setIsVisible(newVisibleState);
      });
    }
    
    // 상태 변경을 추적
    prevQueueStateRef.current = { inQueue, matchInProgress };
    
    // 컴포넌트 언마운트 시 애니메이션 프레임 취소
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isAuthenticated, inQueue, isMatchActive, location.pathname, isVisible]);
  
  // 대기열 상태 가져오기 - useCallback 최적화
  const fetchQueueStatus = useCallback(async () => {
    if (!isAuthenticated || !inQueue || isMatchActive) return;
    
    // API 호출 빈도 제한
    apiCallCounterRef.current += 1;
    if (apiCallCounterRef.current % 2 !== 0) return; // 2번마다 실제 API 호출
    
    // 시뮬레이션 중이면 API 호출하지 않고 로컬 상태만 확인
    const simulationRunning = localStorage.getItem('simulatedPlayers') !== null && 
                             localStorage.getItem('simulationStartTime') !== null;
    if (simulationRunning) {
      console.log('[QueueStatus] 시뮬레이션 감지됨, API 호출 생략');
      
      // 시뮬레이션 시작 시간 가져오기
      const startTime = parseInt(localStorage.getItem('simulationStartTime') || Date.now().toString());
      
      // 시뮬레이션 시간 경과 계산
      const timeElapsed = Math.floor((Date.now() - startTime) / 1000);
      
      // 시간 경과에 따른 플레이어 수 계산 (0.5초에 1명씩 증가, 최대 10명)
      const expectedPlayers = Math.min(10, 1 + Math.floor(timeElapsed / 0.5));
      
      // localStorage에 저장된 플레이어 수 확인
      const storedPlayers = parseInt(localStorage.getItem('simulatedPlayers') || '1');
      
      // 둘 중 더 큰 값 사용
      const currentPlayers = Math.max(expectedPlayers, storedPlayers);
      
      // 플레이어 수 업데이트 (시뮬레이션 진행 상태 반영)
      localStorage.setItem('simulatedPlayers', currentPlayers.toString());
      
      // QueueStatus 컴포넌트 내부 상태 업데이트
      queueStatusRef.current = {
        currentPlayers: currentPlayers,
        requiredPlayers: 10,
        estimatedTime: currentPlayers >= 10 ? '00:00' : '00:15'
      };
      setQueueState(queueStatusRef.current);
      
      // 시뮬레이션에서는 클라이언트 기준 시간 사용 (서버 동기화 없음)
      if (!queueTimeState.serverStartTime) {
        queueTimeState.setTime(timeElapsed);
      }
      
      // 플레이어가 10명 모이면 매치 찾음 처리 및 알림 표시
      if (currentPlayers >= 10) {
        console.log('[QueueStatus] 시뮬레이션 중 10명 모임 - 매치 찾음 알림 표시');
        
        // 매치 찾았을 때 로컬 스토리지 업데이트
        localStorage.setItem('inQueue', 'false');
        localStorage.setItem('matchInProgress', 'true');
        
        // 상태 업데이트를 동기적으로 처리하여 불필요한 지연 방지
        setQueueStatus(false);
        
        // 저장된 매치 정보 확인
        const savedMatchInfo = localStorage.getItem('lastMatchInfo');
        if (savedMatchInfo) {
          try {
            // 매치 정보가 있으면 매치 진행 중 상태로 변경
            const matchInfo = JSON.parse(savedMatchInfo);
            
            // 대기열 상태 초기화
            localStorage.removeItem('simulatedPlayers');
            localStorage.removeItem('simulationStartTime');
            
            // 시뮬레이션 중단
            window.isSimulationRunning = false;
            
            // 매치 진행 상태로 업데이트
            localStorage.setItem('matchInProgress', 'true');
            localStorage.setItem('currentMatchId', matchInfo.matchId);
            
            // 전역 상태 업데이트
            setMatchProgress(true, matchInfo.matchId);
            
            // 매치 찾음 알림 표시
            setMatchFound(true);
          } catch (err) {
            console.error('[QueueStatus] 매치 정보 파싱 오류:', err);
          }
        } else {
          console.error('[QueueStatus] 10명 모였으나 매치 정보가 없음');
        }
      }
      
      return;
    }

    try {
      const res = await axios.get('/api/matchmaking/status');
      
      // ref에 먼저 저장하고 상태 업데이트 (불필요한 리렌더링 방지)
      queueStatusRef.current = res.data;
      setQueueState(res.data);
      
      // 서버에서 받은 대기 시간 정보로 동기화
      if (res.data.inQueue && res.data.waitTime !== undefined) {
        console.log('[QueueStatus] 서버 대기 시간 동기화:', {
          waitTime: res.data.waitTime,
          joinedAt: res.data.joinedAt,
          serverTime: res.data.serverTime
        });
        
        // 서버 시간 기준으로 대기 시간 설정
        queueTimeState.setServerTime(
          res.data.waitTime,
          res.data.joinedAt,
          res.data.serverTime
        );
      } else if (!res.data.inQueue) {
        // 대기열에 없으면 타이머 초기화
        queueTimeState.reset();
      }
      
      // 10명이 모이면 매치 찾음 처리 -> 대기열 해제
      if (res.data.currentPlayers === res.data.requiredPlayers) {
        console.log('[QueueStatus] 10명 모임 - 매치 찾음 알림 표시');
        
        // 매치 찾은 경우 로컬 저장소와 전역 상태 업데이트
        localStorage.setItem('inQueue', 'false');
        localStorage.setItem('matchInProgress', 'true');
        
        // 상태 업데이트를 동기적으로 처리
        setQueueStatus(false);
        
        // 저장된 매치 정보 확인
        const savedMatchInfo = localStorage.getItem('lastMatchInfo');
        if (savedMatchInfo) {
          try {
            // 매치 정보가 있으면 매치 진행 중 상태로 변경
            const matchInfo = JSON.parse(savedMatchInfo);
            
            // 매치 진행 상태로 업데이트
            localStorage.setItem('currentMatchId', matchInfo.matchId);
            
            // 전역 상태 업데이트
            setMatchProgress(true, matchInfo.matchId);
            
            // 매치 찾음 알림 표시
            setMatchFound(true);
          } catch (err) {
            console.error('[QueueStatus] 매치 정보 파싱 오류:', err);
          }
        } else {
          console.error('[QueueStatus] 10명 모였으나 매치 정보가 없음');
        }
      }
    } catch (err) {
      console.error('[QueueStatus] 대기열 상태 가져오기 오류:', err);
      
      // 인증 오류(401)인 경우 대기열 상태 초기화
      if (err.response && err.response.status === 401) {
        localStorage.removeItem('inQueue');
        setQueueStatus(false);
        queueTimeState.reset();
      }
    }
  }, [isAuthenticated, inQueue, isMatchActive, setQueueStatus, setMatchProgress]);

  // 매치 정보 페이지로 이동하는 함수
  const goToMatchDetails = useCallback(() => {
    // 리디렉션 플래그 설정
    localStorage.setItem('redirectedToMatch', 'true');
    
    // 매치 정보 페이지로 이동
    navigate('/match-details');
    
    // 매치 찾음 알림 숨김
    setMatchFound(false);
  }, [navigate]);

  // useEffect 대기열 상태 가져오기 부분 추가
  useEffect(() => {
    let interval;
    
    if (isVisible && isAuthenticated && inQueue && !isMatchActive) {
      // 초기 데이터 로드
      fetchQueueStatus();
      
      // 5초마다 상태 업데이트 (3초에서 5초로 변경하여 서버 부하 감소)
      interval = setInterval(() => {
        fetchQueueStatus();
      }, 5000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isVisible, isAuthenticated, inQueue, isMatchActive, fetchQueueStatus]);
  
  // 대기열 취소 - useCallback으로 최적화
  const leaveQueue = useCallback(async () => {
    // 이미 처리 중이면 중복 요청 방지
    if (isLeavingQueue) return;
    
    try {
      setIsLeavingQueue(true);
      
      // 시뮬레이션 모드인 경우
      if (window.isSimulationRunning || localStorage.getItem('simulatedPlayers')) {
        // 시뮬레이션 관련 로컬 스토리지 항목 모두 제거
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
      
      // 오류 로깅만 남기고 토스트 메시지 제거
      console.error('[QueueStatus] 대기열 취소 중 오류:', err);
      
      // 매치 찾음 상태 초기화
      setMatchFound(false);
    } finally {
      // 처리 중 상태 초기화
      setIsLeavingQueue(false);
    }
  }, [isLeavingQueue, setQueueStatus]);
  
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
  
  // 대기열 UI 렌더링 (메모이제이션)
  const renderQueueUI = useCallback(() => {
    const timeString = formatTime(queueTime);
    
    if (isMinimized) {
      return renderMinimizedUI();
    }
    
    // 시뮬레이션 중인지 확인
    const simulationRunning = localStorage.getItem('simulatedPlayers') !== null && 
                             localStorage.getItem('simulationStartTime') !== null;
    
    // 대기열 진행률 계산 (시뮬레이션 중일 때도 고려)
    let displayPlayers = queueStatusState.currentPlayers;
    
    // 시뮬레이션 중이면 localStorage 값과 시간 기반 값 중 더 큰 값 사용
    if (simulationRunning) {
      const storedPlayers = parseInt(localStorage.getItem('simulatedPlayers') || '1');
      
      // 시간 기반 계산
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
          {/* 진행률 표시 */}
          <div className="queue-status-info-numbers">
            <div className="queue-status-info-player-count">
              <span>{displayPlayers}</span>
              <span className="queue-status-info-slash">/</span>
              <span>{queueStatusState.requiredPlayers}</span>
            </div>
            <div className="queue-status-info-label">플레이어</div>
          </div>
          
          {/* 진행 상태 바 */}
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
        
        {/* 매치 찾음 알림 추가 */}
        {renderMatchFoundNotification()}
      </div>
    );
  }, [queueTime, isMinimized, queueStatusState, goToMatchmaking, leaveQueue, isLeavingQueue, formatTime, renderMinimizedUI, matchFound, renderMatchFoundNotification]);

  // 매치 상태 UI 렌더링 - 메모이제이션 적용
  const renderMatchUI = useCallback(() => {
    if (isMinimized) {
      return (
        <div 
          className="queue-status-minimized-content" 
          onClick={toggleMinimize}
          title="클릭하여 확장"
          role="button"
          aria-label="매치 상태 확장하기"
          tabIndex="0"
        >
          <div className="queue-status-mini-icon" style={{ backgroundColor: '#10b981' }}></div>
          <div className="queue-status-mini-time" style={{ color: '#10b981' }}>진행중</div>
        </div>
      );
    }
    
    return (
      <div className="queue-status-content">
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
        
        <div className="queue-status-title" style={{ color: '#10b981' }} role="status">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }} aria-hidden="true">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          매치 진행 중
        </div>
        
        <div className="queue-status-info" style={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}>
          <div className="queue-status-info-numbers">
            <div className="queue-status-info-label">매치 ID</div>
          </div>
          
          <div className="queue-status-match-id" aria-live="polite">
            {currentMatchId ? currentMatchId : 'N/A'}
          </div>
          
          <div className="queue-status-info-progress">
            <div 
              className="queue-status-info-progress-bar"
              style={{ 
                width: '100%', 
                background: 'linear-gradient(90deg, #10b981, #0d9488)' 
              }}
            ></div>
          </div>
        </div>
        
        <div className="queue-status-actions">
          <button 
            className="queue-status-view-btn"
            onClick={viewMatchDetails}
            style={{ borderColor: 'rgba(16, 185, 129, 0.3)', color: '#10b981' }}
            aria-label="매치 세부 정보 보기"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            매치 정보
          </button>
          <button 
            className="queue-status-cancel-btn"
            onClick={cancelMatch}
            aria-label="매치 취소"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
            취소
          </button>
        </div>
      </div>
    );
  }, [isMinimized, toggleMinimize, currentMatchId, viewMatchDetails, cancelMatch]);

  // 컴포넌트 마운트 시 서버 상태 확인 및 동기화
  useEffect(() => {
    const initializeQueueStatus = async () => {
      if (!isAuthenticated) return;
      
      try {
        console.log('[QueueStatus] 컴포넌트 초기화 - 서버 상태 확인');
        const res = await axios.get('/api/matchmaking/status');
        
        // 서버 상태로 로컬 상태 업데이트
        queueStatusRef.current = res.data;
        setQueueState(res.data);
        
        // 서버에서 대기열에 있다고 하면 로컬 상태도 업데이트
        if (res.data.inQueue && !inQueue) {
          console.log('[QueueStatus] 서버에서 대기열 상태 감지, 로컬 상태 동기화');
          setQueueStatus(true);
          localStorage.setItem('inQueue', 'true');
        } else if (!res.data.inQueue && inQueue) {
          console.log('[QueueStatus] 서버에서 대기열 해제 상태 감지, 로컬 상태 동기화');
          setQueueStatus(false);
          localStorage.removeItem('inQueue');
        }
        
        // 서버에서 받은 대기 시간 정보로 동기화
        if (res.data.inQueue && res.data.waitTime !== undefined) {
          console.log('[QueueStatus] 초기화 시 서버 대기 시간 동기화:', {
            waitTime: res.data.waitTime,
            joinedAt: res.data.joinedAt,
            serverTime: res.data.serverTime
          });
          
          // 서버 시간 기준으로 대기 시간 설정
          queueTimeState.setServerTime(
            res.data.waitTime,
            res.data.joinedAt,
            res.data.serverTime
          );
        } else if (!res.data.inQueue) {
          // 대기열에 없으면 타이머 초기화
          queueTimeState.reset();
        }
        
      } catch (error) {
        console.error('[QueueStatus] 초기 상태 확인 중 오류:', error);
      }
    };
    
    // 컴포넌트 마운트 시 한 번만 실행
    initializeQueueStatus();
  }, [isAuthenticated]); // isAuthenticated가 변경될 때만 재실행
  
  // 대기열에 없거나 매치 중이 아니거나 로그인 상태가 아니거나 매치메이킹 페이지인 경우 아무것도 보여주지 않음
  if (!isVisible || !isAuthenticated) return null;

  return (
    <div 
      className={`queue-status-popup ${isVisible ? 'active' : ''} ${isMinimized ? 'minimized' : ''} ${matchInProgress ? 'match-active' : ''}`}
      style={{ 
        willChange: 'transform, opacity',
        visibility: isVisible ? 'visible' : 'hidden', // 렌더링 최적화
        transitionDelay: isVisible ? '0s' : '0.15s' // 사라질 때 지연으로 깜박임 방지
      }}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {inQueue ? renderQueueUI() : matchInProgress ? renderMatchUI() : null}
    </div>
  );
};

export default React.memo(QueueStatus); // React.memo로 불필요한 리렌더링 방지