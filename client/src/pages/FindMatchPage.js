import React, { useState, useEffect } from 'react';
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

  // 전장 로테이션 리스트
  const battlegrounds = [
    { name: '저주받은 골짜기', icon: '🌙', status: 'active' },
    { name: '용의 둥지', icon: '🐉', status: 'next' },
    { name: '불지옥 신단', icon: '🔥', status: 'upcoming' },
    { name: '하늘 사원', icon: '☁️', status: 'upcoming' },
    { name: '거미 여왕의 무덤', icon: '🕷️', status: 'upcoming' }
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

    // 대기열 상태 복원
    restoreQueueState();

    fetchQueueStats();
    const interval = setInterval(fetchQueueStats, 3000); // 3초마다 업데이트
    return () => clearInterval(interval);
  }, [isAuthenticated, navigate, inQueue]);

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

  // 매치 찾기 타이머
  useEffect(() => {
    let interval;
    if (isSearching && searchStartTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - searchStartTime) / 1000);
        setElapsedTime(elapsed);

        // 실제 대기열 상태인 경우 서버에서 플레이어 수 가져오기
        if (inQueue) {
          // 서버 상태 기반으로 플레이어 수 업데이트는 fetchQueueStats에서 처리
          return;
        }

        // 시뮬레이션 모드에서만 플레이어 수 증가 로직 적용
        const targetPlayers = Math.min(10, Math.floor((elapsed / 3) + 1)); // 3초마다 1명씩 증가
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
    }
    return () => clearInterval(interval);
  }, [isSearching, searchStartTime, inQueue]);

  // 대기열 통계 업데이트 (개선된 서버 응답 처리)
  const fetchQueueStats = async () => {
    try {
      // 실제 대기열 상태인 경우 서버 API 호출
      if (inQueue && isSearching) {
        try {
          const response = await axios.get('/api/matchmaking/status');
          const queueData = response.data;

          if (queueData.inQueue) {
            // 서버에서 받은 실제 데이터 사용 (개선된 응답 처리)
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
              waitTime: queueData.waitTime
            });
            return;
          }
        } catch (apiError) {
          console.error('[FindMatchPage] 서버 대기열 상태 가져오기 실패:', apiError);
          // API 실패 시 아래 시뮬레이션 로직으로 폴백
        }
      }

      // 시뮬레이션 모드 또는 API 실패 시
      const baseStats = {
        playersInQueue: Math.floor(Math.random() * 50) + 15,
        activeMatches: Math.floor(Math.random() * 20) + 8
      };

      // 매치 찾기 중일 때 대기열 수 조정 (시뮬레이션)
      if (isSearching && !inQueue) {
        baseStats.playersInQueue = Math.max(1, baseStats.playersInQueue - 1);
        setQueuePosition(Math.floor(Math.random() * 5) + 1);
        setEstimatedWaitTime(Math.max(30, 120 - elapsedTime));
      }

      setQueueStats(baseStats);
    } catch (error) {
      console.error('큐 통계 가져오기 실패:', error);
    }
  };

  const handleStartSearch = async () => {
    if (!user?.isProfileComplete) {
      toast.warning('프로필 설정을 먼저 완료해주세요.');
      navigate('/profile/setup');
        return;
      }

    try {
      setIsSearching(true);
      setSearchStartTime(Date.now());
      setElapsedTime(0);
      setMatchProgress(0);
      setSearchPhase('searching');
      setPlayersFound(1); // 자신부터 시작

      // 사용자 피드백 개선
      toast.info(`${roles.find(r => r.id === selectedRole)?.name} 역할로 매치메이킹을 시작합니다!`, {
        icon: roles.find(r => r.id === selectedRole)?.icon
      });

      const token = localStorage.getItem('token');

      // API 호출 시뮬레이션
      try {
      const response = await axios.post('/api/matchmaking/join', {
          preferredRole: selectedRole
        }, {
          headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
          // 매치 찾기 시뮬레이션 개선
          const matchTime = Math.random() * 25000 + 15000; // 15-40초

          setTimeout(() => {
            const success = Math.random() > 0.2; // 80% 성공률

            if (success) {
              handleMatchFound();
        } else {
              handleMatchFailed();
            }
          }, matchTime);
        }
      } catch (apiError) {
        // API 오류 시 로컬 시뮬레이션으로 대체
        console.log('API 호출 실패, 시뮬레이션 모드로 전환');

        const matchTime = Math.random() * 25000 + 15000;
        setTimeout(() => {
          const success = Math.random() > 0.2;
          if (success) {
            handleMatchFound();
      } else {
            handleMatchFailed();
          }
        }, matchTime);
      }

    } catch (error) {
      console.error('매치메이킹 시작 실패:', error);
      toast.error('매치메이킹 시작에 실패했습니다.');
      resetSearchState();
    }
  };

  const handleStopSearch = async () => {
    try {
      const token = localStorage.getItem('token');

      // API 호출 시도
      try {
        await axios.post('/api/matchmaking/leave', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (apiError) {
        console.log('API 호출 실패, 로컬에서 처리');
      }

      resetSearchState();
      toast.info('매치메이킹을 취소했습니다.');
    } catch (error) {
      console.error('매치메이킹 취소 실패:', error);
      toast.error('매치메이킹 취소에 실패했습니다.');
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
        resetSearchState();

        // 매치 상세 페이지로 이동
        toast.info(`맵: ${matchInfo.map} | 모드: ${matchInfo.gameMode}`, {
          autoClose: 2000
        });

        // 매치 상세 페이지로 이동
        navigate('/match-details', { state: { matchInfo } });
      }, 2000);

    } catch (error) {
      console.error('일반 매치 찾기 중 오류:', error);

      // 오류 발생 시 기존 방식으로 폴백
      const matchInfo = {
        matchId: `match_${Date.now()}`,
        map: battlegrounds.find(bg => bg.status === 'active')?.name || '저주받은 골짜기',
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
      map: battlegrounds.find(bg => bg.status === 'active')?.name || '저주받은 골짜기',
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

    toast.info('🔧 개발용 매치 시뮬레이션을 시작합니다!');

    setIsSearching(true);
    setSearchStartTime(Date.now());
    setElapsedTime(0);
    setMatchProgress(0);
    setSearchPhase('searching');
    setPlayersFound(1);

    try {
      // 개발용 전용 사용자 데이터 가져오기
      const realUsers = await fetchUsersForDevelopment();

      // 빠른 시뮬레이션 (3-8초)
      const quickMatchTime = Math.random() * 5000 + 3000;

      // 플레이어 수 빠른 증가 애니메이션
      const playerInterval = setInterval(() => {
        setPlayersFound(prev => {
          const newCount = prev + 1;
          if (newCount >= 10) {
            clearInterval(playerInterval);
            return 10;
          }
          return newCount;
        });
      }, 300);

      setTimeout(() => {
        clearInterval(playerInterval);
        setPlayersFound(10);

        const success = Math.random() > 0.1; // 90% 성공률

        if (success) {
          handleDevMatchFound(realUsers);
    } else {
          handleMatchFailed();
        }
      }, quickMatchTime);

    } catch (error) {
      console.error('개발용 매치 시뮬레이션 오류:', error);
      handleMatchFailed();
    }
  };

  // 개발용 사용자 데이터 가져오기 (분리된 함수)
  const fetchUsersForDevelopment = async () => {
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

      console.log('개발용 매치에서 리더보드 API로 사용자 목록 가져오기 성공:', realUsers.length);
    } catch (apiError) {
      console.warn('리더보드 API 실패, 기본 사용자 API 시도:', apiError.message);

      try {
        const fallbackResponse = await axios.get('/api/users');

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
        console.log('개발용 매치에서 기본 사용자 API로 사용자 목록 가져오기 성공:', realUsers.length);
      } catch (fallbackError) {
        console.warn('기본 사용자 API도 실패:', fallbackError.message);
      }
    }

    return realUsers;
  };

  // 개발용 매치 찾기 성공 처리 (실제 DB 유저 기반)
  const handleDevMatchFound = (realUsers = []) => {
    setSearchPhase('found');
    setMatchProgress(100);

    // 성공 효과
    toast.success('🎉 개발용 매치를 찾았습니다! 실제 DB 유저 기반으로 구성됩니다.', {
      autoClose: 3000
    });

    // 실제 DB 유저 기반 매치 정보 생성
    const matchInfo = generateRealUserMatch(realUsers, true);

    // authStore에 매치 진행 상태 설정
    setAuthMatchProgress(true, matchInfo.matchId);
    setMatchInfo(matchInfo);

    // localStorage에 매치 정보 저장
    localStorage.setItem('lastMatchInfo', JSON.stringify(matchInfo));
    localStorage.setItem('matchInProgress', 'true');
    localStorage.setItem('currentMatchId', matchInfo.matchId);

    // 매치 상세 정보 표시
    setTimeout(() => {
      resetSearchState();

      // 매치 상세 페이지로 이동
      toast.info(`맵: ${matchInfo.map} | 모드: ${matchInfo.gameMode}`, {
        autoClose: 2000
      });

      // 매치 상세 페이지로 이동
    navigate('/match-details', { state: { matchInfo } });
    }, 2000);
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

  // 대기열 상태 복원 함수
  const restoreQueueState = async () => {
    // 전역 대기열 상태 확인
    if (inQueue) {
      console.log('[FindMatchPage] 전역 대기열 상태 감지, 매치메이킹 상태 복원');

      try {
        // 서버에서 현재 대기열 상태 가져오기
        const response = await axios.get('/api/matchmaking/status');
        const queueData = response.data;

        if (queueData.inQueue) {
          // 대기열 상태 복원
          setIsSearching(true);
          setSearchPhase('searching');
          setPlayersFound(queueData.currentPlayers || 1);

          // 대기 시간 복원
          if (queueData.waitTime) {
            setElapsedTime(queueData.waitTime);
            setSearchStartTime(Date.now() - (queueData.waitTime * 1000));
          } else {
            setSearchStartTime(Date.now());
            setElapsedTime(0);
          }

          // 전역 큐 타이머 상태 확인
          if (window.queueTimeState && window.queueTimeState.time > 0) {
            setElapsedTime(window.queueTimeState.time);
            setSearchStartTime(Date.now() - (window.queueTimeState.time * 1000));
          }

          console.log('[FindMatchPage] 대기열 상태 복원 완료:', {
            waitTime: queueData.waitTime,
            currentPlayers: queueData.currentPlayers,
            elapsedTime: queueData.waitTime || window.queueTimeState?.time || 0
          });
        }
      } catch (error) {
        console.error('[FindMatchPage] 대기열 상태 복원 중 오류:', error);

        // API 오류 시 로컬 상태로 복원
        if (inQueue) {
          setIsSearching(true);
          setSearchPhase('searching');
          setPlayersFound(1);
          setSearchStartTime(Date.now());
          setElapsedTime(0);
        }
      }
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
                      onClick={handleStartSearch}
                      disabled={!user?.isProfileComplete}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 px-6 rounded-2xl text-lg transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed"
                    >
                      {!user?.isProfileComplete ? '프로필 설정 필요' : '매치 찾기 시작'}
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-2xl text-lg transition-all duration-300"
            >
                      매치 찾기 취소
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
                  <span className="text-white font-medium">{user?.battleTag || user?.battletag}</span>
          </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-400">현재 MMR</span>
                  <span className="text-blue-400 font-bold">{user?.mmr || 1500}</span>
              </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-400">선호 역할</span>
                  <div className="flex gap-1">
                    {getPreferredRoles() ? (
                      getPreferredRoles().map((role, index) => (
                        <span key={index} className="bg-slate-700/50 text-gray-300 px-2 py-1 rounded text-xs">
                          {role}
                        </span>
                      ))
                    ) : (
                      <button
                        onClick={() => navigate('/profile/setup')}
                        className="text-yellow-400 hover:text-yellow-300 text-sm underline"
                      >
                        설정하기
                      </button>
                    )}
                    </div>
                    </div>
                  </div>
                </div>
              </div>

          {/* 통계 및 전장 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* 대기 중인 플레이어 */}
            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-6 text-center hover:border-blue-400/50 transition-all duration-300 group">
              <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 515.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
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

            {/* 서버 상태 */}
            <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 backdrop-blur-sm border border-green-500/30 rounded-2xl p-6 text-center hover:border-green-400/50 transition-all duration-300 group">
              <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
                </svg>
                            </div>
              <div className="text-2xl font-bold text-green-400 mb-2">
                온라인
                        </div>
              <div className="text-gray-300 font-medium mb-2">서버 상태</div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-300">정상 운영</span>
                      </div>
                    </div>
                    </div>

          {/* 메인 설정 영역 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 역할 선택 */}
            <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-600/30 rounded-3xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                선호 역할
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {roles.map((role) => (
                    <button
                    key={role.id}
                    onClick={() => setSelectedRole(role.id)}
                    disabled={isSearching}
                    className={`p-4 rounded-2xl border-2 transition-all duration-300 text-center ${
                      selectedRole === role.id
                        ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/25'
                        : 'border-slate-600/50 bg-slate-700/20 hover:border-slate-500 hover:bg-slate-700/30'
                    } ${isSearching ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="text-2xl mb-2">{role.icon}</div>
                    <div className="text-sm font-bold text-white mb-1">{role.name}</div>
                    <div className="text-xs text-gray-400">{role.description}</div>
                    </button>
                ))}
              </div>
            </div>

            {/* 전장 로테이션 상세 */}
            <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-600/30 rounded-3xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  </div>
                전장 로테이션
              </h2>

              <div className="space-y-3">
                {battlegrounds.map((bg, index) => (
                  <div key={index} className={`flex items-center justify-between p-3 rounded-xl ${
                    bg.status === 'active' ? 'bg-green-500/10 border border-green-500/30' :
                    bg.status === 'next' ? 'bg-blue-500/10 border border-blue-500/30' :
                    'bg-slate-700/20 border border-slate-600/30'
                  }`}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{bg.icon}</span>
                      <span className="text-white font-medium">{bg.name}</span>
                </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      bg.status === 'active' ? 'bg-green-500/20 text-green-400' :
                      bg.status === 'next' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-slate-600/20 text-gray-400'
                    }`}>
                      {bg.status === 'active' ? '현재' : bg.status === 'next' ? '다음' : '대기'}
                    </span>
          </div>
                ))}
        </div>
      </div>
        </div>
        </div>

        {/* 팁 */}
        <div className="mt-8">
          <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-500/30 rounded-3xl p-6">
            <h3 className="text-lg font-bold text-yellow-400 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              매치메이킹 팁
            </h3>
            <ul className="text-yellow-200 text-sm space-y-2">
              <li>• 피크 시간대(저녁 7-11시)에 더 빠른 매칭이 가능합니다</li>
              <li>• 여러 역할을 선택하면 매칭 속도가 향상됩니다</li>
              <li>• 비슷한 MMR의 플레이어들과 매칭됩니다</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FindMatchPage;


