import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuthStore } from '../stores/authStore';

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loadUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // URL에서 토큰과 리디렉션 경로 추출
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        const redirectPath = params.get('redirect') || '/dashboard';
        
        console.log(`[AuthCallbackPage] 콜백 처리 시작 - 토큰 ${token ? '존재함' : '없음'}`);
        setDebugInfo(`토큰: ${token ? '존재함 (길이: ' + token.length + ')' : '없음'}, 리디렉션: ${redirectPath}`);
        
        if (!token) {
          console.error('[AuthCallbackPage] 토큰이 없습니다');
          setError('유효한 인증 토큰이 없습니다.');
          setLoading(false);
          
          // 3초 후 로그인 페이지로 리디렉션
          setTimeout(() => {
            navigate('/login');
          }, 3000);
          return;
        }
        
        // 인증 토큰 저장 및 로그인 처리
        try {
          console.log('[AuthCallbackPage] 로그인 시도 시작');
          const loginResult = await login(token);
          console.log('[AuthCallbackPage] 로그인 결과:', loginResult);
          
          if (!loginResult) {
            throw new Error('로그인에 실패했습니다. 토큰이 유효하지 않을 수 있습니다.');
          }
          
          console.log('[AuthCallbackPage] 로그인 성공');
        } catch (loginErr) {
          console.error('[AuthCallbackPage] 로그인 오류:', loginErr);
          throw new Error(`로그인 중 오류: ${loginErr.message}`);
        }
        
        // 사용자 정보 로드 처리 (선택적 - 실패해도 계속 진행)
        let userInfo = null;
        try {
          console.log('[AuthCallbackPage] 사용자 정보 로드 시도');
          userInfo = await loadUser();
          console.log('[AuthCallbackPage] 사용자 정보 로드 결과:', userInfo);
          
          if (!userInfo) {
            console.warn('[AuthCallbackPage] 사용자 정보가 null입니다');
          }
        } catch (loadErr) {
          console.error('[AuthCallbackPage] 사용자 정보 로드 오류:', loadErr);
          // 사용자 정보 로드 실패해도 계속 진행
        }
        
        // 리디렉션 경로로 이동
        console.log(`[AuthCallbackPage] 리디렉션: ${redirectPath}`);
        setLoading(false);
        
        // 2초 지연 후 리디렉션 (500ms에서 2000ms로 증가)
        setTimeout(() => {
          navigate(redirectPath);
        }, 2000);
      } catch (err) {
        console.error('[AuthCallbackPage] 처리 오류:', err);
        setError(`로그인 처리 중 오류가 발생했습니다: ${err.message || '알 수 없는 오류'}`);
        setDebugInfo(`오류 발생 위치: ${err.stack?.split('\n')[1] || '알 수 없음'}`);
        setLoading(false);
        
        // 오류 발생 시 3초 후 로그인 페이지로 리디렉션
        setTimeout(() => {
          navigate('/login');
        }, 5000);
      }
    };
    
    handleCallback();
  }, [location, login, loadUser, navigate]);

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
        
        {debugInfo && (
          <div className="mt-4 p-3 bg-slate-700 rounded-md text-xs text-left overflow-auto max-h-32">
            <code className="text-gray-300">
              디버그 정보: {debugInfo}
            </code>
          </div>
        )}
        
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