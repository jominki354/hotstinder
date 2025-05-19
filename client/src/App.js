import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import ProfileSetupPage from './pages/ProfileSetupPage';
import FindMatchPage from './pages/FindMatchPage';
import LeaderboardPage from './pages/LeaderboardPage';
import RecentGamesPage from './pages/RecentGamesPage';
import NotFoundPage from './pages/NotFoundPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminPage from './pages/AdminPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminUserEditPage from './pages/AdminUserEditPage';
import AdminMatchesPage from './pages/AdminMatchesPage';
import AdminMatchDetailPage from './pages/AdminMatchDetailPage';
import { useAuthStore } from './stores/authStore';

// 인증이 필요한 라우트를 위한 컴포넌트
const PrivateRoute = ({ children }) => {
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

  if (!user || !user.isProfileComplete) {
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
  const { isAuthenticated, user, loadUser, checkAuth } = useAuthStore();

  useEffect(() => {
    // 토큰이 있으면 사용자 정보 로드
    loadUser().catch(err => {
      console.error('사용자 정보 로드 중 오류:', err);
      toast.error('사용자 정보를 불러오는데 실패했습니다.');
    });
  }, [loadUser]);

  // 앱 로드 시 인증 상태 확인
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-900">
      <Header />
      <main className="flex-grow container mx-auto px-3 sm:px-4 py-4 sm:py-6">
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
          <Route path="/profile" element={
            <ProfileCompletedRoute>
              <ProfilePage />
            </ProfileCompletedRoute>
          } />
          <Route path="/profile/setup" element={
            <PrivateRoute>
              <ProfileSetupPage />
            </PrivateRoute>
          } />
          <Route path="/matchmaking" element={
            <ProfileCompletedRoute>
              <FindMatchPage />
            </ProfileCompletedRoute>
          } />
          <Route path="/leaderboard" element={
            <ProfileCompletedRoute>
              <LeaderboardPage />
            </ProfileCompletedRoute>
          } />
          <Route path="/recent-games" element={
            <ProfileCompletedRoute>
              <RecentGamesPage />
            </ProfileCompletedRoute>
          } />
          
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