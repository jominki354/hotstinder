import React, { useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './FindMatchPage.css';

// 매치 생성 유틸리티 함수들
const MatchUtils = {
  // 팀 분배 함수 (MMR 기반 밸런싱)
  distributeTeams: (players) => {
    const sortedPlayers = [...players].sort((a, b) => b.mmr - a.mmr);
    const redTeam = [];
    const blueTeam = [];

    // 스네이크 드래프트 방식으로 팀 분배 (5명씩 정확히)
    for (let i = 0; i < 10; i++) {
      if (i % 4 < 2) {
        if (blueTeam.length < 5) {
          blueTeam.push(sortedPlayers[i]);
        } else {
          redTeam.push(sortedPlayers[i]);
        }
      } else {
        if (redTeam.length < 5) {
          redTeam.push(sortedPlayers[i]);
        } else {
          blueTeam.push(sortedPlayers[i]);
        }
      }
    }

    // 안전장치: 정확히 5명씩 되도록 보장
    while (redTeam.length < 5 && blueTeam.length > 5) {
      redTeam.push(blueTeam.pop());
    }
    while (blueTeam.length < 5 && redTeam.length > 5) {
      blueTeam.push(redTeam.pop());
    }

    console.log(`팀 분배 완료: 레드팀 ${redTeam.length}명, 블루팀 ${blueTeam.length}명`);
    return { redTeam, blueTeam };
  },

  // 현재 사용자 정보 생성
  createCurrentUser: (user, selectedRole) => ({
    id: user?.id || 1,
    name: user?.battleTag || user?.battletag || 'CurrentPlayer',
    mmr: user?.mmr || 1500,
    role: user?.preferredRoles?.[0] || selectedRole || '전체'
  }),

  // 실제 유저를 매치 플레이어로 변환
  convertRealUsers: (realUsers, currentUser, roles) => {
    const otherUsers = realUsers
      .filter(u => u.id !== currentUser.id && u.battleTag && u.battleTag.trim() !== '')
      .slice(0, 9);

    const realPlayers = otherUsers.map(u => ({
      id: u.id,
      name: u.battleTag || u.battletag || `Player${u.id}`,
      mmr: u.mmr || (1400 + Math.floor(Math.random() * 400)),
      role: u.preferredRoles?.[0] || roles[Math.floor(Math.random() * roles.length)].name
    }));

    return [currentUser, ...realPlayers];
  },

  // 모의 플레이어 생성
  generateMockPlayers: (count, roles) => {
    const mockNames = ['DragonSlayer', 'ShadowHunter', 'IceQueen', 'FireStorm', 'LightBringer', 'StormRider', 'NightBlade', 'MysticMage', 'HolyPriest'];
    const players = [];

    for (let i = 0; i < count; i++) {
      const randomName = mockNames[Math.floor(Math.random() * mockNames.length)];
      players.push({
        id: 1000 + i,
        name: `${randomName}#${Math.floor(Math.random() * 9999)}`,
        mmr: 1400 + Math.floor(Math.random() * 600),
        role: roles[Math.floor(Math.random() * roles.length)].name
      });
    }

    return players;
  }
};

const FindMatchPage = () => {
  const {
    user,
    isAuthenticated,
    setMatchProgress: setAuthMatchProgress,
    setMatchInfo,
    inQueue,
    setQueueStatus,
    onSocketEvent
  } = useAuthStore();
  const navigate = useNavigate();

  const [isSearching, setIsSearching] = useState(false);
  const [searchStartTime, setSearchStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [selectedRole, setSelectedRole] = useState('전체');
  const [matchProgress, setMatchProgress] = useState(0);
  const [searchPhase, setSearchPhase] = useState('waiting'); // 'waiting', 'searching', 'found', 'failed'
  const [estimatedWaitTime, setEstimatedWaitTime] = useState(0);
  const [queuePosition, setQueuePosition] = useState(0);
  const [playersFound, setPlayersFound] = useState(0); // 현재 모인 플레이어 수
  const [queueStats, setQueueStats] = useState({
    playersInQueue: 0,
    activeMatches: 0
  });

  // 버튼 상태 관리 추가
  const [isStartingSearch, setIsStartingSearch] = useState(false);
  const [isStoppingSearch, setIsStoppingSearch] = useState(false);
  const [buttonAnimation, setButtonAnimation] = useState('');
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  // 역할 옵션
  const roles = [
    { id: '전체', name: '전체', icon: '🎯', description: '모든 역할 가능' },
    { id: '탱커', name: '탱커', icon: '🛡️', description: '팀을 보호하는 전면 방어' },
    { id: '브루저', name: '브루저', icon: '⚔️', description: '근접 전투 전문가' },
    { id: '원거리 암살자', name: '원거리 딜러', icon: '🏹', description: '원거리 공격 전문' },
    { id: '근접 암살자', name: '근접 딜러', icon: '🗡️', description: '기습과 암살 전문' },
    { id: '지원가', name: '지원가', icon: '✨', description: '팀 지원 및 유틸리티' },
    { id: '힐러', name: '힐러', icon: '💚', description: '팀원 치료 전문' }
  ];

  // 전장 목록 (Heroes of the Storm 11개 전장)
  const battlegrounds = [
    { name: '용의 둥지', icon: '🐉' },
    { name: '저주받은 골짜기', icon: '🌙' },
    { name: '공포의 정원', icon: '🌿' },
    { name: '하늘 사원', icon: '☁️' },
    { name: '거미 여왕의 무덤', icon: '🕷️' },
    { name: '영원의 전쟁터', icon: '⚔️' },
    { name: '불지옥 신단', icon: '🔥' },
    { name: '파멸의 탑', icon: '🗼' },
    { name: '볼스카야 공장', icon: '🏭' },
    { name: '알터랙 고개', icon: '🏔️' }
  ];

  // 매치 찾기 단계별 메시지
  const searchMessages = {
    waiting: '매치를 찾을 준비가 되었습니다',
    searching: '비슷한 MMR의 플레이어들을 찾는 중...',
    balancing: '팀 밸런스를 조정하는 중...',
    finalizing: '최종 매치를 확정하는 중...',
    found: '매치를 찾았습니다!',
    failed: '매치 찾기에 실패했습니다'
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // 대기열 상태 복원 - 의존성 배열에서 isSearching 제거하여 중복 실행 방지
    restoreQueueState();

    fetchQueueStats();
    const interval = setInterval(fetchQueueStats, 3000); // 3초마다 업데이트
    return () => clearInterval(interval);
  }, [isAuthenticated, navigate, inQueue]); // isSearching 의존성 제거

  // 별도 useEffect로 페이지 포커스 시 상태 복원
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated && inQueue && !isSearching) {
        console.log('[FindMatchPage] 페이지 포커스 복원, 상태 확인');
        restoreQueueState();
      }
    };

    const handleFocus = () => {
      if (isAuthenticated && inQueue && !isSearching) {
        console.log('[FindMatchPage] 윈도우 포커스 복원, 상태 확인');
        restoreQueueState();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isAuthenticated, inQueue, isSearching]);

  // WebSocket 이벤트 리스너 설정
  useEffect(() => {
    if (!isAuthenticated || !onSocketEvent) return;

    console.log('[FindMatchPage] WebSocket 이벤트 리스너 설정');

    // 대기열 업데이트 이벤트
    const unsubscribeQueueUpdate = onSocketEvent('queue:update', (data) => {
      console.log('[FindMatchPage] WebSocket 대기열 업데이트:', data);

      if (data.currentPlayers !== undefined) {
        setPlayersFound(data.currentPlayers);
      }

      if (data.type === 'match_created') {
        setSearchPhase('found');
        setMatchProgress(100);
      }
    });

    // 매치 찾음 이벤트
    const unsubscribeMatchFound = onSocketEvent('match:found', (data) => {
      console.log('[FindMatchPage] WebSocket 매치 찾음:', data);

      setSearchPhase('found');
      setMatchProgress(100);
      setPlayersFound(10);

      // 매치 정보 저장
      if (data.matchId) {
        const matchInfo = {
          matchId: data.matchId,
          mapName: data.mapName,
          gameMode: data.gameMode,
          blueTeam: data.team1 || [],
          redTeam: data.team2 || []
        };

        localStorage.setItem('lastMatchInfo', JSON.stringify(matchInfo));
        setMatchInfo(matchInfo);
        setAuthMatchProgress(true, data.matchId);
      }

      // 매치 찾음 처리
      setTimeout(() => {
        handleMatchFound();
      }, 1000);
    });

    // 대기열 상태 변경 이벤트
    const unsubscribeQueueStatus = onSocketEvent('queue:status', (data) => {
      console.log('[FindMatchPage] WebSocket 대기열 상태 변경:', data);

      if (data.status === 'left') {
        resetSearchState();
      } else if (data.status === 'error') {
        toast.error(data.message || '대기열 오류가 발생했습니다');
        resetSearchState();
      }
    });

    // 정리 함수
    return () => {
      console.log('[FindMatchPage] WebSocket 이벤트 리스너 정리');
      unsubscribeQueueUpdate();
      unsubscribeMatchFound();
      unsubscribeQueueStatus();
    };
  }, [isAuthenticated, onSocketEvent, setMatchInfo, setAuthMatchProgress]);

  // 매치 찾기 타이머 - 전역 queueTimeState와 동기화
  useEffect(() => {
    let interval;
    if (isSearching && searchStartTime) {
      // 전역 queueTimeState 구독하여 시간 동기화
      const unsubscribe = window.queueTimeState?.subscribe((globalTime) => {
        setElapsedTime(globalTime);
      });

      // 로컬 타이머는 백업용으로만 사용
      interval = setInterval(() => {
        // 전역 타이머가 없거나 작동하지 않을 때만 로컬 계산 사용
        if (!window.queueTimeState || window.queueTimeState.time === 0) {
          const elapsed = Math.floor((Date.now() - searchStartTime) / 1000);
          setElapsedTime(elapsed);
        }

        // 실제 대기열 상태인 경우 서버에서 플레이어 수 가져오기
        if (inQueue) {
          // 서버 상태 기반으로 플레이어 수 업데이트는 fetchQueueStats에서 처리
          return;
        }

        // 시뮬레이션 모드에서만 플레이어 수 증가 로직 적용
        const currentElapsed = window.queueTimeState?.time || Math.floor((Date.now() - searchStartTime) / 1000);
        const targetPlayers = Math.min(10, Math.floor((currentElapsed / 3) + 1)); // 3초마다 1명씩 증가
        setPlayersFound(targetPlayers);

        // 단계별 메시지 업데이트
        if (targetPlayers < 5) {
          setSearchPhase('searching');
        } else if (targetPlayers < 8) {
          setSearchPhase('balancing');
        } else if (targetPlayers < 10) {
          setSearchPhase('finalizing');
        }
      }, 1000);

      return () => {
        clearInterval(interval);
        if (unsubscribe) {
          unsubscribe();
        }
      };
    }
    return () => clearInterval(interval);
  }, [isSearching, searchStartTime, inQueue]);

  // 상태 변화 디버깅용 useEffect 추가
  useEffect(() => {
    console.log('[FindMatchPage] 상태 변화 감지:', {
      isSearching,
      searchPhase,
      playersFound,
      inQueue,
      elapsedTime,
      searchStartTime: searchStartTime ? new Date(searchStartTime).toLocaleTimeString() : null
    });
  }, [isSearching, searchPhase, playersFound, inQueue, elapsedTime, searchStartTime]);

  // 대기열 통계 업데이트 (개선된 서버 응답 처리)
  const fetchQueueStats = async () => {
    try {
      // 실제 대기열 상태인 경우 서버 API 호출
      if (inQueue && isSearching) {
        try {
          const response = await axios.get('/api/matchmaking/status', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            timeout: 8000
          });

          const queueData = response.data;

          if (queueData.success && queueData.inQueue) {
            // 서버에서 받은 실제 데이터 사용 (시뮬레이션 로직 제거)
            setPlayersFound(queueData.currentPlayers || 1);
            setQueuePosition(queueData.queuePosition || 1);
            setEstimatedWaitTime(queueData.estimatedWaitTime || 60);

            // 대기열 통계 업데이트
            setQueueStats({
              playersInQueue: queueData.totalInQueue || queueData.currentPlayers || 1,
              activeMatches: queueData.activeMatches || 0
            });

            // MMR 매칭 정보 표시 (콘솔)
            if (queueData.mmrRange) {
              console.log('[FindMatchPage] MMR 매칭 범위:', {
                current: queueData.mmrRange.current,
                range: `${queueData.mmrRange.min} - ${queueData.mmrRange.max}`,
                playersInRange: queueData.currentPlayers
              });
            }

            console.log('[FindMatchPage] 서버에서 대기열 상태 업데이트:', {
              currentPlayers: queueData.currentPlayers,
              totalInQueue: queueData.totalInQueue,
              queuePosition: queueData.queuePosition,
              estimatedWait: queueData.estimatedWaitTime,
              waitTime: queueData.queueTime
            });
            return;
          } else if (queueData.success && !queueData.inQueue) {
            // 서버에서 대기열에 없다고 응답한 경우 로컬 상태 동기화
            console.log('[FindMatchPage] 서버에 대기열 상태 없음, 로컬 상태 동기화');
            setQueueStatus(false);
            resetSearchState();
            return;
          }
        } catch (apiError) {
          console.error('[FindMatchPage] 서버 대기열 상태 가져오기 실패:', apiError);

          // API 실패 시 로컬 상태만 유지 (시뮬레이션 로직 제거)
          console.log('[FindMatchPage] API 실패로 인한 로컬 상태 유지');
          return;
        }
      }

      // 대기열에 없는 경우 기본 통계만 표시 (시뮬레이션 제거)
      if (!inQueue) {
        const baseStats = {
          playersInQueue: 0,
          activeMatches: 0
        };
        setQueueStats(baseStats);
      }
    } catch (error) {
      console.error('큐 통계 가져오기 실패:', error);
    }
  };

  const handleStartSearch = async () => {
    console.log('=== 클라이언트 매치찾기 시작 ===');

    if (!user?.isProfileComplete) {
      console.warn('프로필 미완성으로 프로필 설정 페이지로 이동');
      toast.warning('프로필 설정을 먼저 완료해주세요.');
      navigate('/profile/setup');
      return;
    }

    // 버튼 애니메이션 시작
    setIsStartingSearch(true);
    setButtonAnimation('pulse');

    try {
      console.log('1. 매치찾기 상태 초기화');

      // 타이밍 보호를 위해 미리 타임스탬프 설정
      const joinTimestamp = Date.now();
      localStorage.setItem('recentQueueJoinTime', joinTimestamp.toString());
      console.log('1-1. 타이밍 보호용 타임스탬프 설정:', joinTimestamp);

      // 먼저 현재 대기열 상태 확인
      console.log('2. 서버 대기열 상태 확인');
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('인증 토큰이 없습니다. 다시 로그인해주세요.');
      }

      try {
        const statusResponse = await axios.get('/api/matchmaking/status', {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 8000
        });

        if (statusResponse.data.success && statusResponse.data.inQueue) {
          console.log('2. 이미 대기열에 참가되어 있음, 상태 복원');

          // 기존 대기열 상태 복원
          setIsSearching(true);
          setSearchPhase('searching');
          setPlayersFound(statusResponse.data.currentPlayers || 1);
          setQueuePosition(statusResponse.data.queuePosition || 1);
          setEstimatedWaitTime(statusResponse.data.estimatedWaitTime || 60);

          // 대기 시간 복원 (서버 시간 기준)
          if (statusResponse.data.waitTime !== undefined) {
            setElapsedTime(statusResponse.data.waitTime);
            setSearchStartTime(Date.now() - (statusResponse.data.waitTime * 1000));

            // 전역 queueTimeState와 동기화
            if (window.queueTimeState) {
              window.queueTimeState.setServerTime(
                statusResponse.data.waitTime,
                statusResponse.data.joinedAt,
                statusResponse.data.serverTime
              );
            }
          } else if (statusResponse.data.queueTime !== undefined) {
            setElapsedTime(statusResponse.data.queueTime);
            setSearchStartTime(Date.now() - (statusResponse.data.queueTime * 1000));

            // 전역 queueTimeState와 동기화
            if (window.queueTimeState) {
              window.queueTimeState.setServerTime(
                statusResponse.data.queueTime,
                statusResponse.data.joinedAt,
                statusResponse.data.serverTime
              );
            }
          } else {
            setSearchStartTime(Date.now());
            setElapsedTime(0);

            // 전역 타이머 시작
            if (window.queueTimeState) {
              window.queueTimeState.startLocalTimer();
            }
          }

          // 전역 상태 업데이트
          setQueueStatus(true);
          localStorage.setItem('inQueue', 'true');

          // 성공 애니메이션 (이미 대기열에 있는 경우) - 수정: 별도 상태 사용
          setButtonAnimation('already-joined');
          setShowSuccessAnimation(true);

          toast.info(`이미 대기열에 참가되어 있습니다. (대기시간: ${Math.floor(statusResponse.data.queueTime / 60)}분 ${statusResponse.data.queueTime % 60}초)`);

          // 애니메이션 정리
          setTimeout(() => {
            setIsStartingSearch(false);
            setButtonAnimation('');
            setShowSuccessAnimation(false);
          }, 2000);

          return;
        }
      } catch (statusError) {
        console.log('2. 대기열 상태 확인 실패, 새로운 매치찾기 진행:', statusError.message);
      }

      console.log('3. 새로운 매치찾기 시작');

      // 즉시 UI 상태 업데이트 (반응성 개선)
      setIsSearching(true);
      setSearchStartTime(Date.now());
      setElapsedTime(0);
      setMatchProgress(0);
      setSearchPhase('searching');
      setPlayersFound(1); // 자신부터 시작

      console.log('4. 사용자 피드백 표시');
      // 사용자 피드백 개선
      toast.info(`${roles.find(r => r.id === selectedRole)?.name} 역할로 매치메이킹을 시작합니다!`, {
        icon: roles.find(r => r.id === selectedRole)?.icon
      });

      console.log('5. API 요청 데이터 준비');
      const requestData = {
        preferredRole: selectedRole,
        gameMode: 'Storm League'
      };
      console.log('5. 요청 데이터:', requestData);

      console.log('6. 서버 API 호출 시작');
      // 실제 서버 API 호출 (시뮬레이션 제거)
      try {
        console.log('6-1. axios 요청 시작');
        const response = await axios.post('/api/matchmaking/join', requestData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        });

        console.log('6-2. 서버 응답 수신:', {
          status: response.status,
          statusText: response.statusText,
          hasData: !!response.data,
          dataKeys: Object.keys(response.data || {})
        });

        console.log('6-3. 응답 데이터 상세:', response.data);

        if (response.data.success) {
          console.log('7. 서버 대기열 참가 성공');

          // 전역 상태 업데이트 (가장 중요!)
          console.log('7-1. 전역 상태 업데이트 시작');
          flushSync(() => {
            setQueueStatus(true);
          });
          localStorage.setItem('inQueue', 'true');
          console.log('7-1. 전역 상태 업데이트 완료 - inQueue:', true);

          // UI 상태 즉시 업데이트
          console.log('7-2. UI 상태 업데이트 시작');
          flushSync(() => {
            setIsSearching(true);
            setSearchPhase('searching');
            setPlayersFound(1); // 자신부터 시작
            setQueuePosition(1);
            setEstimatedWaitTime(60);
          });
          console.log('7-2. UI 상태 업데이트 완료 - isSearching:', true, 'searchPhase: searching');

          // 서버 응답 기반으로 추가 상태 설정
          if (response.data.queueEntry) {
            console.log('7-3. 서버 응답 기반 상태 설정:', response.data.queueEntry);
            const currentSize = response.data.queueInfo?.currentSize || 1;
            setPlayersFound(currentSize);
            setQueuePosition(response.data.queueEntry.queuePosition || 1);
            setEstimatedWaitTime(response.data.queueEntry.estimatedWaitTime || 60);
            console.log('7-3. 서버 기반 상태 설정 완료 - playersFound:', currentSize);
          }

          // 타이머 시작
          if (!searchStartTime) {
            console.log('7-4. 검색 타이머 시작');
            setSearchStartTime(Date.now());
            setElapsedTime(0);

            // 전역 queueTimeState 타이머 즉시 시작
            console.log('7-4-1. queueTimeState 타이머 시작');
            if (window.queueTimeState) {
              window.queueTimeState.reset(); // 기존 타이머 정리
              window.queueTimeState.startLocalTimer(); // 새 타이머 시작
            }
          }

          // 성공 애니메이션 (새로 참가한 경우)
          setButtonAnimation('joined');
          setShowSuccessAnimation(true);

          console.log('7-5. 성공 토스트 표시');
          toast.success('매치메이킹 대기열에 참가했습니다!');

          console.log('=== 클라이언트 매치찾기 성공 완료 ===');
          console.log('최종 상태 확인:', {
            isSearching: true,
            searchPhase: 'searching',
            playersFound: response.data.queueInfo?.currentSize || 1,
            inQueue: true
          });
        } else {
          throw new Error(response.data.message || '대기열 참가에 실패했습니다');
        }
      } catch (apiError) {
        console.error('=== API 호출 오류 발생 ===');
        console.error('API 오류 상세:', {
          message: apiError.message,
          status: apiError.response?.status,
          statusText: apiError.response?.statusText,
          responseData: apiError.response?.data,
          requestConfig: {
            url: apiError.config?.url,
            method: apiError.config?.method,
            headers: apiError.config?.headers
          }
        });

        // 400 에러 (이미 대기열에 있는 경우) 처리
        if (apiError.response?.status === 400 &&
            apiError.response?.data?.message?.includes('이미 대기열에')) {
          console.log('7. 이미 대기열에 있음 - 상태 복원 시작');

          try {
            // 서버에서 현재 대기열 상태 가져오기
            const statusResponse = await axios.get('/api/matchmaking/status', {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 8000
            });

            if (statusResponse.data.success && statusResponse.data.inQueue) {
              console.log('7-1. 서버 대기열 상태 확인 성공, UI 복원');

              // UI 상태 복원
              setIsSearching(true);
              setSearchPhase('searching');
              setPlayersFound(statusResponse.data.currentPlayers || 1);
              setQueuePosition(statusResponse.data.queuePosition || 1);
              setEstimatedWaitTime(statusResponse.data.estimatedWaitTime || 60);

              // 대기 시간 복원 (서버 시간 기준)
              if (statusResponse.data.waitTime !== undefined) {
                setElapsedTime(statusResponse.data.waitTime);
                setSearchStartTime(Date.now() - (statusResponse.data.waitTime * 1000));

                // 전역 queueTimeState와 동기화
                if (window.queueTimeState) {
                  window.queueTimeState.setServerTime(
                    statusResponse.data.waitTime,
                    statusResponse.data.joinedAt,
                    statusResponse.data.serverTime
                  );
                }
              } else if (statusResponse.data.queueTime !== undefined) {
                setElapsedTime(statusResponse.data.queueTime);
                setSearchStartTime(Date.now() - (statusResponse.data.queueTime * 1000));

                // 전역 queueTimeState와 동기화
                if (window.queueTimeState) {
                  window.queueTimeState.setServerTime(
                    statusResponse.data.queueTime,
                    statusResponse.data.joinedAt,
                    statusResponse.data.serverTime
                  );
                }
              } else {
                setSearchStartTime(Date.now());
                setElapsedTime(0);

                // 전역 타이머 시작
                if (window.queueTimeState) {
                  window.queueTimeState.startLocalTimer();
                }
              }

              // 전역 상태 업데이트 (가장 중요!)
              setQueueStatus(true);
              localStorage.setItem('inQueue', 'true');

              // 성공 애니메이션 (이미 대기열에 있는 경우)
              setButtonAnimation('already-joined');
              setShowSuccessAnimation(true);

              console.log('7-2. 대기열 상태 복원 완료');
              toast.info(`이미 대기열에 참가되어 있습니다. (대기시간: ${Math.floor(statusResponse.data.queueTime / 60)}분 ${statusResponse.data.queueTime % 60}초)`);

              // 애니메이션 정리
              setTimeout(() => {
                setIsStartingSearch(false);
                setButtonAnimation('');
                setShowSuccessAnimation(false);
              }, 2000);

              return; // 성공적으로 복원했으므로 에러 처리하지 않음
            }
          } catch (statusError) {
            console.error('7-3. 대기열 상태 복원 실패:', statusError);
          }
        }

        // 서버 응답에서 상세 오류 정보 추출
        const errorMessage = apiError.response?.data?.error ||
                           apiError.response?.data?.message ||
                           apiError.message ||
                           '매치메이킹 참가 중 오류가 발생했습니다';

        console.error('추출된 오류 메시지:', errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err) {
      console.error('=== 클라이언트 매치찾기 전체 오류 ===');
      console.error('전체 오류 상세:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });

      // 오류 발생 시 타임스탬프 정리
      localStorage.removeItem('recentQueueJoinTime');

      // 상태 초기화
      setIsSearching(false);
      setSearchPhase('failed');
      setButtonAnimation('error');

      // 사용자에게 오류 표시
      toast.error(err.message || '매치메이킹 시작에 실패했습니다.');

      console.log('=== 클라이언트 매치찾기 오류 완료 ===');
    } finally {
      // 애니메이션 정리 (성공한 경우는 위에서 별도 처리)
      if (buttonAnimation !== 'cancel-success' && buttonAnimation !== 'joined' && buttonAnimation !== 'already-joined') {
        setTimeout(() => {
          setIsStartingSearch(false);
          setButtonAnimation('');
          setShowSuccessAnimation(false);
        }, 1500);
      }
    }
  };

  const handleStopSearch = async () => {
    // 취소 애니메이션 시작
    setIsStoppingSearch(true);
    setButtonAnimation('stopping');

    try {
      const token = localStorage.getItem('token');

      // API 호출 시도
      try {
        const response = await axios.post('/api/matchmaking/leave', {}, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000
        });

        if (response.data.success) {
          console.log('서버 대기열 취소 성공');
          // 성공 시에만 성공 애니메이션 표시
          setButtonAnimation('cancel-success');
          toast.info('매치메이킹을 취소했습니다.');
        }
      } catch (apiError) {
        console.log('API 호출 실패, 강제 로컬 정리:', apiError.message);
        // API 실패 시 경고 애니메이션
        setButtonAnimation('warning');
        toast.info('매치메이킹을 취소했습니다.');
      }

      // 성공/실패 관계없이 로컬 상태 정리
      resetSearchState();
      setQueueStatus(false);
      localStorage.setItem('inQueue', 'false');
      localStorage.removeItem('recentQueueJoinTime'); // 타이밍 문제 방지용 타임스탬프 정리

    } catch (error) {
      console.error('매치메이킹 취소 실패:', error);

      // 오류 발생 시에도 로컬 상태 정리
      resetSearchState();
      setQueueStatus(false);
      localStorage.setItem('inQueue', 'false');
      localStorage.removeItem('recentQueueJoinTime'); // 타이밍 문제 방지용 타임스탬프 정리

      setButtonAnimation('error');
      toast.error('매치메이킹 취소에 실패했지만 로컬 상태를 정리했습니다.');
    } finally {
      // 애니메이션 정리 - 더 긴 시간으로 설정하여 사용자가 결과를 확인할 수 있도록 함
      setTimeout(() => {
        setIsStoppingSearch(false);
        setButtonAnimation('');
      }, 1500);
    }
  };

  const handleMatchFound = async () => {
    setSearchPhase('found');
    setMatchProgress(100);

    // 성공 효과
    toast.success('🎉 매치를 찾았습니다! 게임을 시작합니다.', {
      autoClose: 3000
    });

    try {
      // 실제 매치용 사용자 데이터 가져오기
      const realUsers = await fetchUsersForRealMatch();

      // 실제 DB 유저 기반 매치 정보 생성 (일반 매치용)
      const matchInfo = generateRealUserMatch(realUsers, false); // false = 일반 매치

      // authStore에 매치 진행 상태 설정
      setAuthMatchProgress(true, matchInfo.matchId);
      setMatchInfo(matchInfo);

      // localStorage에 매치 정보 저장
      localStorage.setItem('lastMatchInfo', JSON.stringify(matchInfo));
      localStorage.setItem('matchInProgress', 'true');
      localStorage.setItem('currentMatchId', matchInfo.matchId);

      // 매치 상세 정보 표시
      setTimeout(() => {
        // 대기열 상태 정리 (매치 찾기 완료)
        setQueueStatus(false);
        localStorage.setItem('inQueue', 'false');
        localStorage.removeItem('recentQueueJoinTime'); // 타이밍 보호용 타임스탬프 정리

        resetSearchState();

        // 매치 상세 페이지로 이동
        toast.info(`맵: ${matchInfo.map} | 모드: ${matchInfo.gameMode}`, {
          autoClose: 2000
        });

        // 매치 로비 페이지로 이동
        navigate('/match-details', { state: { matchInfo } });
      }, 2000);

    } catch (error) {
      console.error('일반 매치 찾기 중 오류:', error);

      // 오류 발생 시 기존 방식으로 폴백
      const matchInfo = {
        matchId: `match_${Date.now()}`,
        map: battlegrounds[Math.floor(Math.random() * battlegrounds.length)].name,
        gameMode: '랭크 게임',
        estimatedDuration: '20-25분',
        players: MatchUtils.generateMockPlayers(10, roles)
      };

      // authStore에 매치 진행 상태 설정
      setAuthMatchProgress(true, matchInfo.matchId);
      setMatchInfo(matchInfo);

      // 매치 상세 정보 표시
      setTimeout(() => {
        resetSearchState();

        // 매치 상세 페이지로 이동
        toast.info(`맵: ${matchInfo.map} | 모드: ${matchInfo.gameMode}`, {
          autoClose: 2000
        });

        // 매치 로비 페이지로 이동
        navigate('/match-details', { state: { matchInfo } });
      }, 2000);
    }
  };

  const handleMatchFailed = () => {
    setSearchPhase('failed');
    resetSearchState();

    toast.error('매치 찾기에 실패했습니다. 다시 시도해주세요.', {
      autoClose: 4000
    });
  };

  const resetSearchState = () => {
    setIsSearching(false);
    setSearchStartTime(null);
    setElapsedTime(0);
    setMatchProgress(0);
    setSearchPhase('waiting');
    setQueuePosition(0);
    setEstimatedWaitTime(0);
    setPlayersFound(0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 실제 DB 유저 기반 매치 생성
  const generateRealUserMatch = (realUsers = [], isDevelopment = true) => {
    const matchId = isDevelopment ? `dev_match_${Date.now()}` : `match_${Date.now()}`;

    // 현재 사용자 정보 준비
    const currentUser = MatchUtils.createCurrentUser(user, selectedRole);
    let matchPlayers = [];

    if (realUsers && realUsers.length > 0) {
      // 실제 유저들을 매치 플레이어로 변환
      matchPlayers = MatchUtils.convertRealUsers(realUsers, currentUser, roles);

      // 10명이 안 되면 모의 플레이어로 채우기
      while (matchPlayers.length < 10) {
        const mockPlayers = MatchUtils.generateMockPlayers(10 - matchPlayers.length, roles);
        matchPlayers.push(...mockPlayers);
      }

      console.log(`${isDevelopment ? '개발용' : '일반'} 실제 DB 유저 기반 매치 생성:`, {
        totalPlayers: matchPlayers.length,
        realUsers: matchPlayers.filter(p => p.id < 1000).length,
        mockUsers: matchPlayers.filter(p => p.id >= 1000).length
      });
    } else {
      // DB 유저가 없으면 기존 모의 플레이어 생성
      console.warn(`${isDevelopment ? '개발용' : '일반'} 매치에서 실제 DB 유저를 가져올 수 없어 모의 플레이어로 매치 생성`);
      const mockPlayers = MatchUtils.generateMockPlayers(9, roles);
      matchPlayers = [currentUser, ...mockPlayers];
    }

    // 팀 분배 (MMR 기반 밸런싱)
    const { redTeam, blueTeam } = MatchUtils.distributeTeams(matchPlayers);

    return {
      matchId,
      map: battlegrounds[Math.floor(Math.random() * battlegrounds.length)].name,
      gameMode: isDevelopment ? '개발용 랭크 게임' : '랭크 게임',
      estimatedDuration: '20-25분',
      players: matchPlayers,
      blueTeam,
      redTeam,
      createdAt: new Date().toISOString(),
      isDevelopmentMatch: isDevelopment,
      realUserCount: matchPlayers.filter(p => p.id < 1000).length
    };
  };

  // 개발용 매치 시뮬레이션 (분리된 함수)
  const handleDevMatchSimulation = async () => {
    if (isSearching) return;

    console.log('=== 개발용 시뮬레이션 시작 ===');

    try {
      // 타이밍 보호를 위해 미리 타임스탬프 설정
      const joinTimestamp = Date.now();
      localStorage.setItem('recentQueueJoinTime', joinTimestamp.toString());
      console.log('개발용 시뮬레이션 - 타이밍 보호용 타임스탬프 설정:', joinTimestamp);

      toast.info('🔧 개발용 매치 시뮬레이션을 시작합니다!');

      setIsSearching(true);
      setSearchStartTime(Date.now());
      setElapsedTime(0);
      setMatchProgress(0);
      setSearchPhase('searching');
      setPlayersFound(1);

      // 전역 상태 업데이트 (시뮬레이션도 대기열 상태로 처리)
      setQueueStatus(true);
      localStorage.setItem('inQueue', 'true');

      // 개발용 시뮬레이션 API 호출
      const response = await axios.post('/api/matchmaking/simulate', {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        timeout: 10000
      });

      if (response.data.success && response.data.isSimulation) {
        console.log('[FindMatchPage] 개발용 시뮬레이션 매치 생성 성공:', response.data);

        // 빠른 시뮬레이션 (2초 고정)
        const quickMatchTime = 2000; // 2초로 고정

        // 플레이어 수 빠른 증가 애니메이션 (2초 동안 10명까지)
        const playerInterval = setInterval(() => {
          setPlayersFound(prev => {
            const newCount = prev + 1;
            if (newCount >= 10) {
              clearInterval(playerInterval);
              return 10;
            }
            return newCount;
          });
        }, 200); // 200ms마다 1명씩 증가 (2초에 10명)

        // 2초 후 매치 완료
        setTimeout(() => {
          clearInterval(playerInterval);
          setPlayersFound(10);
          handleDevMatchFound(response.data.matchInfo);
        }, quickMatchTime);

      } else {
        throw new Error(response.data.message || '개발용 시뮬레이션 생성에 실패했습니다');
      }

    } catch (error) {
      console.error('개발용 매치 시뮬레이션 오류:', error);

      // 오류 발생 시 타임스탬프 정리
      localStorage.removeItem('recentQueueJoinTime');

      const errorMessage = error.response?.data?.error || error.message;
      toast.error(`개발용 시뮬레이션 실패: ${errorMessage}`);

      // 상태 정리
      setQueueStatus(false);
      localStorage.setItem('inQueue', 'false');
      resetSearchState();

      console.log('=== 개발용 시뮬레이션 오류 완료 ===');
    }
  };

  // 개발용 매치 찾기 성공 처리 (서버 응답 기반)
  const handleDevMatchFound = (simulationMatchInfo) => {
    setSearchPhase('found');
    setMatchProgress(100);

    // 성공 효과
    toast.success('🎉 개발용 매치를 찾았습니다! 시뮬레이션 데이터로 구성됩니다.', {
      autoClose: 3000
    });

    // 시뮬레이션 매치 정보 사용
    const matchInfo = {
      matchId: simulationMatchInfo.matchId,
      map: simulationMatchInfo.map,
      gameMode: simulationMatchInfo.gameMode,
      estimatedDuration: '15-20분 (시뮬레이션)',
      blueTeam: simulationMatchInfo.blueTeam,
      redTeam: simulationMatchInfo.redTeam,
      createdAt: simulationMatchInfo.createdAt,
      isSimulation: true,
      isDevelopment: true
    };

    // authStore에 매치 진행 상태 설정
    setAuthMatchProgress(true, matchInfo.matchId);
    setMatchInfo(matchInfo);

    // localStorage에 매치 정보 저장
    localStorage.setItem('lastMatchInfo', JSON.stringify(matchInfo));
    localStorage.setItem('matchInProgress', 'true');
    localStorage.setItem('currentMatchId', matchInfo.matchId);

    // 매치 상세 정보 표시 후 즉시 이동 (1초로 단축)
    setTimeout(() => {
      resetSearchState();

      // 매치 상세 페이지로 이동
      toast.info(`맵: ${matchInfo.map} | 모드: ${matchInfo.gameMode}`, {
        autoClose: 2000
      });

      navigate('/match-details', { state: { matchInfo } });
    }, 1000); // 2초에서 1초로 단축
  };

  // 실제 매치용 사용자 데이터 가져오기 (분리된 함수)
  const fetchUsersForRealMatch = async () => {
    const token = localStorage.getItem('token');
    let realUsers = [];

    try {
      // 1순위: 리더보드 API 사용
      const response = await axios.get('/api/users/leaderboard', {
        params: { limit: 50 }
      });

      if (Array.isArray(response.data)) {
        realUsers = response.data.map(user => ({
          id: user.id || user._id,
          battleTag: user.battletag || user.battleTag,
          battletag: user.battletag || user.battleTag,
          mmr: user.mmr || 1500,
          preferredRoles: user.preferredRoles || [],
          wins: user.wins || 0,
          losses: user.losses || 0
        }));
      }

      console.log('일반 매치에서 리더보드 API로 사용자 목록 가져오기 성공:', realUsers.length);
    } catch (apiError) {
      console.warn('리더보드 API 실패, 기본 사용자 API 시도:', apiError.message);

      try {
        const fallbackResponse = await axios.get('/api/users', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        if (Array.isArray(fallbackResponse.data)) {
          realUsers = fallbackResponse.data.slice(0, 50).map(user => ({
            id: user._id || user.id,
            battleTag: user.battletag || user.battleTag,
            battletag: user.battletag || user.battleTag,
            mmr: user.mmr || 1500,
            preferredRoles: user.preferredRoles || [],
            wins: user.wins || 0,
            losses: user.losses || 0
          }));
        }
        console.log('일반 매치에서 기본 사용자 API로 사용자 목록 가져오기 성공:', realUsers.length);
      } catch (fallbackError) {
        console.warn('기본 사용자 API도 실패:', fallbackError.message);
      }
    }

    return realUsers;
  };

  // 개발 환경 체크
  const isDevelopment = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';

  // 선호 역할 표시 함수 개선
  const getPreferredRoles = () => {
    if (user?.preferredRoles && user.preferredRoles.length > 0) {
      return user.preferredRoles.slice(0, 3);
    }
    return null;
  };

  // 대기 시간 예측 함수
  const getEstimatedWaitTime = () => {
    if (!isSearching) return null;

    const baseTime = selectedRole === '전체' ? 45 : 90;
    const queueFactor = Math.max(1, queueStats.playersInQueue / 20);
    const estimated = Math.floor(baseTime / queueFactor);

    return Math.max(30, estimated - elapsedTime);
  };

  // 개선된 대기열 상태 복원 함수
  const restoreQueueState = async () => {
    console.log('[FindMatchPage] 대기열 상태 복원 시작:', { inQueue, isSearching });

    if (inQueue) {
      console.log('[FindMatchPage] 전역 대기열 상태 감지, 매치메이킹 상태 복원');

      // 이미 검색 중이면 중복 복원 방지
      if (isSearching) {
        console.log('[FindMatchPage] 이미 검색 중이므로 복원 건너뛰기');
        return;
      }

      // 최근에 대기열에 참가한 경우 서버 확인을 잠시 건너뛰기 (타이밍 문제 방지)
      const recentJoinTime = localStorage.getItem('recentQueueJoinTime');
      const now = Date.now();

      // 타이밍 보호: 최근 5초 이내에 참가한 경우만 서버 확인 건너뛰기
      if (recentJoinTime && (now - parseInt(recentJoinTime)) < 5000) {
        console.log('[FindMatchPage] 최근 대기열 참가로 인해 서버 확인 건너뛰기 (5초 보호)');

        // 로컬 상태만으로 UI 복원
        setIsSearching(true);
        setSearchPhase('searching');
        setPlayersFound(1);
        setSearchStartTime(Date.now());
        setElapsedTime(0);
        return;
      }

      // 페이지 이동 후 복귀 시에는 서버 확인 필요
      console.log('[FindMatchPage] 서버에서 대기열 상태 확인 시작');

      try {
        // 서버에서 현재 대기열 상태 가져오기
        const response = await axios.get('/api/matchmaking/status', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          timeout: 8000
        });

        const queueData = response.data;
        console.log('[FindMatchPage] 서버 응답:', queueData);

        if (queueData && queueData.inQueue) {
          console.log('[FindMatchPage] 서버 대기열 상태 확인됨, UI 복원 시작');

          // 대기열 상태 복원
          setIsSearching(true);
          setSearchPhase('searching');
          setPlayersFound(queueData.currentPlayers || 1);

          // 대기 시간 복원 (서버 시간 기준)
          if (queueData.waitTime !== undefined) {
            setElapsedTime(queueData.waitTime);
            setSearchStartTime(Date.now() - (queueData.waitTime * 1000));

            // 전역 queueTimeState와 동기화
            if (window.queueTimeState) {
              window.queueTimeState.setServerTime(
                queueData.waitTime,
                queueData.joinedAt,
                queueData.serverTime
              );
            }
          } else if (queueData.queueTime !== undefined) {
            setElapsedTime(queueData.queueTime);
            setSearchStartTime(Date.now() - (queueData.queueTime * 1000));

            // 전역 queueTimeState와 동기화
            if (window.queueTimeState) {
              window.queueTimeState.setServerTime(
                queueData.queueTime,
                queueData.joinedAt,
                queueData.serverTime
              );
            }
          } else {
            setSearchStartTime(Date.now());
            setElapsedTime(0);

            // 전역 타이머 시작
            if (window.queueTimeState) {
              window.queueTimeState.startLocalTimer();
            }
          }

          console.log('[FindMatchPage] 서버 기반 대기열 상태 복원 완료:', {
            waitTime: queueData.waitTime || queueData.queueTime,
            currentPlayers: queueData.currentPlayers,
            elapsedTime: queueData.waitTime || queueData.queueTime || 0,
            isSearching: true,
            searchPhase: 'searching'
          });
        } else {
          // 서버에서 대기열 상태가 없으면 로컬 상태 정리 (단, 최근 참가한 경우 제외)
          if (!recentJoinTime || (now - parseInt(recentJoinTime)) > 30000) {
            console.log('[FindMatchPage] 서버에 대기열 상태 없음, 로컬 상태 정리');
            setQueueStatus(false);
            resetSearchState();
          } else {
            console.log('[FindMatchPage] 최근 참가로 인해 로컬 상태 정리 건너뛰기');
          }
        }
      } catch (error) {
        console.error('[FindMatchPage] 대기열 상태 복원 중 오류:', error);

        // API 오류 시에도 최근 참가한 경우 상태 유지
        if (!recentJoinTime || (now - parseInt(recentJoinTime)) > 30000) {
          console.log('[FindMatchPage] API 오류로 인한 로컬 상태 정리');
          setQueueStatus(false);
          resetSearchState();
        } else {
          console.log('[FindMatchPage] 최근 참가로 인해 API 오류 시에도 상태 유지');

          // 로컬 상태만으로 UI 복원
          setIsSearching(true);
          setSearchPhase('searching');
          setPlayersFound(1);
          setSearchStartTime(Date.now());
          setElapsedTime(0);
        }
      }
    } else {
      // 대기열에 없으면 검색 상태 정리
      if (isSearching) {
        console.log('[FindMatchPage] 대기열 상태 없음, 검색 상태 정리');
        resetSearchState();
      }
    }
  };

  // 강제 대기열 정리 함수 (디버깅용)
  const handleForceQueueClear = async () => {
    try {
      console.log('강제 대기열 정리 시작');

      // 1. 서버 대기열 취소 시도
      const token = localStorage.getItem('token');
      if (token) {
        try {
          await axios.post('/api/matchmaking/leave', {}, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 5000
          });
          console.log('서버 대기열 취소 성공');
        } catch (apiError) {
          console.log('서버 대기열 취소 실패, 로컬만 정리:', apiError.message);
        }
      }

      // 2. 로컬 상태 완전 정리
      localStorage.setItem('inQueue', 'false');
      localStorage.setItem('matchInProgress', 'false');
      localStorage.removeItem('currentMatchId');
      localStorage.removeItem('lastMatchInfo');
      localStorage.removeItem('queueStartTime');
      localStorage.removeItem('simulatedPlayers');
      localStorage.removeItem('simulationStartTime');
      localStorage.removeItem('recentQueueJoinTime'); // 타이밍 문제 방지용 타임스탬프 정리

      // 3. 컴포넌트 상태 정리
      setIsSearching(false);
      setSearchStartTime(null);
      setElapsedTime(0);
      setMatchProgress(0);
      setSearchPhase('waiting');
      setQueuePosition(0);
      setEstimatedWaitTime(0);
      setPlayersFound(0);

      // 4. authStore 상태 정리
      setQueueStatus(false);
      setAuthMatchProgress(false);
      setMatchInfo(null);

      // 5. authStore 서버 동기화
      try {
        await useAuthStore.getState().syncWithServer();
        console.log('authStore 서버 동기화 완료');
      } catch (syncError) {
        console.log('authStore 서버 동기화 실패:', syncError.message);
      }

      toast.success('대기열 상태를 완전히 정리했습니다.');
      console.log('강제 대기열 정리 완료');

    } catch (error) {
      console.error('강제 대기열 정리 중 오류:', error);
      toast.error('대기열 정리 중 오류가 발생했습니다.');
    }
  };

  // 티어 시스템 관련 함수들
  const getTierFromMMR = (mmr) => {
    if (mmr >= 2500) return '그랜드마스터';
    if (mmr >= 2200) return '마스터';
    if (mmr >= 2000) return '다이아몬드';
    if (mmr >= 1800) return '플래티넘';
    if (mmr >= 1600) return '골드';
    if (mmr >= 1400) return '실버';
    return '브론즈';
  };

  const getTierStyles = (tier) => {
    switch(tier) {
      case '그랜드마스터':
        return 'bg-gradient-to-r from-purple-600 to-pink-500 text-white';
      case '마스터':
        return 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white';
      case '다이아몬드':
        return 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white';
      case '플래티넘':
        return 'bg-gradient-to-r from-blue-400 to-teal-400 text-white';
      case '골드':
        return 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black';
      case '실버':
        return 'bg-gradient-to-r from-gray-300 to-gray-400 text-black';
      case '브론즈':
        return 'bg-gradient-to-r from-amber-700 to-yellow-800 text-white';
      default:
        return 'bg-slate-700 text-gray-200';
    }
  };

  const getTierIcon = (tier) => {
    switch(tier) {
      case '그랜드마스터':
        return '👑';
      case '마스터':
        return '⭐';
      case '다이아몬드':
        return '💎';
      case '플래티넘':
        return '🥇';
      case '골드':
        return '🏆';
      case '실버':
        return '🥈';
      case '브론즈':
        return '🥉';
      default:
        return '🔰';
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="relative z-10 p-4">
        <div className="max-w-6xl mx-auto">
          {/* 헤더 */}
          <div className="text-center mb-8">
            <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
              매치메이킹
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              완벽한 밸런스의 경기를 위해 최적의 상대를 찾아드립니다
            </p>
          </div>

          {/* 상단 정보 패널 - 매치메이킹 상태와 플레이어 정보 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* 매치메이킹 상태 */}
            <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-600/30 rounded-3xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">매치메이킹 상태</h2>

              {!isSearching ? (
                <div className="text-center">
                  <div className="w-24 h-24 bg-slate-700/30 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-400 mb-8">{searchMessages.waiting}</p>

                  {/* 버튼 그룹 */}
                  <div className="space-y-4">
                    <button
                      onClick={() => {
                        console.log('[FindMatchPage] 매치 찾기 버튼 클릭됨!');
                        handleStartSearch();
                      }}
                      disabled={!user?.isProfileComplete || isStartingSearch}
                      className={`w-full relative overflow-hidden font-bold py-4 px-6 rounded-2xl text-lg transition-all duration-300 transform ${
                        !user?.isProfileComplete || isStartingSearch
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : buttonAnimation === 'pulse'
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white animate-pulse scale-105'
                            : buttonAnimation === 'success'
                              ? 'bg-gradient-to-r from-green-600 to-green-500 text-white scale-105'
                              : buttonAnimation === 'error'
                                ? 'bg-gradient-to-r from-red-600 to-red-500 text-white'
                                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white hover:scale-105'
                      }`}
                    >
                      {/* 로딩 스피너 */}
                      {isStartingSearch && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600">
                          <svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                      )}

                      {/* 성공 애니메이션 */}
                      {showSuccessAnimation && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-green-600 to-green-500">
                          <svg className="h-6 w-6 text-white animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}

                      <span className={isStartingSearch || showSuccessAnimation ? 'opacity-0' : 'opacity-100'}>
                        {!user?.isProfileComplete ? '프로필 설정 필요' :
                          isStartingSearch ? '매치 찾는 중...' :
                            buttonAnimation === 'joined' ? '매치메이킹 시작됨!' :
                              buttonAnimation === 'already-joined' ? '이미 대기열 참가 중' :
                                buttonAnimation === 'error' ? '다시 시도해주세요' :
                                  '매치 찾기 시작'}
                      </span>
                    </button>

                    {/* 개발용 시뮬레이션 버튼 */}
                    {isDevelopment && (
                      <button
                        onClick={handleDevMatchSimulation}
                        className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold py-3 px-6 rounded-2xl text-sm transition-all duration-300 transform hover:scale-105 border border-orange-500/30"
                      >
                        🔧 개발용 빠른 매치 시뮬레이션
                      </button>
                    )}

                    {/* 강제 대기열 정리 버튼 (문제 해결용) */}
                    <button
                      onClick={handleForceQueueClear}
                      className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white font-bold py-2 px-6 rounded-2xl text-xs transition-all duration-300 transform hover:scale-105 border border-gray-500/30"
                      title="대기열 상태가 꼬였을 때 사용하는 강제 정리 버튼"
                    >
                      🔧 대기열 상태 강제 정리
                    </button>
                  </div>

                  {!user?.isProfileComplete && (
                    <p className="text-yellow-400 text-sm mt-4">
                      프로필 설정을 완료해야 매치메이킹을 시작할 수 있습니다.
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  {/* 상태 아이콘 */}
                  <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 transition-all duration-500 ${
                    searchPhase === 'found' ? 'bg-green-500/20 animate-bounce' :
                      searchPhase === 'failed' ? 'bg-red-500/20' :
                        'bg-blue-500/20 animate-pulse'
                  }`}>
                    {searchPhase === 'found' ? (
                      <svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : searchPhase === 'failed' ? (
                      <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <svg className="w-12 h-12 text-blue-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    )}
                  </div>

                  {/* 시간 및 상태 */}
                  <div className="mb-6">
                    <div className="text-3xl font-bold text-blue-400 mb-2">{formatTime(elapsedTime)}</div>
                    <p className={`text-lg transition-colors duration-300 ${
                      searchPhase === 'found' ? 'text-green-400' :
                        searchPhase === 'failed' ? 'text-red-400' :
                          'text-gray-300'
                    }`}>
                      {searchMessages[searchPhase]}
                    </p>
                  </div>

                  {/* 플레이어 모집 현황 */}
                  {searchPhase !== 'failed' && (
                    <div className="mb-6">
                      <div className="bg-slate-700/50 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm text-gray-400">플레이어 모집</span>
                          <span className="text-sm text-gray-400">MMR 기반 매칭</span>
                        </div>
                        <div className="text-center">
                          <div className="text-4xl font-bold text-blue-400 mb-2">
                            {playersFound}/10
                          </div>
                          <div className="text-sm text-gray-300">
                            {playersFound < 10 ? `${10 - playersFound}명 더 필요` : '매치 준비 완료!'}
                          </div>
                        </div>
                        {/* 플레이어 아이콘 표시 */}
                        <div className="flex justify-center mt-4 gap-1">
                          {Array.from({ length: 10 }, (_, i) => (
                            <div
                              key={i}
                              className={`w-6 h-6 rounded-full border-2 transition-all duration-300 ${
                                i < playersFound
                                  ? 'bg-blue-500 border-blue-400 shadow-lg shadow-blue-500/50'
                                  : 'bg-slate-600 border-slate-500'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 대기열 상세 정보 - 시간 표시 문제로 인해 비활성화
                  {searchPhase === 'searching' && queuePosition > 0 && (
                    <div className="bg-gradient-to-r from-slate-700/30 to-slate-600/20 rounded-2xl p-4 mb-6 border border-slate-600/30">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="text-center">
                          <div className="text-gray-400 mb-1">대기열 순서</div>
                          <div className="text-2xl font-bold text-blue-400">{queuePosition}번째</div>
                    </div>
                        <div className="text-center">
                          <div className="text-gray-400 mb-1">예상 대기시간</div>
                          <div className="text-2xl font-bold text-purple-400">
                            {getEstimatedWaitTime() ? `${getEstimatedWaitTime()}초` : '계산 중...'}
            </div>
          </div>
            </div>
                      <div className="mt-3 pt-3 border-t border-slate-600/30">
                        <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                          <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse"></div>
                          <span>매칭 알고리즘이 최적의 상대를 찾고 있습니다</span>
            </div>
          </div>
                    </div>
                  )}
                  */}

                  {/* 취소 버튼 */}
                  {searchPhase !== 'found' && searchPhase !== 'failed' && (
                    <button
                      onClick={handleStopSearch}
                      disabled={isStoppingSearch}
                      className={`w-full relative overflow-hidden font-bold py-4 px-6 rounded-2xl text-lg transition-all duration-300 transform ${
                        isStoppingSearch
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : buttonAnimation === 'stopping'
                            ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white animate-pulse scale-105'
                            : buttonAnimation === 'cancel-success'
                              ? 'bg-gradient-to-r from-green-600 to-green-500 text-white scale-105'
                              : buttonAnimation === 'warning'
                                ? 'bg-gradient-to-r from-yellow-600 to-orange-500 text-white'
                                : buttonAnimation === 'error'
                                  ? 'bg-gradient-to-r from-red-600 to-red-500 text-white'
                                  : 'bg-red-600 hover:bg-red-700 text-white hover:scale-105'
                      }`}
                    >
                      {/* 로딩 스피너 */}
                      {isStoppingSearch && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-orange-600 to-red-600">
                          <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                      )}

                      <span className={isStoppingSearch ? 'opacity-0' : 'opacity-100'}>
                        {isStoppingSearch ? '취소 중...' :
                          buttonAnimation === 'cancel-success' ? '취소 완료!' :
                            buttonAnimation === 'warning' ? '강제 취소됨' :
                              buttonAnimation === 'error' ? '취소 실패' :
                                '매치 찾기 취소'}
                      </span>
                    </button>
                  )}

                  {/* 재시도 버튼 */}
                  {searchPhase === 'failed' && (
                    <button
                      onClick={handleStartSearch}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-4 px-6 rounded-2xl text-lg transition-all duration-300"
                    >
                      다시 시도하기
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 플레이어 정보 */}
            <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-600/30 rounded-3xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">플레이어 정보</h2>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">배틀태그</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{user?.battleTag || user?.battletag}</span>
                    <span className="text-lg">{getTierIcon(getTierFromMMR(user?.mmr || 1500))}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-400">현재 MMR</span>
                  <span className="text-blue-400 font-bold">{user?.mmr || 1500}</span>
                </div>

                {/* 선호 역할 선택 */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-400">선호 역할</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {roles.map((role) => (
                      <button
                        key={role.id}
                        onClick={() => setSelectedRole(role.id)}
                        disabled={isSearching}
                        className={`p-3 rounded-xl border-2 transition-all duration-300 text-left ${
                          selectedRole === role.id
                            ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/25'
                            : 'border-slate-600/50 bg-slate-700/20 hover:border-slate-500 hover:bg-slate-700/30'
                        } ${isSearching ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{role.icon}</span>
                          <div className="text-sm font-bold text-white">{role.name}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 통계 및 전장 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* 대기 중인 플레이어 */}
            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-6 text-center hover:border-blue-400/50 transition-all duration-300 group">
              <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="text-3xl font-bold text-blue-400 mb-2 tabular-nums">
                {queueStats.playersInQueue}
              </div>
              <div className="text-gray-300 font-medium mb-2">대기 중인 플레이어</div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-blue-300">실시간 업데이트</span>
              </div>
            </div>

            {/* 진행 중인 매치 */}
            <div className="bg-gradient-to-br from-pink-500/10 to-pink-600/5 backdrop-blur-sm border border-pink-500/30 rounded-2xl p-6 text-center hover:border-pink-400/50 transition-all duration-300 group">
              <div className="w-16 h-16 bg-pink-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-3xl font-bold text-pink-400 mb-2 tabular-nums">
                {queueStats.activeMatches}
              </div>
              <div className="text-gray-300 font-medium mb-2">진행 중인 매치</div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-pink-300">라이브 게임</span>
              </div>
            </div>
          </div>

          {/* 메인 설정 영역 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 티어 시스템 */}
            <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-600/30 rounded-3xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                티어 시스템
              </h2>

              <div className="grid grid-cols-1 gap-3">
                <div className={`px-4 py-3 rounded-xl ${getTierStyles('그랜드마스터')}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{getTierIcon('그랜드마스터')}</span>
                      <span className="font-bold">그랜드마스터</span>
                    </div>
                    <span className="text-sm opacity-90">2500+</span>
                  </div>
                </div>
                <div className={`px-4 py-3 rounded-xl ${getTierStyles('마스터')}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{getTierIcon('마스터')}</span>
                      <span className="font-bold">마스터</span>
                    </div>
                    <span className="text-sm opacity-90">2200+</span>
                  </div>
                </div>
                <div className={`px-4 py-3 rounded-xl ${getTierStyles('다이아몬드')}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{getTierIcon('다이아몬드')}</span>
                      <span className="font-bold">다이아몬드</span>
                    </div>
                    <span className="text-sm opacity-90">2000+</span>
                  </div>
                </div>
                <div className={`px-4 py-3 rounded-xl ${getTierStyles('플래티넘')}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{getTierIcon('플래티넘')}</span>
                      <span className="font-bold">플래티넘</span>
                    </div>
                    <span className="text-sm opacity-90">1800+</span>
                  </div>
                </div>
                <div className={`px-4 py-3 rounded-xl ${getTierStyles('골드')}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{getTierIcon('골드')}</span>
                      <span className="font-bold">골드</span>
                    </div>
                    <span className="text-sm opacity-90">1600+</span>
                  </div>
                </div>
                <div className={`px-4 py-3 rounded-xl ${getTierStyles('실버')}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{getTierIcon('실버')}</span>
                      <span className="font-bold">실버</span>
                    </div>
                    <span className="text-sm opacity-90">1400+</span>
                  </div>
                </div>
                <div className={`px-4 py-3 rounded-xl ${getTierStyles('브론즈')}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{getTierIcon('브론즈')}</span>
                      <span className="font-bold">브론즈</span>
                    </div>
                    <span className="text-sm opacity-90">&lt;1400</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 전장 목록 */}
            <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-600/30 rounded-3xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                전장 목록
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {battlegrounds.map((bg, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-slate-700/20 border border-slate-600/30 hover:bg-slate-700/30 hover:border-slate-500/50 transition-all duration-200">
                    <span className="text-xl">{bg.icon}</span>
                    <span className="text-white font-medium text-sm">{bg.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FindMatchPage;


