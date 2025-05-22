import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
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

// 인증이 필요한 라우트를 위한 컴포넌트
const PrivateRouteComponent = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <div>로딩 중...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

// 프로필 설정이 완료된 사용자만 접근 가능한 라우트
const ProfileCompletedRoute = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useAuthStore();

  if (isLoading) {
    return <div>로딩 중...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // 관리자는 대시보드와 프로필 페이지에 접근할 수 없음
  if (user?.isAdmin) {
    return <Navigate to="/admin" />;
  }

  // 프로필 설정 여부 확인 - localStorage도 검사
  const localProfileComplete = localStorage.getItem('profileComplete');
  const isProfileComplete = user?.isProfileComplete || localProfileComplete === 'true';

  if (!user || !isProfileComplete) {
    console.log('프로필 설정이 필요합니다. 프로필 설정 페이지로 이동합니다.');
    console.log('isProfileComplete (user):', user?.isProfileComplete);
    console.log('isProfileComplete (localStorage):', localProfileComplete);
    return <Navigate to="/profile/setup" />;
  }

  return children;
};

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
    setQueueStatus,
    setMatchProgress,
    currentMatchId,
    matchInfo,
    setMatchInfo
  } = useAuthStore();

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

  // 인증 상태가 변경되면 대기열 상태 확인
  useEffect(() => {
    // 로그아웃된 상태에서는 대기열 상태와 매치 상태를 초기화
    if (!isAuthenticated) {
      localStorage.removeItem('inQueue');
      localStorage.removeItem('matchInProgress');
      localStorage.removeItem('currentMatchId');
      localStorage.removeItem('lastMatchInfo');
      setQueueStatus(false);
      setMatchProgress(false);
    }
  }, [isAuthenticated, setQueueStatus, setMatchProgress]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-900">
      <Header />
      
      {/* QueueStatus 컴포넌트를 Routes 외부로 이동 */}
      <QueueStatus />
      
      <main className="flex-grow container mx-auto px-3 sm:px-4 py-4 sm:py-6 mt-16 pt-1 relative z-10">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />
          } />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/auth/success" element={<AuthCallbackPage />} />
          
          {/* 인증이 필요한 라우트 */}
          <Route path="/dashboard" element={
            <ProfileCompletedRoute>
              <DashboardPage />
            </ProfileCompletedRoute>
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
      <ToastContainer 
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  );
}

export default App; 