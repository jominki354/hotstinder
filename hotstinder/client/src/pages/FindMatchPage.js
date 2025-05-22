import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link , useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import axios from 'axios';
import './FindMatchPage.css'; // CSS 파일 import 추가
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/common/LoadingSpinner';
import QueueStatus from '../components/queue/QueueStatus';
import ReplayUploadModal from '../components/common/ReplayUploadModal'; // 리플레이 업로드 모달 추가

// 대기 시간을 전역적으로 관리하기 위한 상태 객체
const queueTimeState = {
  time: 0,
  listeners: new Set(),
  startTime: null,
  
  // 대기 시간 시작
  start() {
    this.startTime = Date.now();
    this.time = 0;
    this.notify();
    
    if (this.intervalId) clearInterval(this.intervalId);
    
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
  },
  
  // 대기 시간 초기화
  reset() {
    this.time = 0;
    this.startTime = null;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.notify();
  },
  
  // 수동으로 시간 설정 (초 단위)
  setTime(seconds) {
    if (seconds === 0) {
      this.reset();
      return;
    }
    
    if (!this.startTime) {
      this.startTime = Date.now() - (seconds * 1000);
      if (!this.intervalId) {
        this.start();
      }
    }
    this.time = seconds;
    this.notify();
  },
  
  // 리스너 추가
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  },
  
  // 모든 리스너에게 변경 알림
  notify() {
    this.listeners.forEach(callback => callback(this.time));
  }
};

// 전역 접근을 위해 window 객체에 할당
window.queueTimeState = queueTimeState;

const FindMatchPage = () => {
  const { isAuthenticated, user, setQueueStatus: setGlobalQueueStatus, inQueue: globalInQueue, matchInProgress: globalMatchInProgress, setMatchProgress, currentMatchId } = useAuthStore();
  const navigate = useNavigate();
  
  const [inQueue, setInQueue] = useState(false);
  const [queueStatus, setQueueStatus] = useState({
    currentPlayers: 0,
    requiredPlayers: 10,
    estimatedTime: '00:00'
  });
  const [matchFound, setMatchFound] = useState(false);
  const [error, setError] = useState('');
  const [showProfileRecommendation, setShowProfileRecommendation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userInfo, setUserInfo] = useState({
    mmr: null,
    preferredRole: '',
    battletag: '',
    preferredRoles: []
  });
  const [loadingUserInfo, setLoadingUserInfo] = useState(false);
  const [showReplayModal, setShowReplayModal] = useState(false);
  // 로컬 매치 진행 중 상태 (글로벌 상태와 동기화를 위해 유지)
  const [matchInProgress, setMatchInProgress] = useState(false);
  // 매치 정보 화면 표시 상태
  const [showMatchDetails, setShowMatchDetails] = useState(false);
  // 관리자 호출 버튼 상태
  const [callingAdmin, setCallingAdmin] = useState(false);
  // 리플레이 제출 버튼 상태
  const [submittingReplay, setSubmittingReplay] = useState(false);
  
  // 대기열 시간 (전역 상태에서 가져옴)
  const [queueTimeSeconds, setQueueTimeSeconds] = useState(queueTimeState.time);
  // 우주 입자 상태
  const [particles, setParticles] = useState([]);
  
  // 매치 정보 상태 추가
  const [matchInfo, setMatchInfo] = useState({
    blueTeam: [],
    redTeam: [],
    blueTeamAvgMmr: 0,
    redTeamAvgMmr: 0,
    map: '',
    matchId: '',
    channelCreator: ''
  });
  
  // 시뮬레이션 타이머 ID 저장용 ref 추가
  const simulationTimerRef = useRef(null);
  // 시뮬레이션 상태 추가
  const [isSimulating, setIsSimulating] = useState(false);

  // 컴포넌트 언마운트 시 시뮬레이션 타이머 정리
  useEffect(() => {
    return () => {
      if (simulationTimerRef.current) {
        clearInterval(simulationTimerRef.current);
        simulationTimerRef.current = null;
      }
    };
  }, []);

  // 전역 타이머에 구독
  useEffect(() => {
    const updateTime = (time) => {
      setQueueTimeSeconds(time);
    };
    
    // 현재 시간 즉시 반영
    updateTime(queueTimeState.time);
    
    // 구독
    const unsubscribe = queueTimeState.subscribe(updateTime);
    
    return () => {
      unsubscribe(); // 구독 해제
    };
  }, []);

  // 맵 배열 선언
  const maps = [
    '용의 둥지', '저주받은 골짜기', '공포의 정원', '하늘 사원', 
    '거미 여왕의 무덤', '영원의 전쟁터', '불지옥 신단', 
    '파멸의 탑', '볼스카야 공장', '알터랙 고개'
  ];

  // 전역 대기열 상태와 로컬 상태 동기화
  useEffect(() => {
    // 전역 상태가 true인 경우 로컬 상태도 true로 설정
    if (globalInQueue && !inQueue) {
      setInQueue(true);
      
      // 전역 상태가 true인데 로컬 상태가 false라면 대기열 정보 로드
      fetchQueueStatus();
      
      // 타이머 시작 (아직 시작되지 않은 경우)
      if (!queueTimeState.startTime) {
        queueTimeState.start();
      }
    }
  }, [globalInQueue, inQueue]);

  // 대기열 상태 가져오기 함수
  const fetchQueueStatus = async () => {
    try {
      const res = await axios.get('/api/matchmaking/status');
      setQueueStatus(res.data);
      
      // 10명이 모이면 매치 찾음 처리
      if (res.data.currentPlayers === res.data.requiredPlayers) {
        setMatchFound(true);
        setGlobalQueueStatus(false); // 매치 찾으면 대기열 상태 false로 설정
      }
    } catch (err) {
      console.error('대기열 상태 가져오기 오류:', err);
    }
  };
  
  // 대기열 상태 폴링 함수
  useEffect(() => {
    let interval;
    
    if (inQueue && !matchFound) {
      // 초기 상태 가져오기
      fetchQueueStatus();
      
      // 3초마다 업데이트
      interval = setInterval(fetchQueueStatus, 3000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [inQueue, matchFound]);

  // 우주 입자 생성 효과
  useEffect(() => {
    if (!inQueue) {
      setParticles([]);
      return;
    }
    
    // 초기 입자 생성
    const initialParticles = [];
    const particleCount = window.innerWidth < 768 ? 200 : 400; // 입자 수 2배 증가
    
    for (let i = 0; i < particleCount; i++) {
      // 더 자연스러운 먼지 효과를 위한 다양한 속성 설정
      const size = Math.random() * 6 + 1.2; // 1.2-7.2px 크기 (20% 증가)
      const moveRange = 60 + Math.random() * 300; // 60-360px 움직임 범위 (20% 증가)
      const speed = 15 + Math.random() * 25; // 15-40초 움직임 속도
      
      initialParticles.push({
        id: i,
        top: `${Math.random() * 100}vh`,
        left: `${Math.random() * 100}vw`,
        size: size,
        opacity: Math.random() * 0.4 + 0.1, // 0.1-0.5 사이의 투명도
        moveX: `${(Math.random() - 0.5) * moveRange}px`,
        moveY: `${(Math.random() - 0.5) * moveRange}px`,
        duration: speed,
        // 각 입자마다 다른 애니메이션 지연 시간 추가
        delay: Math.random() * 5,
        scale: 0.8 + Math.random() * 0.4 // 0.8-1.2 사이의 스케일 변화
      });
    }
    
    setParticles(initialParticles);
    
    // 주기적으로 새 입자 생성
    const interval = setInterval(() => {
      if (inQueue) {
        // 새 입자도 다양한 속성으로 생성
        const size = Math.random() * 6 + 1.2; // 크기 20% 증가
        const moveRange = 60 + Math.random() * 300; // 움직임 범위 20% 증가
        const speed = 15 + Math.random() * 25;
        
        const newParticle = {
          id: Date.now(),
          top: `${Math.random() * 100}vh`,
          left: `${Math.random() * 100}vw`,
          size: size,
          opacity: Math.random() * 0.4 + 0.1,
          moveX: `${(Math.random() - 0.5) * moveRange}px`,
          moveY: `${(Math.random() - 0.5) * moveRange}px`,
          duration: speed,
          delay: Math.random() * 5,
          scale: 0.8 + Math.random() * 0.4
        };
        
        setParticles(prev => [...prev.slice(-399), newParticle]); // 최대 400개로 증가
      }
    }, 200); // 200ms로 더 빠르게 생성
    
    return () => {
      clearInterval(interval);
      setParticles([]);
    };
  }, [inQueue]);

  // 사용자 최신 정보 가져오기
  useEffect(() => {
    const fetchUserData = async () => {
      if (!isAuthenticated || !user || !user._id) return;
      
      try {
        setLoadingUserInfo(true);
        console.log('사용자 데이터 가져오는 중... 사용자 ID:', user._id);
        
        // 서버에서 최신 사용자 데이터를 가져옴
        const response = await axios.get(`/api/users/${user._id}`);
        
        if (response.data && response.data.user) {
          const userData = response.data.user;
          console.log('서버에서 가져온 사용자 정보:', userData);
          
          const userInfo = {
            mmr: userData.mmr || 1500,
            preferredRole: userData.preferredRoles && userData.preferredRoles.length > 0 
              ? userData.preferredRoles[0] 
              : '미설정',
            battletag: userData.battletag || user.battletag || user.battleTag || '',
            preferredRoles: userData.preferredRoles || []
          };
          
          setUserInfo(userInfo);
        } else {
          // 서버 응답이 없거나 사용자 정보가 없는 경우 전역 상태의 사용자 정보 사용
          setUserInfo({
            mmr: user.mmr || 1500,
            preferredRole: user.preferredRoles && user.preferredRoles.length > 0 
              ? user.preferredRoles[0] 
              : '미설정',
            battletag: user.battletag || user.battleTag || '',
            preferredRoles: user.preferredRoles || []
          });
        }
      } catch (err) {
        console.error('사용자 데이터 가져오기 오류:', err);
        
        // 오류 발생 시 Zustand 상태의 사용자 정보 사용
        setUserInfo({
          mmr: user.mmr || 1500,
          preferredRole: user.preferredRoles && user.preferredRoles.length > 0 
            ? user.preferredRoles[0] 
            : '미설정',
          battletag: user.battletag || user.battleTag || '',
          preferredRoles: user.preferredRoles || []
        });
      } finally {
        setLoadingUserInfo(false);
      }
    };
    
    fetchUserData();
  }, [isAuthenticated, user]);

  // 프로필 설정 확인
  useEffect(() => {
    if (isAuthenticated && user) {
      // 프로필이 미설정 상태인지 확인
      const profileIncomplete = !user.isProfileComplete || 
                               !user.preferredRoles || 
                               user.preferredRoles.length === 0 || 
                               !user.favoriteHeroes || 
                               user.favoriteHeroes.length === 0;
                               
      setShowProfileRecommendation(profileIncomplete);
    }
  }, [isAuthenticated, user]);

  // 매치가 찾아졌을 때 매치 정보 생성 (한 번만 실행)
  useEffect(() => {
    if (matchFound && matchInfo.blueTeam.length === 0) {
      generateMatchInfo();
    }
  }, [matchFound, matchInfo.blueTeam.length]);

  // 매치 찾음 확인 후 즉시 이동
  useEffect(() => {
    if (matchFound && matchInfo.matchId) {
      closeMatchFound();
    }
  }, [matchFound, matchInfo.matchId]);

  // 임의의 매치 정보 생성 함수
  const generateMatchInfo = () => {
    console.log('임의의 매치 정보 생성 중...');
    
    // 이미 매치 정보가 있으면 다시 생성하지 않음
    if (matchInfo.blueTeam.length > 0) {
      return matchInfo;
    }
    
    // 가상의 플레이어 10명 생성
    const roles = ['탱커', '전문가', '투사', '힐러', '원거리 암살자', '근접 암살자'];
    let players = [];
    
    // 현재 사용자 정보
    const currentPlayer = {
      id: user?._id || 'current-user',
      battletag: userInfo.battletag || user?.battletag || '현재사용자#1234',
      mmr: userInfo.mmr || user?.mmr || 1500,
      role: userInfo.preferredRoles && userInfo.preferredRoles.length > 0 
        ? userInfo.preferredRoles[0]
        : (user?.preferredRoles && user.preferredRoles.length > 0 
            ? user.preferredRoles[0] 
            : '탱커')
    };
    
    // 현재 사용자 추가
    players.push(currentPlayer);
    
    // 나머지 9명의 가상 플레이어 생성
    for (let i = 0; i < 9; i++) {
      const userMmr = currentPlayer.mmr || 1500;
      const randomMMR = userMmr + Math.floor(Math.random() * 200) - 100;
      const randomRole = roles[Math.floor(Math.random() * roles.length)];
      const randomBattleTag = `Player#${Math.floor(1000 + Math.random() * 9000)}`;
      
      players.push({
        id: `player-${i}`,
        battletag: randomBattleTag,
        mmr: randomMMR,
        role: randomRole
      });
    }
    
    // 무작위로 팀 분배
    const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
    const blueTeam = shuffledPlayers.slice(0, 5);
    const redTeam = shuffledPlayers.slice(5, 10);
    
    // MMR 기준으로 정렬 (내림차순)
    const sortedBlueTeam = [...blueTeam].sort((a, b) => b.mmr - a.mmr);
    const sortedRedTeam = [...redTeam].sort((a, b) => b.mmr - a.mmr);
    
    // 팀 MMR 평균 계산
    const blueTeamAvgMmr = Math.round(sortedBlueTeam.reduce((acc, p) => acc + p.mmr, 0) / 5);
    const redTeamAvgMmr = Math.round(sortedRedTeam.reduce((acc, p) => acc + p.mmr, 0) / 5);
    
    // 무작위 맵 선택
    const randomMap = maps[Math.floor(Math.random() * maps.length)];
    
    // 채널 개설자 (레드팀에서 무작위로 선택)
    const channelCreator = sortedRedTeam[0].battletag;
    
    // 날짜 기반 고유 매치 ID 생성 (YYYYMMDD-HHMM-순번)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const sequence = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
    
    const matchId = `${year}${month}${day}-${hours}${minutes}-${sequence}`;
    
    console.log(`매치가 생성되었습니다. ID: ${matchId}`);
    console.log(`블루팀 평균 MMR: ${blueTeamAvgMmr}, 레드팀 평균 MMR: ${redTeamAvgMmr}`);
    
    // 생성된 매치 정보
    const generatedMatchInfo = {
      blueTeam: sortedBlueTeam,
      redTeam: sortedRedTeam,
      blueTeamAvgMmr,
      redTeamAvgMmr,
      map: randomMap,
      matchId,
      channelCreator
    };
    
    // 매치 정보 설정
    setMatchInfo(generatedMatchInfo);
    
    return generatedMatchInfo;
  };

  // DB 사용자 데이터를 활용한 매치 정보 생성 함수 추가
  const generateMatchInfoWithDbUsers = (dbUsers) => {
    console.log('실제 DB 사용자 데이터로 매치 정보 생성 중...');
    
    // 이미 매치 정보가 있으면 다시 생성하지 않음
    if (matchInfo.blueTeam.length > 0) {
      return matchInfo;
    }
    
    console.log('DB에서 가져온 사용자 수:', dbUsers.length);
    
    // 최소 10명의 플레이어 확보
    let players = [];
    
    // 현재 사용자 정보
    const currentPlayer = {
      id: user?._id || 'current-user',
      battletag: userInfo.battletag || user?.battletag || '현재사용자#1234',
      mmr: userInfo.mmr || user?.mmr || 1500,
      role: userInfo.preferredRoles && userInfo.preferredRoles.length > 0 
        ? userInfo.preferredRoles[0]
        : (user?.preferredRoles && user.preferredRoles.length > 0 
            ? user.preferredRoles[0] 
            : '탱커')
    };
    
    // 현재 사용자 추가
    players.push(currentPlayer);
    
    // 실제 DB에서 9명의 유저 필요
    const requiredPlayers = 9;
    
    // DB 유저 데이터가 충분한지 확인
    if (dbUsers.length >= requiredPlayers) {
      // DB에서 가져온 사용자 중복 방지 필터링
      const filteredDbUsers = dbUsers.filter(player => 
        player.battletag !== currentPlayer.battletag && 
        player._id !== user?._id
      );
      
      // 충분한 유저가 없으면 시스템 관리자에게 알림
      if (filteredDbUsers.length < requiredPlayers) {
        console.warn(`DB에서 중복 제외 후 사용자 수가 부족합니다: ${filteredDbUsers.length}명 (필요: ${requiredPlayers}명)`);
      }
      
      // 무작위로 섞어서 9명 선택
      const shuffledUsers = [...filteredDbUsers].sort(() => Math.random() - 0.5);
      const selectedUsers = shuffledUsers.slice(0, Math.min(requiredPlayers, shuffledUsers.length));
      
      // 선택된 사용자 추가
      selectedUsers.forEach(user => {
        players.push({
          id: user._id || `db-user-${Date.now()}-${Math.random()}`,
          battletag: user.battletag || user.battleTag || `Unknown#${Math.floor(1000 + Math.random() * 9000)}`,
          mmr: user.mmr || 1500,
          role: user.preferredRoles && user.preferredRoles.length > 0 
            ? user.preferredRoles[0] 
            : '미설정'
        });
      });
      
      console.log(`DB에서 ${selectedUsers.length}명의 사용자를 추가했습니다.`);
    } else {
      console.warn(`DB 사용자 수가 부족합니다: ${dbUsers.length}명 (필요: ${requiredPlayers}명)`);
    }
    
    // 여전히 10명 미만인 경우 대비
    if (players.length < 10) {
      console.warn(`전체 플레이어 수가 부족합니다: ${players.length}명/10명. 부족한 플레이어를 생성합니다.`);
      
      // 역할 목록
      const roles = ['탱커', '전문가', '투사', '힐러', '원거리 암살자', '근접 암살자'];
      
      // 부족한 플레이어 추가
      for (let i = players.length; i < 10; i++) {
        // 현재 사용자 MMR과 비슷한 범위 내에서 랜덤 MMR 생성
        const userMmr = currentPlayer.mmr;
        const randomMMR = userMmr + Math.floor(Math.random() * 200) - 100;
        const randomRole = roles[Math.floor(Math.random() * roles.length)];
        const randomBattleTag = `임시플레이어#${Math.floor(1000 + Math.random() * 9000)}`;
        
        players.push({
          id: `temp-${i}`,
          battletag: randomBattleTag,
          mmr: randomMMR,
          role: randomRole
        });
      }
    }
    
    // 무작위로 팀 분배
    const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
    const blueTeam = shuffledPlayers.slice(0, 5);
    const redTeam = shuffledPlayers.slice(5, 10);
    
    // MMR 기준으로 정렬 (내림차순)
    const sortedBlueTeam = [...blueTeam].sort((a, b) => b.mmr - a.mmr);
    const sortedRedTeam = [...redTeam].sort((a, b) => b.mmr - a.mmr);
    
    // 팀 MMR 평균 계산
    const blueTeamAvgMmr = Math.round(sortedBlueTeam.reduce((acc, p) => acc + p.mmr, 0) / 5);
    const redTeamAvgMmr = Math.round(sortedRedTeam.reduce((acc, p) => acc + p.mmr, 0) / 5);
    
    // 무작위 맵 선택
    const randomMap = maps[Math.floor(Math.random() * maps.length)];
    
    // 채널 개설자 (레드팀에서 무작위로 선택)
    const channelCreator = sortedRedTeam[0].battletag;
    
    // 날짜 기반 고유 매치 ID 생성 (YYYYMMDD-HHMM-순번)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    // 순번은 시뮬레이션이므로 1~999 중 랜덤하게 생성
    const sequence = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
    
    const matchId = `${year}${month}${day}-${hours}${minutes}-${sequence}`;
    
    console.log(`매치가 생성되었습니다. ID: ${matchId}`);
    console.log(`블루팀 평균 MMR: ${blueTeamAvgMmr}, 레드팀 평균 MMR: ${redTeamAvgMmr}`);
    
    // 매치 정보 설정
    setMatchInfo({
      blueTeam: sortedBlueTeam,
      redTeam: sortedRedTeam,
      blueTeamAvgMmr,
      redTeamAvgMmr,
      map: randomMap,
      matchId,
      channelCreator
    });
    
    return {
      blueTeam: sortedBlueTeam,
      redTeam: sortedRedTeam,
      blueTeamAvgMmr,
      redTeamAvgMmr,
      map: randomMap,
      matchId,
      channelCreator
    };
  };

  // 컴포넌트 언마운트 시 대기열 상태 초기화
  useEffect(() => {
    // 로그인 상태가 아니면 대기열 상태 초기화
    if (!isAuthenticated) {
      localStorage.removeItem('inQueue');
      setGlobalQueueStatus(false);
      setInQueue(false);
      return;
    }
    
    // 초기화: localStorage에서 대기열 상태를 확인하여 로컬 상태 동기화
    const localInQueue = localStorage.getItem('inQueue') === 'true';
    if (localInQueue && !inQueue && isAuthenticated) {
      setInQueue(true);
      // 대기열 활성화 상태라면 배경 효과 적용
      if (!document.body.classList.contains('queue-active')) {
        document.body.classList.add('queue-active');
      }
    } else if (!localInQueue && inQueue) {
      // localStorage에 대기열 상태가 false인데 로컬 상태가 true인 경우 동기화
      setInQueue(false);
      // 배경 효과 제거
      document.body.classList.remove('queue-active');
    }
    
    // 컴포넌트 언마운트 시
    return () => {
      // 언마운트 시에는 배경 효과를 제거하지 않음 (다른 페이지로 이동해도 효과 유지)
      // 대기열 취소 시에만 배경 효과 제거 (leaveQueue 함수에서 처리)
    };
  }, [inQueue, isAuthenticated, setGlobalQueueStatus]);

  // 매치메이킹 대기열 참가
  const joinQueue = async () => {
    try {
      // 로그인 확인
      if (!isAuthenticated || !user) {
        setError('로그인이 필요합니다.');
        return;
      }
      
      setError('');
      setIsLoading(true);
      
      console.log('대기열 참가 요청 전송:', { userId: user._id });
      
      const response = await axios.post('/api/matchmaking/join', {
        userId: user._id
      });
      
      if (response.data.success) {
        console.log('대기열 참가 성공:', response.data);
        setInQueue(true);
        // localStorage 및 전역 상태 업데이트
        localStorage.setItem('inQueue', 'true');
        setGlobalQueueStatus(true); // 전역 상태 업데이트
        setQueueStatus(response.data.queueStatus);
        
        // 배경 애니메이션 활성화를 위해 body에 클래스 추가
        document.body.classList.add('queue-active');
        
        // 타이머 시작 또는 재설정
        queueTimeState.start();
      } else {
        console.error('대기열 참가 실패:', response.data);
        setError(response.data.message || '대기열 참가에 실패했습니다.');
      }
    } catch (err) {
      console.error('대기열 참가 오류:', err);
      
      // 상세 오류 정보 로깅
      if (err.response) {
        console.error('서버 응답 오류:', {
          status: err.response.status,
          data: err.response.data,
          headers: err.response.headers
        });
      } else if (err.request) {
        console.error('서버 응답 없음 (네트워크 오류):', err.request);
      } else {
        console.error('요청 설정 오류:', err.message);
      }
      
      // 사용자 친화적인 오류 메시지 표시
      const errorMessage = err.response?.data?.message || '대기열 참가 중 오류가 발생했습니다. 다시 시도해주세요.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 개발용 모의 대기열 참가
  const simulateQueue = () => {
    // 이미 시뮬레이션 중이면 중단
    if (isSimulating) {
      console.log('시뮬레이션 중단 시작');
      
      // 시뮬레이션 상태 변경 전에 타이머 중지
      if (simulationTimerRef.current) {
        clearInterval(simulationTimerRef.current);
        simulationTimerRef.current = null;
        console.log('시뮬레이션 타이머가 정상적으로 제거되었습니다.');
      }
      
      // 시뮬레이션 및 대기열 상태 초기화
      setIsSimulating(false);
      setInQueue(false);
      setQueueStatus({
        currentPlayers: 0,
        requiredPlayers: 10,
        estimatedTime: '00:00'
      });
      
      // 전역 상태 및 로컬 스토리지 업데이트
      localStorage.setItem('inQueue', 'false');
      localStorage.removeItem('simulatedPlayers'); // 시뮬레이션 플레이어 수 제거
      localStorage.removeItem('simulationStartTime'); // 시뮬레이션 시작 시간 제거
      setGlobalQueueStatus(false);
      
      // 전역 변수 업데이트
      window.isSimulationRunning = false;
      
      // 타이머 및 배경 효과 초기화
      queueTimeState.reset();
      document.body.classList.remove('queue-active');
      console.log('시뮬레이션 중단 완료');
      return;
    }
    
    console.log('시뮬레이션 시작');
    
    // 시뮬레이션 시작 전 상태 초기화
    if (simulationTimerRef.current) {
      clearInterval(simulationTimerRef.current);
      simulationTimerRef.current = null;
    }
    
    // 전역 queueTimeState 초기화 및 시작 (타이머 시작 먼저)
    queueTimeState.reset();
    queueTimeState.start();
    
    // 시뮬레이션 상태 활성화 (직접 설정)
    setIsSimulating(true);
    
    // 시뮬레이션 시작 시간 저장 (페이지 이동 후 복원을 위함)
    const startTime = Date.now();
    localStorage.setItem('simulationStartTime', startTime.toString());
    
    // 전역 상태 및 로컬 스토리지 먼저 업데이트 (QueueStatus 컴포넌트와 동기화)
    localStorage.setItem('inQueue', 'true');
    setGlobalQueueStatus(true);
    
    // 이제 로컬 inQueue 상태 업데이트
    setInQueue(true);
    
    // 배경 애니메이션 활성화
    document.body.classList.add('queue-active');
    
    console.log('API에서 사용자 데이터 로드 중...');
    
    // 첫 상태 즉시 설정 (1명으로 시작)
    setQueueStatus({
      currentPlayers: 1,
      requiredPlayers: 10,
      estimatedTime: '00:30'
    });
    
    // 로컬 변수로 시뮬레이션 활성화 상태 추적
    window.isSimulationRunning = true;
    localStorage.setItem('simulatedPlayers', '1'); // 시뮬레이션 시작 시 플레이어 수 저장
    
    // DB에서 사용자 데이터 가져오기 시도
    axios.get('/api/users/all')
      .then(response => {
        const dbUsers = response.data || [];
        console.log(`DB에서 ${dbUsers.length}명의 사용자를 가져왔습니다.`);
        
        // 시뮬레이션 시작
        startSimulationTimer(dbUsers, true);
      })
      .catch(error => {
        console.error('사용자 데이터 로드 중 오류:', error);
        console.log('오류 발생으로 로컬 데이터로 시뮬레이션 진행');
        
        // 로컬 데이터로 시뮬레이션 시작
        startSimulationTimer([], false);
      });
    
    console.log('시뮬레이션 설정 완료');
  };

  // 시뮬레이션 타이머 시작 함수 (코드 정리)
  const startSimulationTimer = (dbUsers, useDbData) => {
    // 시뮬레이션 시작 시간 가져오기
    const startTime = parseInt(localStorage.getItem('simulationStartTime') || Date.now().toString());
    
    // 시뮬레이션 시간 경과 계산 - 페이지 이동 후에도 상태 유지하기 위함
    const timeElapsed = Math.floor((Date.now() - startTime) / 1000);
    
    // 시간 경과에 따른 플레이어 수 계산 (1초에 1명씩 증가, 최대 10명)
    let expectedPlayers = Math.min(10, 1 + Math.floor(timeElapsed / 1));
    
    // localStorage에 저장된 플레이어 수 확인
    const storedPlayers = parseInt(localStorage.getItem('simulatedPlayers') || '1');
    
    // 둘 중 더 큰 값 사용
    let currentPlayers = Math.max(expectedPlayers, storedPlayers);
    console.log(`시뮬레이션 복원: 시간 경과 ${timeElapsed}초, 예상 플레이어 ${expectedPlayers}명, 저장된 플레이어 ${storedPlayers}명, 설정 플레이어 ${currentPlayers}명`);
    
    // 상태 업데이트
    setQueueStatus({
      currentPlayers: currentPlayers,
      requiredPlayers: 10,
      estimatedTime: currentPlayers >= 10 ? '00:00' : '00:30'
    });
    
    // 이미 10명이 모였으면 바로 매치 처리
    if (currentPlayers >= 10) {
      console.log('이미 10명이 모여 있습니다. 바로 매치 처리합니다.');
      
      // 전역 변수로 시뮬레이션 상태 변경
      window.isSimulationRunning = false;
      
      // 상태 업데이트
      setMatchFound(true);
      setIsSimulating(false);
      localStorage.setItem('inQueue', 'false');
      localStorage.removeItem('simulatedPlayers');
      localStorage.removeItem('simulationStartTime');
      setGlobalQueueStatus(false);
      
      // 매치 정보 생성
      let generatedMatchInfo;
      if (useDbData && dbUsers.length >= 9) {
        generatedMatchInfo = generateMatchInfoAndSave(dbUsers, true);
      } else {
        generatedMatchInfo = generateMatchInfoAndSave(null, false);
      }
      
      // 매치 정보가 있으면 즉시 매치 페이지로 이동
      if (generatedMatchInfo) {
        navigate('/match-details', { state: { matchInfo: generatedMatchInfo } });
      }
      
      return;
    }
    
    // 1초마다 플레이어 증가 (더 안정적인 간격)
    simulationTimerRef.current = setInterval(function() {
      // 시뮬레이션이 중단되었는지 확인 (전역 변수 사용)
      if (!window.isSimulationRunning) {
        console.log('전역 변수로 중단 감지: 시뮬레이션이 중단되었습니다.');
        clearInterval(simulationTimerRef.current);
        simulationTimerRef.current = null;
        return;
      }
      
      // 현재 localStorage에서 플레이어 수 확인
      const storedPlayers = parseInt(localStorage.getItem('simulatedPlayers') || '1');
      
      // 플레이어 수 증가 (최대 10명)
      currentPlayers = Math.min(10, storedPlayers + 1);
      console.log(`시뮬레이션 진행 중: ${storedPlayers}명 -> ${currentPlayers}명`);
      
      // 현재 플레이어 수를 localStorage에 저장 (페이지 간 상태 유지)
      localStorage.setItem('simulatedPlayers', currentPlayers.toString());
      
      // React 상태 업데이트
      setQueueStatus(prev => ({
        ...prev,
        currentPlayers: currentPlayers,
        estimatedTime: currentPlayers >= 10 ? '00:00' : '00:30'
      }));
      
      // 10명 도달 시 매치 찾음 처리
      if (currentPlayers === 10) {
        console.log('시뮬레이션 완료: 10명 모집 완료, 매치 생성 중...');
        
        // 전역 변수로 시뮬레이션 상태 변경
        window.isSimulationRunning = false;
        
        // 타이머 종료
        clearInterval(simulationTimerRef.current);
        simulationTimerRef.current = null;
        
        // 상태 업데이트
        setMatchFound(true);
        setIsSimulating(false);
        localStorage.setItem('inQueue', 'false');
        localStorage.removeItem('simulatedPlayers');
        localStorage.removeItem('simulationStartTime');
        setGlobalQueueStatus(false);
        
        // 매치 정보 생성
        let generatedMatchInfo;
        if (useDbData && dbUsers.length >= 9) {
          generatedMatchInfo = generateMatchInfoAndSave(dbUsers, true);
          console.log('DB 사용자로 매치 정보 생성 완료');
        } else {
          generatedMatchInfo = generateMatchInfoAndSave(null, false);
          console.log('로컬 데이터로 매치 정보 생성 완료');
        }
        
        // 매치 정보가 있으면 즉시 매치 페이지로 이동
        if (generatedMatchInfo) {
          navigate('/match-details', { state: { matchInfo: generatedMatchInfo } });
        }
      }
    }, 1000); // 1초마다 업데이트 (더 안정적)
  };

  // 매치 정보 생성 및 저장 함수 (코드 정리)
  const generateMatchInfoAndSave = (dbUsers, useDbData) => {
    let generatedMatchInfo;
    
    if (useDbData && dbUsers && dbUsers.length >= 9) {
      // DB 사용자로 매치 정보 생성
      generatedMatchInfo = generateMatchInfoWithDbUsers(dbUsers);
    } else {
      // 로컬 데이터로 매치 정보 생성
      generatedMatchInfo = generateMatchInfo();
    }
    
    // 매치 정보 저장
    if (generatedMatchInfo) {
      console.log('[FindMatchPage] 매치 정보 저장:', generatedMatchInfo.matchId);
      
      // 매치 정보를 JSON 문자열로 변환하여 저장
      const matchInfoStr = JSON.stringify(generatedMatchInfo);
      
      // 로컬 스토리지에 매치 정보 저장
      localStorage.setItem('lastMatchInfo', matchInfoStr);
      localStorage.setItem('matchInProgress', 'true');
      localStorage.setItem('currentMatchId', generatedMatchInfo.matchId);
      
      // 매치 정보 상태 업데이트
      setMatchInfo(generatedMatchInfo);
      
      // 전역 상태 업데이트
      setMatchProgress(true, generatedMatchInfo.matchId);
      
      // 대기열 상태 초기화 (매치가 찾아졌으므로)
      setInQueue(false);
      localStorage.setItem('inQueue', 'false');
      setGlobalQueueStatus(false);
      
      // 시뮬레이션 관련 상태 정리
      if (isSimulating) {
        setIsSimulating(false);
        localStorage.removeItem('simulatedPlayers');
        localStorage.removeItem('simulationStartTime');
        window.isSimulationRunning = false;
      }
      
      console.log('[FindMatchPage] 매치 정보 저장 완료, ID:', generatedMatchInfo.matchId);
    }
    
    return generatedMatchInfo;
  };

  // 컴포넌트 마운트/언마운트 시 정리
  useEffect(() => {
    // 컴포넌트 마운트 시 전역 변수 확인
    const simulationRunning = localStorage.getItem('simulatedPlayers') !== null && 
                             localStorage.getItem('simulationStartTime') !== null;
    
    if (simulationRunning) {
      console.log('기존 시뮬레이션 상태 복원');
      window.isSimulationRunning = true;
      setIsSimulating(true);
      
      // 로컬 상태 복원
      const simulatedPlayers = parseInt(localStorage.getItem('simulatedPlayers') || '1');
      setInQueue(true);
      setQueueStatus({
        currentPlayers: simulatedPlayers,
        requiredPlayers: 10,
        estimatedTime: simulatedPlayers >= 10 ? '00:00' : '00:30'
      });
      
      // 타이머 시작
      if (!queueTimeState.startTime) {
        queueTimeState.start();
      }
      
      // 배경 효과 적용
      document.body.classList.add('queue-active');
      
      // 시뮬레이션 타이머 재시작
      startSimulationTimer([], false);
    } else {
      window.isSimulationRunning = false;
    }
    
    // 언마운트 시 정리
    return () => {
      // 타이머 정리
      if (simulationTimerRef.current) {
        clearInterval(simulationTimerRef.current);
        simulationTimerRef.current = null;
        console.log('언마운트: 시뮬레이션 타이머가 정상적으로 제거되었습니다.');
      }
    };
  }, []);

  // 시뮬레이션 상태 변경 시 전역 변수 업데이트
  useEffect(() => {
    window.isSimulationRunning = isSimulating;
    
    // 시뮬레이션 비활성화 시 추가 정리
    if (!isSimulating && simulationTimerRef.current) {
      clearInterval(simulationTimerRef.current);
      simulationTimerRef.current = null;
      console.log('시뮬레이션 상태 변경: 타이머가 정상적으로 제거되었습니다.');
    }
  }, [isSimulating]);

  // 매치메이킹 대기열 취소
  const leaveQueue = async () => {
    try {
      // 시뮬레이션 중이면 중단
      if (isSimulating || window.isSimulationRunning) {
        console.log('대기열 취소: 시뮬레이션 중단 (leaveQueue 경유)');
        
        // 전역 변수로 시뮬레이션 상태 변경
        window.isSimulationRunning = false;
        
        // 타이머 중지
        if (simulationTimerRef.current) {
          clearInterval(simulationTimerRef.current);
          simulationTimerRef.current = null;
          console.log('대기열 취소: 시뮬레이션 타이머가 정상적으로 제거되었습니다.');
        }
        
        // 상태 초기화
        setIsSimulating(false);
        setInQueue(false);
        setQueueStatus({
          currentPlayers: 0,
          requiredPlayers: 10,
          estimatedTime: '00:00'
        });
        
        // 전역 상태 및 로컬 스토리지 업데이트
        localStorage.setItem('inQueue', 'false');
        localStorage.removeItem('simulatedPlayers'); // 시뮬레이션 플레이어 수 제거
        setGlobalQueueStatus(false);
        
        // 타이머 및 배경 효과 초기화
        queueTimeState.reset();
        document.body.classList.remove('queue-active');
        
        console.log('대기열 취소: 시뮬레이션 중단 완료');
        return;
      }
      
      setIsLoading(true);
      
      // 실제 API 호출
      const response = await axios.post('/api/matchmaking/leave', {
        userId: user._id
      });
      
      if (response.data.success) {
        setInQueue(false);
        localStorage.setItem('inQueue', 'false');
        setGlobalQueueStatus(false);
        setError('');
        
        // 타이머 초기화
        queueTimeState.reset();
        
        // 배경 애니메이션 비활성화
        document.body.classList.remove('queue-active');
      } else {
        const errorMessage = response.data.message || '대기열 취소에 실패했습니다.';
        setError(errorMessage);
      }
    } catch (err) {
      console.error('대기열 취소 오류:', err);
      
      if (err.response) {
        console.error('서버 응답 오류:', {
          status: err.response.status,
          data: err.response.data,
          headers: err.response.headers
        });
      }
      
      const errorMessage = err.response?.data?.message || '대기열 취소 중 오류가 발생했습니다. 다시 시도해주세요.';
      setError(errorMessage);
      
      // 오류가 발생해도 클라이언트 측 상태 초기화
      localStorage.setItem('inQueue', 'false');
      setGlobalQueueStatus(false);
      setInQueue(false);
      queueTimeState.reset();
      document.body.classList.remove('queue-active');
    } finally {
      setIsLoading(false);
    }
  };

  // 컴포넌트 마운트 시 매치 진행 중 상태 확인
  useEffect(() => {
    // 로컬 스토리지에서 매치 진행 중 상태 확인
    const isMatchInProgress = localStorage.getItem('matchInProgress') === 'true';
    const matchId = localStorage.getItem('currentMatchId');
    
    if (isMatchInProgress && matchId) {
      // 로컬 상태와 글로벌 상태 모두 업데이트
      setMatchInProgress(true);
      setMatchProgress(true, matchId);
      
      // 대기열 상태 초기화
      setInQueue(false);
      localStorage.setItem('inQueue', 'false');
      setGlobalQueueStatus(false);
      
      // 기존 매치 정보 가져오기 시도 (이 부분은 실제 구현에서 서버에서 가져와야 함)
      if (matchInfo.matchId === '' || matchInfo.matchId !== matchId) {
        // 실제로는 서버에서 매치 정보를 가져오는 API 호출이 필요함
        // axios.get(`/api/matches/${matchId}`)...
        
        try {
          // 로컬 스토리지에서 매치 정보 가져오기
          const savedMatchInfo = localStorage.getItem('lastMatchInfo');
          if (savedMatchInfo) {
            const parsedInfo = JSON.parse(savedMatchInfo);
            setMatchInfo(parsedInfo);
          } else {
            // 임시로 로컬 스토리지에서 가져온 ID만 설정
            setMatchInfo(prevInfo => ({
              ...prevInfo,
              matchId: matchId
            }));
          }
        } catch (err) {
          console.error('매치 정보 파싱 오류:', err);
          setMatchInfo(prevInfo => ({
            ...prevInfo,
            matchId: matchId
          }));
        }
      }
    } else {
      // 전역 상태와 동기화
      setMatchInProgress(globalMatchInProgress);
    }
  }, [globalMatchInProgress, setMatchProgress, setGlobalQueueStatus]);

  // 전역 상태가 변경되면 로컬 상태도 업데이트
  useEffect(() => {
    if (globalMatchInProgress !== matchInProgress) {
      setMatchInProgress(globalMatchInProgress);
    }
  }, [globalMatchInProgress, matchInProgress]);

  // 매치 찾음 창 닫기 함수 수정
  const closeMatchFound = () => {
    setMatchFound(false);
    
    // 매치 정보 저장
    const matchInfoStr = JSON.stringify(matchInfo);
    localStorage.setItem('lastMatchInfo', matchInfoStr);
    
    // 매치 창을 닫을 때 글로벌 매치 진행 중 상태로 설정
    setMatchProgress(true, matchInfo.matchId);
    setMatchInProgress(true);
    
    // 대기열 상태 초기화
    setInQueue(false);
    setGlobalQueueStatus(false);
    
    // 매치 세부 정보 페이지로 이동
    navigate('/match-details', { state: { matchInfo } });
  };
  
  // 매치 상세 정보 창 열기 함수 추가
  const openMatchDetails = () => {
    // 저장된 매치 정보가 있으면 사용, 없으면 현재 정보 사용
    let displayMatchInfo = matchInfo;
    
    // 매치 정보가 없으면 localStorage에서 가져오기
    if (matchInfo.blueTeam.length === 0 && matchInfo.matchId === '') {
      const savedMatchInfo = localStorage.getItem('lastMatchInfo');
      if (savedMatchInfo) {
        try {
          displayMatchInfo = JSON.parse(savedMatchInfo);
          // 현재 매치 정보 업데이트
          setMatchInfo(displayMatchInfo);
        } catch (err) {
          console.error('저장된 매치 정보 파싱 오류:', err);
        }
      }
    }
    
    // 매치 정보가 있으면 매치 세부 정보 페이지로 이동
    if (displayMatchInfo.matchId) {
      navigate('/match-details', { state: { matchInfo: displayMatchInfo } });
    } else {
      alert('표시할 매치 정보가 없습니다.');
    }
  };
  
  // 매치 상세 정보 창 닫기 함수 추가
  const closeMatchDetails = () => {
    setShowMatchDetails(false);
  };

  // 관리자 호출 처리
  const callAdmin = () => {
    // 호출 중 상태로 변경
    setCallingAdmin(true);
    
    // 매치 ID 확인
    const matchId = matchInfo?.matchId || currentMatchId;
    if (!matchId) {
      alert('매치 정보가 없습니다. 관리자에게 문의해주세요.');
      setCallingAdmin(false);
      return;
    }
    
    // 임시 구현 (API 없이)
    setTimeout(() => {
    alert('관리자에게 도움 요청이 전송되었습니다. 잠시만 기다려주세요.');
      setCallingAdmin(false);
    }, 1500);
  };

  // 매치 취소 기능 추가
  const cancelMatch = () => {
    if (!window.confirm('정말로 매치를 취소하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }
    
    // 매치 진행 중 상태 초기화
    setMatchProgress(false);
    setMatchInProgress(false);
    
    // localStorage에서 매치 정보 삭제
    localStorage.removeItem('matchInProgress');
    localStorage.removeItem('currentMatchId');
    localStorage.removeItem('lastMatchInfo');
    
    // 알림 메시지 삭제
    // alert('매치가 취소되었습니다.');
  };

  // 리플레이 제출 처리 함수 수정
  const submitReplay = () => {
    // 제출 중 상태로 변경
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

  // 리플레이 모달 닫기 핸들러 수정
  const handleReplayModalClose = (success) => {
    setShowReplayModal(false);
    
    // 업로드 성공 시 추가 작업
    if (success) {
      // 매치 진행 중 상태 초기화 (전역 상태)
      setMatchProgress(false);
      setMatchInProgress(false);
      
      // 모든 매치 관련 상태 초기화
      localStorage.removeItem('lastMatchInfo');
    }
  };

  // 매치 상세 정보 보기
  const viewMatchDetails = (matchId) => {
    // 매치 세부 정보 페이지로 이동
    const savedMatchInfo = localStorage.getItem('lastMatchInfo');
    let matchInfoToPass = matchInfo;
    
    if (savedMatchInfo) {
      try {
        const parsedInfo = JSON.parse(savedMatchInfo);
        if (parsedInfo.matchId === (matchId || currentMatchId)) {
          matchInfoToPass = parsedInfo;
        }
      } catch (err) {
        console.error('매치 정보 파싱 오류:', err);
      }
    }
    
    navigate('/match-details', { state: { matchInfo: matchInfoToPass } });
  };

  // 대기열 UI 렌더링
  const renderQueueUI = () => {
    if (!inQueue) return null;
    
    // 시간 형식화 (MM:SS)
    const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };
    
    return (
      <div className="queue-ui-container">
        {/* 우주 입자 */}
        {particles.map(particle => (
          <div
            key={particle.id}
            className="particle"
            style={{
              top: particle.top,
              left: particle.left,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: particle.opacity,
              '--moveX': particle.moveX,
              '--moveY': particle.moveY,
              '--duration': `${particle.duration}s`,
              animationDelay: `${particle.delay || 0}s`,
              transform: `scale(${particle.scale || 1})`
            }}
          />
        ))}
        
        {/* 대기열 상태 */}
        <div className="flex flex-col items-center justify-center text-center">
          {/* 배틀태그 */}
          <div className="queue-ui-battle-tag">
            {userInfo.battletag || user?.battletag || '알 수 없음'}
          </div>
          
          {/* 대기열 카운터 */}
          <div className="queue-counter">
            <span className="queue-ui-current">{queueStatus.currentPlayers}</span>
            <span className="queue-ui-slash">/</span>
            <span className="queue-ui-total">{queueStatus.requiredPlayers}</span>
          </div>
          
          {/* 대기 시간 - 전역 타이머 값 사용 */}
          <div className="queue-time-counter">
            <div className="queue-time-label">대기 시간</div>
            <div className="queue-ui-time">{formatTime(queueTimeState.time)}</div>
          </div>
          
          {/* 버튼 그룹 */}
          <div className="queue-ui-buttons">
            {/* 취소 버튼 */}
            <button 
              className="queue-ui-cancel-btn"
              onClick={leaveQueue}
              disabled={isLoading}
            >
              {isLoading ? '처리 중...' : '대기열 취소'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 프로필 설정 추천 배너
  const renderProfileRecommendation = () => {
    if (!showProfileRecommendation) return null;
    
    return (
      <div className="bg-indigo-900/50 border border-indigo-500 text-white px-6 py-4 rounded-lg mb-6">
        <div className="flex items-start">
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">프로필 설정 추천</h3>
            <p className="text-indigo-200">
              선호하는 역할과 영웅을 설정하면 더 공정한 매치메이킹에 도움이 됩니다.
            </p>
          </div>
          <div className="ml-4 flex-shrink-0">
            <Link 
              to="/profile/setup" 
              className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition"
            >
              프로필 설정하기
            </Link>
          </div>
        </div>
      </div>
    );
  };

  // 매치 세부 정보 표시 컴포넌트
  const renderMatchDetailsModal = () => {
    if (!showMatchDetails) return null;
    
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 overflow-auto">
        <div className="bg-slate-800 p-6 rounded-lg max-w-4xl w-full match-found-animation relative">
          {/* 닫기 버튼 */}
          <button 
            onClick={closeMatchDetails}
            className="absolute top-2 right-2 text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-700/50 transition"
            aria-label="닫기"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>

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
            
            {/* 채널 정보 - 우측에 배치 */}
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
              onClick={closeMatchDetails}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition"
            >
              닫기
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
    );
  };

  return (
    <div className="matchmaking-container">
      <div className="page-content page-container">
        <div className="max-w-4xl mx-auto pt-4">
          <h1 className="text-3xl font-bold text-white mb-6 page-title">매치메이킹</h1>
          
          <div className="mb-6">
            <Link to="/" className="text-indigo-400 hover:text-indigo-300">
              &larr; 홈으로 돌아가기
            </Link>
          </div>
       
          {renderProfileRecommendation()}
          
          <div className={`card ${inQueue ? 'card-in-queue' : ''}`}>
            <h1 className="text-3xl font-bold text-indigo-400 mb-6">매치 찾기</h1>
            
            {error && (
              <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}
            
            {/* 매치 진행 중 상태 표시 */}
            {matchInProgress ? (
              <div className="bg-green-900/50 border border-green-700 text-green-300 px-4 py-3 rounded mb-6">
                <div className="flex items-center">
                  <div className="mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold">매치 진행 중</h3>
                    <p>현재 게임이 진행 중입니다. 게임을 완료한 후 리플레이를 제출해주세요.</p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button 
                        onClick={submitReplay}
                        disabled={submittingReplay}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                      >
                        {submittingReplay ? '처리 중...' : '리플레이 제출'}
                      </button>
                      
                      <button 
                        onClick={openMatchDetails}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                      >
                        매치 정보
                      </button>
                      
                      <button 
                        onClick={callAdmin}
                        disabled={callingAdmin}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm"
                      >
                        {callingAdmin ? '요청 중...' : '관리자 호출'}
                      </button>
                      
                      <button 
                        onClick={cancelMatch}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                      >
                        매치 취소
                      </button>
                    </div>
                    <div className="mt-2">
                      <span className="text-xs text-gray-400">매치 ID: {matchInfo.matchId || currentMatchId}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-4">내 정보</h2>
                {isAuthenticated && user ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-300">
                    <div className="bg-slate-700/50 p-4 rounded">
                      <div className="text-sm text-gray-400">배틀태그</div>
                      <div className="font-semibold">{userInfo.battletag || user.battletag}</div>
                    </div>
                    <div className="bg-slate-700/50 p-4 rounded">
                      <div className="text-sm text-gray-400">MMR</div>
                      <div className="font-semibold">
                        {loadingUserInfo ? (
                          <span className="text-indigo-300">로딩 중...</span>
                        ) : (
                          userInfo.mmr !== null ? userInfo.mmr : (user.mmr || 1500)
                        )}
                      </div>
                    </div>
                    <div className="bg-slate-700/50 p-4 rounded">
                      <div className="text-sm text-gray-400">선호하는 역할</div>
                      <div className="font-semibold">
                        {loadingUserInfo ? (
                          <span className="text-indigo-300">로딩 중...</span>
                        ) : (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {userInfo.preferredRoles && userInfo.preferredRoles.length > 0 ? 
                              userInfo.preferredRoles.map((role, index) => (
                                <span key={index} className="bg-indigo-800/50 px-2 py-0.5 rounded text-xs text-indigo-200">
                                  {role}
                                </span>
                              ))
                              : 
                              user.preferredRoles && user.preferredRoles.length > 0 ?
                                user.preferredRoles.map((role, index) => (
                                  <span key={index} className="bg-indigo-800/50 px-2 py-0.5 rounded text-xs text-indigo-200">
                                    {role}
                                  </span>
                                ))
                                :
                                <span className="text-gray-400">미설정</span>
                            }
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-yellow-300 mb-4">
                    로그인이 필요합니다. <Link to="/login" className="text-indigo-400 hover:underline">로그인하기</Link>
                  </div>
                )}
              </div>
              
              <div className="text-center">
                <p className="text-gray-300 mb-6">
                  매치 찾기를 시작하면 동일한 MMR대의 플레이어 10명이 모일 때까지 대기합니다.
                  10명이 모이면 자동으로 팀이 구성되고 게임이 시작됩니다.
                </p>
                
                <div className="button-group">
                  <button
                    onClick={joinQueue}
                    disabled={!isAuthenticated || inQueue}
                    className="btn btn-primary"
                  >
                    {inQueue ? '대기열에 등록됨' : '매치 찾기 시작'}
                  </button>
                  
                  {process.env.NODE_ENV === 'development' && (
                    <button
                      onClick={simulateQueue}
                      className="btn btn-secondary"
                    >
                      {isSimulating ? '[개발용] 시뮬레이션 중단' : '[개발용] 매치 시뮬레이션'}
                    </button>
                  )}
                </div>
              </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* 블랙홀 효과 */}
      {inQueue && (
        <div className="black-hole-container">
          <div className="black-hole-center"></div>
          <div className="accretion-disk"></div>
          <div className="gravity-pull"></div>
          <div className="event-horizon"></div>
          <div className="particle-stream"></div>
        </div>
      )}
      
      {/* 대기열 UI */}
      {renderQueueUI()}
      
      {/* 매치 세부 정보 모달 */}
      {showMatchDetails && renderMatchDetailsModal()}
      
      {/* 리플레이 업로드 모달 */}
      {showReplayModal && (
        <ReplayUploadModal 
          isOpen={showReplayModal}
          onClose={handleReplayModalClose}
          matchId={currentMatchId}
        />
      )}
    </div>
  );
};

export default FindMatchPage; 