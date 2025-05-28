import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  // 인증이 안 된 경우 로그인 페이지로 리디렉션
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default PrivateRoute; 