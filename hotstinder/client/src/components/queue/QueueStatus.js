import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { toast } from 'react-toastify';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './QueueStatus.css';

// 대기 시간을 전역적으로 관리하기 위한 상태 객체
const queueTimeState = {
  time: 0,
  listeners: new Set(),
  startTime: null,
  intervalId: null, // intervalId 명시적 선언
  isNotifying: false, // 알림 중복 실행 방지 플래그 추가
  
  // 대기 시간 시작
  start() {
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
  
  // 대기 시간 초기화 - 무한 루프 방지를 위해 전면 수정
  reset() {
    // 타이머가 이미 중지된 상태면 불필요한 작업 방지
    if (this.intervalId === null && this.startTime === null && this.time === 0) {
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
    
    // 실제로 상태가 변경된 경우에만 notify 호출
    if (prevTime !== 0) {
      // 다음 렌더 사이클에서 알림 처리하여 상태 업데이트 충돌 방지
      setTimeout(() => {
        this.notify();
      }, 0);
    }
  },
  
  // 수동으로 시간 설정 (초 단위)
  setTime(seconds) {
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
    user, 
    setQueueStatus, 
    isAuthenticated,
    matchInProgress,
    currentMatchId,
    matchInfo,
    setMatchProgress,
    clearMatchInfo,
    setMatchInfo: setGlobalMatchInfo
  } = useAuthStore();
  
  const navigate = useNavigate();
  const location = useLocation(); // 현재 경로 확인을 위한 location 추가
  
  const [queueStatus, setQueueState] = useState({
    currentPlayers: 0,
    requiredPlayers: 10,
    estimatedTime: '00:00'
  });
  const [isVisible, setIsVisible] = useState(false);
  const [isLeavingQueue, setIsLeavingQueue] = useState(false);
  const [isSubmittingReplay, setIsSubmittingReplay] = useState(false);
  const [isCallingAdmin, setIsCallingAdmin] = useState(false);
  const [queueTime, setQueueTime] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  
  // 상태 관리
  const isMatchActive = matchInProgress && currentMatchId; // 매치 진행 중 여부

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
    // 조건 기반으로 clearTimeout을 위한 timeout ID 저장
    let timeoutId = null;
    
    if (inQueue) {
      // 이미 시작된 타이머가 있으면 그대로 사용, 없으면 시작
      if (!queueTimeState.startTime) {
        // 동일한 렌더 사이클에서 여러 상태 업데이트가 충돌하지 않도록 지연 시작
        timeoutId = setTimeout(() => {
          queueTimeState.start();
        }, 0);
      }
    } else if (!inQueue && !matchInProgress) {
      // 대기열에서 나가고 매치도 진행 중이 아니면 타이머 초기화
      // 여러 reset 호출로 인한 무한 루프 방지를 위해 지연 처리
      timeoutId = setTimeout(() => {
        queueTimeState.reset();
      }, 0);
    }
    
    // 클린업 함수에서 타임아웃 정리
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [inQueue, matchInProgress]);
  
  // fetchQueueStatus 함수를 useCallback으로 메모이제이션하되, navigate 의존성 제거
  const fetchQueueStatus = useCallback(async () => {
    // 로그인 상태가 아니면 API 호출하지 않음
    if (!isAuthenticated) return;
    
    // 시뮬레이션 중이면 API 호출하지 않고 로컬 상태만 확인
    const simulationRunning = localStorage.getItem('simulatedPlayers') !== null && 
                             localStorage.getItem('simulationStartTime') !== null;
    if (simulationRunning) {
      console.log('[QueueStatus] 시뮬레이션 감지됨, API 호출 생략');
      
      // 시뮬레이션 시작 시간 가져오기
      const startTime = parseInt(localStorage.getItem('simulationStartTime') || Date.now().toString());
      
      // 시뮬레이션 시간 경과 계산
      const timeElapsed = Math.floor((Date.now() - startTime) / 1000);
      
      // 시간 경과에 따른 플레이어 수 계산 (1초에 1명씩 증가, 최대 10명)
      const expectedPlayers = Math.min(10, 1 + Math.floor(timeElapsed / 1));
      
      // localStorage에 저장된 플레이어 수 확인
      const storedPlayers = parseInt(localStorage.getItem('simulatedPlayers') || '1');
      
      // 둘 중 더 큰 값 사용
      const currentPlayers = Math.max(expectedPlayers, storedPlayers);
      
      // QueueStatus 컴포넌트 내부 상태 업데이트
      setQueueState({
        currentPlayers: currentPlayers,
        requiredPlayers: 10,
        estimatedTime: currentPlayers >= 10 ? '00:00' : '00:30'
      });
      
      // 플레이어가 10명 모이면 매치 찾음 처리 및 매치 정보 페이지로 이동
      if (currentPlayers >= 10) {
        console.log('[QueueStatus] 시뮬레이션 중 10명 모임 - 매치 정보 페이지로 이동');
        
        // 매치 찾았을 때 로컬 스토리지 및 전역 상태 업데이트
        localStorage.setItem('inQueue', 'false');
        // 상태 업데이트를 setTimeout으로 래핑하여 무한 루프 방지
        setTimeout(() => {
          setQueueStatus(false);
        }, 0);
        
        // 저장된 매치 정보 확인
        const savedMatchInfo = localStorage.getItem('lastMatchInfo');
        if (savedMatchInfo) {
          try {
            // 매치 정보가 있으면 매치 진행 중 상태로 변경하고 페이지 이동
            const matchInfo = JSON.parse(savedMatchInfo);
            
            // 대기열 상태 초기화
            localStorage.removeItem('simulatedPlayers');
            localStorage.removeItem('simulationStartTime');
            
            // 시뮬레이션 중단
            window.isSimulationRunning = false;
            
            // 전역 상태 업데이트 - setTimeout으로 지연
            setTimeout(() => {
              setMatchProgress(true, matchInfo.matchId);
              
              // 매치 페이지로 즉시 이동 - setTimeout 중첩으로 상태 업데이트 완료 후 이동
              console.log('[QueueStatus] 시뮬레이션 - 매치 상세 페이지로 이동 예약:', matchInfo.matchId);
              setTimeout(() => {
                navigate('/match-details', { state: { matchInfo } });
              }, 50);
            }, 0);
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
      setQueueState(res.data);
      
      // 10명이 모이면 매치 찾음 처리 -> 대기열 해제
      if (res.data.currentPlayers === res.data.requiredPlayers) {
        console.log('[QueueStatus] 10명 모임 - 매치 정보 페이지로 이동');
        
        // 매치 찾은 경우 로컬 저장소와 전역 상태 업데이트
        localStorage.setItem('inQueue', 'false');
        // 상태 업데이트를 setTimeout으로 래핑하여 무한 루프 방지
        setTimeout(() => {
          setQueueStatus(false);
        }, 0);
        
        // 저장된 매치 정보 확인
        const savedMatchInfo = localStorage.getItem('lastMatchInfo');
        if (savedMatchInfo) {
          try {
            // 매치 정보가 있으면 매치 진행 중 상태로 변경하고 페이지 이동
            const matchInfo = JSON.parse(savedMatchInfo);
            
            // 전역 상태 업데이트 - setTimeout으로 지연
            setTimeout(() => {
              setMatchProgress(true, matchInfo.matchId);
              
              // 매치 페이지로 즉시 이동 - setTimeout 중첩으로 상태 업데이트 완료 후 이동
              console.log('[QueueStatus] API - 매치 상세 페이지로 이동 예약:', matchInfo.matchId);
              setTimeout(() => {
                navigate('/match-details', { state: { matchInfo } });
              }, 50);
            }, 0);
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
        setTimeout(() => {
          setQueueStatus(false);
        }, 0);
      }
    }
  }, [isAuthenticated, navigate]);
  
  // 대기열 또는 매치 상태가 변경되면 표시 여부 업데이트 (두 useEffect 통합)
  useEffect(() => {
    // 상태 업데이트 중복 방지를 위한 플래그
    let isUpdatingState = false;
    
    // 로그인 상태가 아니면 대기열/매치 상태 초기화
    if (!isAuthenticated) {
      localStorage.removeItem('inQueue');
      localStorage.removeItem('matchInProgress');
      localStorage.removeItem('currentMatchId');
      if (inQueue) {
        setTimeout(() => {
          setQueueStatus(false);
        }, 0);
      }
      setIsVisible(false);
      return;
    }

    // 매치메이킹 페이지에서는 상태바 표시하지 않음
    if (location.pathname === '/matchmaking' || location.pathname === '/match-details') {
      setIsVisible(false);
      return;
    }

    // 매치 진행 중이면 상태바 표시
    if (isMatchActive) {
      setIsVisible(true);
      return;
    }

    // 로컬 대기열 및 시뮬레이션 상태 확인
    const localInQueue = localStorage.getItem('inQueue') === 'true';
    const simulationRunning = localStorage.getItem('simulatedPlayers') !== null && 
                             localStorage.getItem('simulationStartTime') !== null;
    
    // 상태 동기화는 비동기적으로 처리하여 렌더링 주기와 분리
    const syncStates = () => {
      // 이미 업데이트 중이면 중복 실행 방지
      if (isUpdatingState) return;
      isUpdatingState = true;
      
      try {
        // 로컬 상태와 전역 상태 동기화 (중복 업데이트 방지)
        if (simulationRunning && !inQueue) {
          console.log('[QueueStatus] 시뮬레이션 감지, 대기열 상태 동기화');
          window.isSimulationRunning = true;
          
          // setTimeout으로 상태 업데이트를 다음 렌더 사이클로 지연
          setTimeout(() => {
            setQueueStatus(true);
            
            // 타이머 시작 (시뮬레이션 시작 시간으로부터 계산)
            const startTime = parseInt(localStorage.getItem('simulationStartTime') || Date.now().toString());
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            if (elapsed > 0) {
              queueTimeState.setTime(elapsed);
            } else {
              queueTimeState.start();
            }
          }, 0);
        } else if (localInQueue !== inQueue) {
          // 로컬 상태와 전역 상태가 다른 경우 동기화
          if (localInQueue && !inQueue) {
            setTimeout(() => {
              setQueueStatus(true);
              
              // 이미 진행 중인 대기열이면 타이머 시작
              if (!queueTimeState.startTime) {
                queueTimeState.start();
              }
            }, 0);
          } else if (!localInQueue && inQueue) {
            setTimeout(() => {
              setQueueStatus(false);
            }, 0);
          }
        }
      } finally {
        // 처리 완료 후 플래그 초기화
        isUpdatingState = false;
      }
    };
    
    // 비동기적으로 상태 동기화 실행
    setTimeout(syncStates, 0);
    
    // 상태바 표시 여부 업데이트 (시뮬레이션, 대기열, 매치 중 하나라도 진행 중이면 표시)
    setIsVisible((inQueue || isMatchActive || simulationRunning) && isAuthenticated);
    
  }, [isAuthenticated, inQueue, isMatchActive, location.pathname]);

  // 대기열 상태 가져오기
  useEffect(() => {
    let interval;
    
    if (isVisible && isAuthenticated && inQueue && !isMatchActive) {
      // 초기 데이터 로드
      fetchQueueStatus();
      
      // 3초마다 상태 업데이트
      interval = setInterval(() => {
        fetchQueueStatus();
      }, 3000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isVisible, isAuthenticated, inQueue, isMatchActive, fetchQueueStatus]);

  // 대기열 취소
  const leaveQueue = async () => {
    // 이미 처리 중이면 중복 실행 방지
    if (isLeavingQueue) {
      return;
    }
    
    console.log('대기열 나가기 요청 시작');
    setIsLeavingQueue(true);
    
    // 전역 시뮬레이션 상태 확인
    const simulationRunning = localStorage.getItem('simulatedPlayers') !== null && 
                             localStorage.getItem('simulationStartTime') !== null;
    if (simulationRunning) {
      console.log('시뮬레이션 중 대기열 나가기 요청 - API 호출 없이 로컬에서 처리');
      
      // 전역 시뮬레이션 상태 업데이트
      window.isSimulationRunning = false;
      
      // 로컬 상태 및 스토리지 초기화
      localStorage.removeItem('inQueue');
      localStorage.removeItem('simulatedPlayers');
      localStorage.removeItem('simulationStartTime');
      
      // UI 업데이트는 setTimeout으로 지연시켜 상태 업데이트 충돌 방지
      setTimeout(() => {
        setQueueStatus(false);
        
        // 타이머 초기화
        queueTimeState.reset();
        
        // UI 업데이트
        document.body.classList.remove('queue-active');
        setIsVisible(false);
        setIsLeavingQueue(false);
      }, 0);
      
      // 토스트 알림 없이 처리
      return;
    }
    
    try {
      // 실제 API 호출 (시뮬레이션이 아닌 경우)
      const response = await axios.post('/api/queue/leave');
      
      if (response.status === 200) {
        console.log('대기열 나가기 성공');
        
        // 로컬 상태 및 스토리지 초기화
        localStorage.removeItem('inQueue');
        
        // UI 업데이트는 setTimeout으로 지연시켜 상태 업데이트 충돌 방지
        setTimeout(() => {
          setQueueStatus(false);
          
          // 타이머 초기화
          queueTimeState.reset();
          
          // UI 업데이트
          document.body.classList.remove('queue-active');
          setIsVisible(false);
          setIsLeavingQueue(false);
        }, 0);
      }
    } catch (error) {
      console.error('대기열 나가기 오류:', error);
      
      // 에러가 발생해도 클라이언트 측 상태는 초기화
      localStorage.removeItem('inQueue');
      
      // UI 업데이트는 setTimeout으로 지연시켜 상태 업데이트 충돌 방지
      setTimeout(() => {
        setQueueStatus(false);
        
        queueTimeState.reset();
        document.body.classList.remove('queue-active');
        setIsVisible(false);
        setIsLeavingQueue(false);
      }, 0);
      
      // 사용자 등록 여부 관련 오류는 불필요한 알림 방지
      if (error.response && error.response.status === 404 && 
          error.response.data && error.response.data.message === '대기열에 등록되지 않은 사용자입니다.') {
        console.warn('대기열에 등록되지 않은 사용자 오류 - 알림 표시하지 않음');
      } else {
        console.error('대기열 나가기 중 오류가 발생했습니다.', error);
      }
    }
  };

  // 매치 상세 정보 보기
  const viewMatchDetails = () => {
    // 즉시 이동하지 않고 약간의 지연 후 이동하여 상태 업데이트와 네비게이션이 충돌하지 않도록 함
    setTimeout(() => {
      // 매치 페이지로 이동
      navigate('/match-details');
    }, 50);
  };

  // 리플레이 제출
  const submitReplay = () => {
    setIsSubmittingReplay(true);
    
    // 매치 페이지로 이동 - 상태 업데이트 후 이동하도록 setTimeout 사용
    setTimeout(() => {
      navigate('/matchmaking');
      setIsSubmittingReplay(false);
    }, 50);
  };

  // 관리자 호출
  const callAdmin = () => {
    setIsCallingAdmin(true);
    
    // 간단한 알림 표시 (실제 구현에서는 API 호출)
    setTimeout(() => {
      toast.info('관리자에게 도움 요청이 전송되었습니다. 잠시만 기다려주세요.', {
        position: 'top-center',
        autoClose: 3000
      });
      setIsCallingAdmin(false);
    }, 1000);
  };

  // 매치 취소
  const cancelMatch = () => {
    if (window.confirm('정말로 매치를 취소하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      // 상태 업데이트를 setTimeout으로 래핑하여 무한 루프 방지
      setTimeout(() => {
        // 매치 진행 중 상태 초기화
        setMatchProgress(false);
        
        // 매치 정보 삭제
        clearMatchInfo();
      }, 0);
    }
  };

  // 최소화/최대화 토글
  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  // 매치 정보 로드 함수 추가
  const fetchMatchInfo = async () => {
    // 매치 ID가 없으면 실행하지 않음
    if (!currentMatchId) return;

    try {
      // 실제 환경에서는 API 호출
      // const response = await axios.get(`/api/matches/${currentMatchId}`);
      // if (response.data) {
      //   setGlobalMatchInfo(response.data);
      // }

      // 임시 로직: localStorage에서 매치 정보 가져오기 시도
      const savedMatchInfo = localStorage.getItem('lastMatchInfo');
      if (savedMatchInfo) {
        const parsedInfo = JSON.parse(savedMatchInfo);
        if (parsedInfo && parsedInfo.matchId === currentMatchId) {
          // 전역 상태 업데이트
          setGlobalMatchInfo(parsedInfo);
        }
      }
    } catch (err) {
      console.error('매치 정보 가져오기 오류:', err);
    }
  };

  // 컴포넌트 마운트 시 또는 matchInProgress/currentMatchId 변경 시 매치 정보 확인
  useEffect(() => {
    // 매치 진행 중이지만 매치 정보가 없는 경우
    if (isMatchActive && (!matchInfo || matchInfo.matchId !== currentMatchId)) {
      fetchMatchInfo();
    }
  }, [isMatchActive, currentMatchId, matchInfo]);
  
  // 시간 형식 변환 함수 (MM:SS)
  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // 매치메이킹 페이지로 이동 함수
  const goToMatchmaking = () => {
    // 상태 업데이트와 네비게이션 충돌 방지를 위해 setTimeout 사용
    setTimeout(() => {
      // 대기열 상태일 때는 매치메이킹 페이지로 이동
      if (inQueue || window.isSimulationRunning) {
        navigate('/matchmaking');
        
        // 애니메이션 효과가 적용되도록 body에 클래스 추가
        if (!document.body.classList.contains('queue-active')) {
          document.body.classList.add('queue-active');
        }
      } 
      // 매치 진행 중일 때는 매치 세부 정보 페이지로 이동
      else if (matchInProgress) {
        navigate('/match-details');
      }
    }, 50);
  };

  // 대기열에 없거나 매치 중이 아니거나 로그인 상태가 아니거나 매치메이킹 페이지인 경우 아무것도 보여주지 않음
  if (!isVisible || !isAuthenticated) return null;

  // 최소화된 UI 렌더링
  const renderMinimizedUI = () => {
    const timeString = formatTime(queueTime);
    
    return (
      <div 
        className="queue-status-minimized-content" 
        onClick={toggleMinimize}
        title="클릭하여 확장"
      >
        <div className="queue-status-mini-icon"></div>
        <div className="queue-status-mini-time">{timeString}</div>
      </div>
    );
  };

  // 대기열 UI 렌더링
  const renderQueueUI = () => {
    // 시간 형식화 (MM:SS)
    const timeString = formatTime(queueTime);
    
    if (isMinimized) {
      return renderMinimizedUI();
    }
    
    // 시뮬레이션 중인지 확인
    const simulationRunning = localStorage.getItem('simulatedPlayers') !== null && 
                             localStorage.getItem('simulationStartTime') !== null;
    
    // 대기열 진행률 계산 (시뮬레이션 중일 때도 고려)
    let displayPlayers = queueStatus.currentPlayers;
    
    // 시뮬레이션 중이면 localStorage 값과 시간 기반 값 중 더 큰 값 사용
    if (simulationRunning) {
      const storedPlayers = parseInt(localStorage.getItem('simulatedPlayers') || '1');
      
      // 시간 기반 계산
      const startTime = parseInt(localStorage.getItem('simulationStartTime') || Date.now().toString());
      const timeElapsed = Math.floor((Date.now() - startTime) / 1000);
      const expectedPlayers = Math.min(10, 1 + Math.floor(timeElapsed / 1));
      
      displayPlayers = Math.max(displayPlayers, storedPlayers, expectedPlayers);
    }
    
    const progressPercentage = Math.min(100, (displayPlayers / queueStatus.requiredPlayers) * 100);
    
    return (
      <div className="queue-status-content">
        <button 
          className="queue-status-minimize-btn"
          onClick={toggleMinimize}
          title="최소화"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      
        <div className="queue-status-title">
          대기열 상태
        </div>
        
        <div className="queue-status-time">
          {timeString}
        </div>
        
        <div className="queue-status-info">
          {/* 진행률 표시 */}
          <div className="queue-status-info-numbers">
            <div className="queue-status-info-player-count">
              <span>{displayPlayers}</span>
              <span className="queue-status-info-slash">/</span>
              <span>{queueStatus.requiredPlayers}</span>
            </div>
            <div className="queue-status-info-label">플레이어</div>
          </div>
          
          {/* 진행 상태 바 */}
          <div className="queue-status-info-progress">
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
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            보기
          </button>
          <button 
            className="queue-status-cancel-btn"
            onClick={leaveQueue}
            disabled={isLeavingQueue}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
            {isLeavingQueue ? '처리 중...' : '취소'}
          </button>
        </div>
      </div>
    );
  };

  // 매치 상태 UI 렌더링
  const renderMatchUI = () => {
    if (isMinimized) {
      return (
        <div 
          className="queue-status-minimized-content" 
          onClick={toggleMinimize}
          title="클릭하여 확장"
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
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        <div className="queue-status-title" style={{ color: '#10b981' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          매치 진행 중
        </div>
        
        <div className="queue-status-info" style={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}>
          <div className="queue-status-info-numbers">
            <div className="queue-status-info-label">매치 ID</div>
          </div>
          
          <div className="queue-status-match-id">
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
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            매치 정보
          </button>
          <button 
            className="queue-status-cancel-btn"
            onClick={cancelMatch}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
            취소
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={`queue-status-popup ${isVisible ? 'active' : ''} ${isMinimized ? 'minimized' : ''} ${matchInProgress ? 'match-active' : ''}`}>
      {inQueue ? renderQueueUI() : matchInProgress ? renderMatchUI() : null}
    </div>
  );
};

export default QueueStatus; 