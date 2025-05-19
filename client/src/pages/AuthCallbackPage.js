import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuthStore } from '../stores/authStore';

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // URL에서 토큰 추출
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    
    if (token) {
      try {
        // 토큰 저장 및 사용자 정보 로드
        login(token);
        
        // 리디렉션 (대시보드 페이지로)
        toast.success('로그인되었습니다.');
        navigate('/dashboard');
      } catch (err) {
        console.error('인증 콜백 처리 오류:', err);
        setError('로그인 처리 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    } else if (params.get('error')) {
      // 오류 파라미터가 있는 경우
      setError(params.get('error') === 'auth_failed' 
        ? '인증에 실패했습니다.' 
        : '로그인 처리 중 오류가 발생했습니다.');
      setLoading(false);
      
      // 3초 후 로그인 페이지로 리디렉션
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } else {
      // 토큰이 없는 경우
      setError('유효한 인증 토큰이 없습니다.');
      setLoading(false);
      
      // 3초 후 로그인 페이지로 리디렉션
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    }
  }, [location, login, navigate]);

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="card max-w-md w-full p-8 text-center">
        <h1 className="text-2xl font-bold text-white mb-6">
          {loading ? '로그인 처리 중...' : (error ? '로그인 오류' : '로그인 성공')}
        </h1>
        
        {loading && (
          <div className="flex justify-center mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {error ? (
          <div className="text-red-400 mb-4">{error}</div>
        ) : !loading ? (
          <div className="text-green-400 mb-4">배틀넷 계정으로 성공적으로 로그인되었습니다.</div>
        ) : null}
        
        <p className="text-gray-300 mt-4">
          {error 
            ? '잠시 후 로그인 페이지로 이동합니다...' 
            : (loading ? '잠시만 기다려 주세요...' : '대시보드로 이동합니다...')}
        </p>
      </div>
    </div>
  );
};

export default AuthCallbackPage; 