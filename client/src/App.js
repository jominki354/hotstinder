import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import AuthSuccessPage from './pages/AuthSuccessPage';
import DashboardPage from './pages/DashboardPage';
import ProfileSetupPage from './pages/ProfileSetupPage';
import FindMatchPage from './pages/FindMatchPage';
import MatchDetailsPage from './pages/MatchDetailsPage';
import LeaderboardPage from './pages/LeaderboardPage';
import RecentGamesPage from './pages/RecentGamesPage';
import NotFoundPage from './pages/NotFoundPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminPage from './pages/AdminPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminUserEditPage from './pages/AdminUserEditPage';
import AdminMatchesPage from './pages/AdminMatchesPage';
import AdminMatchDetailPage from './pages/AdminMatchDetailPage';
import QueueStatus from './components/queue/QueueStatus';
import { useAuthStore } from './stores/authStore';
import PrivateRoute from './components/auth/PrivateRoute';

// 관리자만 접근 가능한 라우트
const AdminRoute = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useAuthStore();

  if (isLoading) {
    return <div>로딩 중...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin-login" />;
  }

  // user가 존재하지 않거나 관리자가 아닌 경우
  if (!user || !user.isAdmin) {
    return <Navigate to="/" />;
  }

  return children;
};

function App() {
  const {
    isAuthenticated,
    user,
    loadUser,
    checkAuth,
    token,
    inQueue,
    setQueueStatus,
    setMatchProgress,
    matchInProgress,
    currentMatchId,
    matchInfo,
    setMatchInfo,
    loading: isLoading
  } = useAuthStore();

  const location = useLocation();
  const navigate = useNavigate();

  // 앱 초기화 시 인증 상태 확인
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('앱 초기화 중, 인증 상태 확인...');

      // 토큰이 있을 경우에만 사용자 정보 로드
      if (token) {
        try {
          await loadUser();
          console.log('사용자 정보 로드 완료');
        } catch (err) {
          console.error('사용자 정보 로드 중 오류:', err);
          // 인증 오류시 대기열 상태 및 매치 상태 초기화
          localStorage.removeItem('inQueue');
          localStorage.removeItem('matchInProgress');
          localStorage.removeItem('currentMatchId');
          setQueueStatus(false);
          setMatchProgress(false);
        }
      } else {
        // 토큰이 없으면 인증 상태 확인
        const authResult = await checkAuth();
        // 인증되지 않은 경우 대기열 상태 및 매치 상태 초기화
        if (!authResult) {
          localStorage.removeItem('inQueue');
          localStorage.removeItem('matchInProgress');
          localStorage.removeItem('currentMatchId');
          localStorage.removeItem('lastMatchInfo');
          setQueueStatus(false);
          setMatchProgress(false);
        }
      }
    };

    initializeAuth();
  }, [loadUser, checkAuth, token, setQueueStatus, setMatchProgress]);

  // 매치 정보 상태 확인
  useEffect(() => {
    const checkMatchState = () => {
      // 매치 진행 중 상태 확인
      const isMatchInProgress = localStorage.getItem('matchInProgress') === 'true';
      const matchId = localStorage.getItem('currentMatchId');

      // 매치 진행 중이면서 매치 ID가 있으면 매치 상태 업데이트
      if (isMatchInProgress && matchId) {
        // 전역 상태 업데이트
        setMatchProgress(true, matchId);

        // 매치 정보 확인
        const savedMatchInfo = localStorage.getItem('lastMatchInfo');
        if (savedMatchInfo && (!matchInfo || matchInfo.matchId !== matchId)) {
          try {
            const parsedMatchInfo = JSON.parse(savedMatchInfo);
            // 저장된 매치 정보와 현재 매치 ID가 같은 경우에만 업데이트
            if (parsedMatchInfo && parsedMatchInfo.matchId === matchId) {
              setMatchInfo(parsedMatchInfo);
              console.log('저장된 매치 정보 복원:', matchId);
            }
          } catch (err) {
            console.error('매치 정보 파싱 오류:', err);
          }
        }
      }
    };

    // 인증 상태가 있을 때만 매치 상태 확인
    if (isAuthenticated && user) {
      checkMatchState();
    }
  }, [isAuthenticated, user, matchInfo, setMatchProgress, setMatchInfo]);

  // 전역 수준에서 매치 상태 변경 감지 및 페이지 자동 이동
  useEffect(() => {
    // 이미 매치메이킹 페이지나 매치 상세 페이지에 있으면 리다이렉트하지 않음
    const isMatchRelatedPage = location.pathname === '/matchmaking' ||
                              location.pathname === '/match-details';

    if (isMatchRelatedPage) {
      return;
    }

    // 관리자 페이지에 있으면 리다이렉트하지 않음
    if (location.pathname.startsWith('/admin')) {
      return;
    }

    // 이미 리디렉션이 발생했는지 확인
    const alreadyRedirected = localStorage.getItem('redirectedToMatch') === 'true';

    // 이미 리디렉션 되었으면 추가 리디렉션 방지
    if (alreadyRedirected) {
      return;
    }

    // 매치 상태 확인 간격 설정 (ms)
    const CHECK_INTERVAL = 500;
    const checkMatchStatus = () => {
      // 우선순위 1: 매치 진행 중이고 로그인 상태일 때 매치 정보 페이지로 자동 이동
      // 단, 대기열이 가득 찬 직후가 아닌 경우에만 자동 이동 (사용자가 직접 확인 후 이동하도록)
      const justFoundMatch = localStorage.getItem('justFoundMatch') === 'true';

      if (matchInProgress && currentMatchId && isAuthenticated && !justFoundMatch) {
        console.log('[App] 매치 진행 중 감지, 매치 정보 페이지로 자동 이동');

        // 리디렉션 플래그 설정
        localStorage.setItem('redirectedToMatch', 'true');

        // 다음 렌더링 사이클에서 이동하여 렌더링 충돌 방지
        requestAnimationFrame(() => {
          if (location.pathname !== '/match-details') {
            navigate('/match-details');
            console.log('[App] 매치 정보 페이지로 이동 완료');
          }
        });
        return true; // 매치 상태 변경 처리됨
      }

      // 우선순위 2: localStorage에서 매치 상태 확인 (전역 상태와 다를 수 있음)
      // 단, 대기열이 가득 찬 직후가 아닌 경우에만 자동 이동
      const localMatchInProgress = localStorage.getItem('matchInProgress') === 'true';
      const localMatchId = localStorage.getItem('currentMatchId');

      if (localMatchInProgress && localMatchId && isAuthenticated && !justFoundMatch) {
        console.log('[App] localStorage에서 매치 진행 중 감지');

        // 리디렉션 플래그 설정
        localStorage.setItem('redirectedToMatch', 'true');

        // 전역 상태 업데이트
        if (!matchInProgress) {
          setMatchProgress(true, localMatchId);
        }

        // 페이지 이동
        requestAnimationFrame(() => {
          if (location.pathname !== '/match-details') {
            navigate('/match-details');
            console.log('[App] localStorage 기반으로 매치 정보 페이지로 이동 완료');
          }
        });
        return true; // 매치 상태 변경 처리됨
      }

      // 우선순위 3: 시뮬레이션 중이고 플레이어가 가득 찬 경우 확인
      // 단, 자동 이동하지 않고 대기열 상태창에 알림만 표시
      const simulationRunning = localStorage.getItem('simulatedPlayers') !== null &&
                                localStorage.getItem('simulationStartTime') !== null;

      if (simulationRunning && isAuthenticated) {
        // 시뮬레이션 시작 시간 가져오기
        const startTime = parseInt(localStorage.getItem('simulationStartTime') || Date.now().toString());
        // 시간 경과에 따른 플레이어 수 계산 (0.5초당 1명씩 증가)
        const timeElapsed = Math.floor((Date.now() - startTime) / 1000);
        const expectedPlayers = Math.min(10, 1 + Math.floor(timeElapsed / 0.5));

        // 저장된 플레이어 수 확인
        const storedPlayers = parseInt(localStorage.getItem('simulatedPlayers') || '1');
        const currentPlayers = Math.max(expectedPlayers, storedPlayers);

        // 플레이어 수 업데이트 (시뮬레이션 진행 상태 반영)
        localStorage.setItem('simulatedPlayers', currentPlayers.toString());

        if (currentPlayers >= 10) {
          // 10명이 모이면 매치 시작으로 상태 변경 (자동 이동하지 않음)
          console.log('[App] 시뮬레이션에서 10명 모임, 매치 찾음 알림 표시');

          // 매치 찾았을 때 로컬 스토리지 업데이트
          localStorage.setItem('inQueue', 'false');
          localStorage.setItem('matchInProgress', 'true');
          localStorage.setItem('justFoundMatch', 'true'); // 방금 매치를 찾았음을 표시

          // 전역 상태 업데이트
          setQueueStatus(false);

          // 저장된 매치 정보 확인
          const savedMatchInfo = localStorage.getItem('lastMatchInfo');
          if (savedMatchInfo) {
            try {
              const matchInfo = JSON.parse(savedMatchInfo);

              // 대기열 상태 초기화
              localStorage.removeItem('simulatedPlayers');
              localStorage.removeItem('simulationStartTime');

              // 시뮬레이션 중단
              if (window.isSimulationRunning) {
                window.isSimulationRunning = false;
              }

              // 매치 진행 상태로 업데이트
              localStorage.setItem('currentMatchId', matchInfo.matchId);

              // 전역 상태 업데이트
              setMatchProgress(true, matchInfo.matchId);

              return true; // 매치 상태 변경 처리됨
            } catch (err) {
              console.error('[App] 시뮬레이션 매치 정보 파싱 오류:', err);
            }
          }
        }
      }

      // 우선순위 4: 대기열 상태면서 matchInProgress가 true인 경우 (주로 시뮬레이션)
      // 단, 방금 매치를 찾은 경우에는 자동 이동하지 않음
      if (inQueue && isAuthenticated) {
        const matchStarted = localStorage.getItem('matchInProgress') === 'true';
        const justFoundMatch = localStorage.getItem('justFoundMatch') === 'true';

        if (matchStarted && !justFoundMatch) {
          console.log('[App] 대기열 상태이지만 매치가 시작된 것으로 감지됨');

          // 리디렉션 플래그 설정
          localStorage.setItem('redirectedToMatch', 'true');

          // 대기열 상태 초기화
          setQueueStatus(false);

          // 페이지 이동
          if (location.pathname !== '/match-details') {
            console.log('[App] 매치 정보 페이지로 강제 이동');
            navigate('/match-details');
            return true; // 매치 상태 변경 처리됨
          }
        }
      }

      return false; // 매치 상태 변경 없음
    };

    // 초기 상태 확인
    const initialCheck = checkMatchStatus();

    // 주기적으로 상태 확인 (초기 확인에서 변화가 없는 경우에만)
    let intervalId;
    if (!initialCheck) {
      intervalId = setInterval(() => {
        checkMatchStatus();
      }, CHECK_INTERVAL);
    }

    // 클린업 함수
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [matchInProgress, currentMatchId, inQueue, isAuthenticated, location.pathname, navigate, setQueueStatus, setMatchProgress]);

  // 인증 상태가 변경되면 대기열 상태 확인
  useEffect(() => {
    // 로그아웃된 상태에서는 대기열 상태와 매치 상태를 초기화
    if (!isAuthenticated) {
      localStorage.removeItem('inQueue');
      localStorage.removeItem('matchInProgress');
      localStorage.removeItem('currentMatchId');
      localStorage.removeItem('lastMatchInfo');
      localStorage.removeItem('redirectedToMatch'); // 리디렉션 플래그도 초기화
      localStorage.removeItem('justFoundMatch'); // 매치 찾음 플래그도 초기화
      setQueueStatus(false);
      setMatchProgress(false);
    }
  }, [isAuthenticated, setQueueStatus, setMatchProgress]);

  // 매치 상태가 변경될 때 리디렉션 플래그 초기화
  useEffect(() => {
    // 매치가 종료되면 리디렉션 플래그 초기화
    if (!matchInProgress) {
      localStorage.removeItem('redirectedToMatch');
      localStorage.removeItem('justFoundMatch');
    }
  }, [matchInProgress]);

  useEffect(() => {
    console.log('App - 인증 상태 변경:', {
      isAuthenticated,
      isLoading,
      user: user ? {
        id: user.id,
        battleTag: user.battleTag || user.battletag,
        isAdmin: user.isAdmin,
        isSuperAdmin: user.isSuperAdmin
      } : null
    });

    if (isAuthenticated && !isLoading) {
      console.log('App - 인증 완료, 사용자 정보:', user);
    }
  }, [isAuthenticated, isLoading, user]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 relative">
      <Header />

      {/* QueueStatus 컴포넌트 최적화된 래퍼 */}
      <div className="fixed top-0 right-0 z-50 pointer-events-none w-full h-0 overflow-visible" aria-hidden={!isAuthenticated}>
        <QueueStatus key={isAuthenticated ? 'authenticated' : 'anonymous'} />
      </div>

      <main className="flex-grow container mx-auto px-3 sm:px-4 py-4 sm:py-6 mt-16 pt-1 relative">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />
          } />
          <Route path="/auth/callback" element={<AuthSuccessPage />} />
          <Route path="/auth/success" element={<AuthSuccessPage />} />

          {/* 인증이 필요한 라우트 */}
          <Route path="/dashboard" element={
            <PrivateRoute>
              {user?.isAdmin ? <Navigate to="/admin" /> : <DashboardPage />}
            </PrivateRoute>
          } />

          {/* 프로필 페이지를 /profile/setup으로 통합 */}
          <Route path="/profile/setup" element={
            <PrivateRoute>
              <ProfileSetupPage />
            </PrivateRoute>
          } />

          {/* 기존 /profile을 /profile/setup으로 리다이렉트 */}
          <Route path="/profile" element={<Navigate to="/profile/setup" />} />

          <Route path="/matchmaking" element={
            <PrivateRoute>
              <FindMatchPage />
            </PrivateRoute>
          } />

          {/* 매치 세부 정보 페이지 라우트 추가 */}
          <Route path="/match-details" element={
            <PrivateRoute>
              <MatchDetailsPage />
            </PrivateRoute>
          } />

          {/* 리더보드와 최근 게임은 누구나 볼 수 있게 변경 */}
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/recent-games" element={<RecentGamesPage />} />

          {/* 관리자 페이지 라우트 */}
          <Route path="/admin-login" element={
            isAuthenticated && user && user.isAdmin ? <Navigate to="/admin" /> : <AdminLoginPage />
          } />
          <Route path="/admin" element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          } />
          <Route path="/admin/users" element={
            <AdminRoute>
              <AdminUsersPage />
            </AdminRoute>
          } />
          <Route path="/admin/users/:userId" element={
            <AdminRoute>
              <AdminUserEditPage />
            </AdminRoute>
          } />
          <Route path="/admin/matches" element={
            <AdminRoute>
              <AdminMatchesPage />
            </AdminRoute>
          } />
          <Route path="/admin/matches/:matchId" element={
            <AdminRoute>
              <AdminMatchDetailPage />
            </AdminRoute>
          } />

          {/* 404 페이지 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
