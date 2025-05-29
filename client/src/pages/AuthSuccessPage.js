import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const AuthSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('인증 처리 중...');

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
        console.log('AuthSuccessPage - 토큰 저장 중:', { tokenLength: token.length });

        // 토큰을 localStorage에 저장 (authStore와 일관성 유지)
        localStorage.setItem('token', token);

        const apiUrl = getApiUrl();
        console.log('AuthSuccessPage - API URL:', apiUrl);

        // 사용자 정보를 가져와서 검증 - 절대 URL 사용
        fetch(`${apiUrl}/api/auth/me`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        })
          .then(response => {
            console.log('AuthSuccessPage - API 응답 상태:', response.status);

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return response.json();
          })
          .then(data => {
            console.log('AuthSuccessPage - API 응답 데이터:', data);

            if (data.user) {
              setStatus('success');
              setMessage(`환영합니다, ${data.user.battletag}님!`);

              // 리다이렉트 경로가 있으면 해당 경로로, 없으면 대시보드로
              setTimeout(() => {
                navigate(redirect || '/dashboard');
              }, 2000);
            } else {
              throw new Error('사용자 정보를 가져올 수 없습니다.');
            }
          })
          .catch(error => {
            console.error('AuthSuccessPage - 사용자 정보 조회 실패:', error);
            setStatus('error');
            setMessage('사용자 정보를 가져오는데 실패했습니다.');

            // 토큰 제거
            localStorage.removeItem('token');

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
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-slate-800 rounded-lg shadow-xl p-8 text-center border border-indigo-900/50">
        <div className="mb-6">
          {status === 'processing' && (
            <div className="w-16 h-16 mx-auto mb-4">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-400"></div>
            </div>
          )}

          {status === 'success' && (
            <div className="w-16 h-16 mx-auto mb-4 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}

          {status === 'error' && (
            <div className="w-16 h-16 mx-auto mb-4 bg-red-500 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
        </div>

        <h1 className="text-2xl font-bold text-white mb-4">
          {status === 'processing' && '인증 처리 중'}
          {status === 'success' && '인증 성공!'}
          {status === 'error' && '인증 실패'}
        </h1>

        <p className="text-gray-300 mb-6">
          {message}
        </p>

        {status === 'success' && (
          <p className="text-sm text-gray-400">
            잠시 후 자동으로 이동합니다...
          </p>
        )}

        {status === 'error' && (
          <div className="mt-4">
            <button
              onClick={() => navigate('/login')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              지금 이동하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthSuccessPage;
