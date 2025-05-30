import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const AuthSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('인증 처리 중...');
  const { login } = useAuthStore();

  // API URL 가져오기 함수
  const getApiUrl = () => {
    if (process.env.NODE_ENV === 'production') {
      return process.env.REACT_APP_API_URL || 'https://hotstinder.vercel.app';
    }
    return process.env.REACT_APP_API_URL || 'http://localhost:5000';
  };

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');
    const redirect = searchParams.get('redirect');

    console.log('AuthSuccessPage - 받은 파라미터:', { token: token ? 'exists' : 'null', error, redirect });

    if (error) {
      setStatus('error');
      switch (error) {
        case 'auth_failed':
          setMessage('배틀넷 인증에 실패했습니다.');
          break;
        case 'token_error':
          setMessage('토큰 생성 중 오류가 발생했습니다.');
          break;
        case 'invalid_state':
          setMessage('잘못된 인증 상태입니다.');
          break;
        default:
          setMessage('알 수 없는 오류가 발생했습니다.');
      }

      // 3초 후 로그인 페이지로 리다이렉트
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      return;
    }

    if (token) {
      try {
        console.log('AuthSuccessPage - 토큰 처리 시작:', { tokenLength: token.length });

        // authStore의 login 함수를 사용하여 토큰 처리
        login(token)
          .then((success) => {
            if (success) {
              console.log('AuthSuccessPage - 로그인 성공');
              setStatus('success');
              setMessage('인증이 완료되었습니다!');

              // 사용자 정보 확인을 위해 잠시 대기
              setTimeout(() => {
                const { user } = useAuthStore.getState();
                if (user && user.battletag) {
                  setMessage(`환영합니다, ${user.battletag}님!`);
                }

                // 리다이렉트 경로가 있으면 해당 경로로, 없으면 대시보드로
                setTimeout(() => {
                  navigate(redirect || '/dashboard');
                }, 2000);
              }, 1000);
            } else {
              throw new Error('로그인 처리에 실패했습니다.');
            }
          })
          .catch(error => {
            console.error('AuthSuccessPage - 로그인 처리 실패:', error);
            setStatus('error');
            setMessage('인증 처리 중 오류가 발생했습니다.');

            setTimeout(() => {
              navigate('/login');
            }, 3000);
          });

      } catch (error) {
        console.error('AuthSuccessPage - 토큰 처리 오류:', error);
        setStatus('error');
        setMessage('토큰 처리 중 오류가 발생했습니다.');

        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } else {
      setStatus('error');
      setMessage('인증 토큰이 없습니다.');

      setTimeout(() => {
        navigate('/login');
      }, 3000);
    }
  }, [searchParams, navigate, login]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* 배경 패턴 */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      ></div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* 헤더 */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
              HotsTinder
            </h1>
          </div>

          {/* 상태 카드 */}
          <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-600/30 rounded-3xl p-8 shadow-2xl text-center">
            <div className="mb-6">
              {status === 'processing' && (
                <div className="w-20 h-20 mx-auto mb-6">
                  <div className="animate-spin rounded-full h-20 w-20 border-4 border-slate-600 border-t-blue-400"></div>
                </div>
              )}

              {status === 'success' && (
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/25">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}

              {status === 'error' && (
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-red-500 to-rose-500 rounded-full flex items-center justify-center shadow-lg shadow-red-500/25">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}
            </div>

            <h2 className="text-3xl font-bold text-white mb-4">
              {status === 'processing' && '인증 처리 중'}
              {status === 'success' && '인증 성공!'}
              {status === 'error' && '인증 실패'}
            </h2>

            <p className="text-xl text-gray-300 mb-6">
              {message}
            </p>

            {status === 'success' && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 mb-6">
                <p className="text-green-400 font-medium">
                  잠시 후 자동으로 이동합니다...
                </p>
              </div>
            )}

            {status === 'error' && (
              <div className="mt-6">
                <button
                  onClick={() => navigate('/login')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-3 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25"
                >
                  로그인 페이지로 이동
                </button>
              </div>
            )}

            {status === 'processing' && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4">
                <p className="text-blue-400 font-medium">
                  잠시만 기다려주세요...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthSuccessPage;
