import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuthStore } from '../../stores/authStore';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, isTokenValid } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    // 토큰이 있지만 유효하지 않은 경우
    if (isAuthenticated && !isTokenValid()) {
      toast.error('로그인 세션이 만료되었습니다. 다시 로그인해주세요.');
    }
  }, [isAuthenticated, isTokenValid, location]);

  // 인증이 안 된 경우 로그인 페이지로 리디렉션
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default PrivateRoute; 