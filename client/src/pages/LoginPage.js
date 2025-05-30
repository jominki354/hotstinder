import React from 'react';

const LoginPage = () => {
  // API 기본 URL (환경에 따라 동적 설정)
  const getApiUrl = () => {
    // 디버깅용 로그
    console.log('=== 환경변수 디버깅 ===');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);

    // 프로덕션 환경 (Vercel 배포)
    if (process.env.NODE_ENV === 'production') {
      const url = process.env.REACT_APP_API_URL || 'https://hotstinder.vercel.app';
      console.log('프로덕션 환경 - 사용할 URL:', url);
      return url;
    }
    // 개발 환경
    const url = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    console.log('개발 환경 - 사용할 URL:', url);
    return url;
  };

  const API_URL = getApiUrl();
  console.log('최종 API_URL:', API_URL);

  const handleBattleNetLogin = (e) => {
    e.preventDefault();

    // 새 창이나 현재 창에서 직접 URL 열기
    window.location.href = `${API_URL}/api/auth/bnet`;
  };

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
            <p className="text-xl text-gray-300">
              배틀넷 로그인
            </p>
          </div>

          {/* 로그인 카드 */}
          <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-600/30 rounded-3xl p-8 shadow-2xl">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-4">로그인</h2>
              <p className="text-gray-300 mb-6">
                아래 사항에 동의하고 가입합니다
              </p>
            </div>

            {/* 필수 조건 */}
            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-300">배틀태그 지역태그 #3으로 시작</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-300">최소 계정 레벨 300 이상부터</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-300">관리자에 의해 임의로 유효성 판단</span>
              </div>
            </div>

            {/* 배틀넷 로그인 버튼 */}
            <button
              type="button"
              onClick={handleBattleNetLogin}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25 flex items-center justify-center gap-3"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2ZM16.382 17.5C16.382 17.5 15.164 16.588 14.184 16C14.184 16 14.977 15.043 15.249 14.577C15.522 14.112 14.539 14.332 14.198 14.332C13.857 14.332 12.496 14.332 12.097 14.332C11.698 14.332 10.906 14.332 9.994 14.332C9.083 14.332 8.29 14.332 8.29 14.332C8.29 14.332 7.38 14.332 6.584 14.681C5.788 15.03 5.536 16.152 5.536 16.152C5.536 16.152 5.941 17 6.667 17.444C7.394 17.888 8.364 17.888 8.364 17.888H15.522C15.522 17.888 16.382 17.5 16.382 17.5ZM12.318 13.455C12.318 13.455 13.595 12.542 14.198 12.172C14.801 11.802 15.132 11.506 15.132 11.506C15.132 11.506 15.368 11.321 15.566 10.966C15.764 10.612 15.764 10.185 15.566 9.83C15.368 9.475 15.015 9.069 14.663 8.714C14.311 8.36 13.893 8.147 13.52 7.934C13.148 7.721 11.809 7.314 11.809 7.314C11.809 7.314 11.033 7.277 10.38 7.721C9.728 8.165 9.469 8.714 9.247 9.252C9.025 9.79 9.025 10.363 9.173 10.781C9.321 11.199 9.766 11.728 9.766 11.728C9.766 11.728 10.084 12.061 10.755 12.505C11.427 12.949 12.318 13.455 12.318 13.455Z" />
              </svg>
              배틀넷으로 로그인
            </button>
          </div>

          {/* 하단 안내 */}
          <div className="text-center mt-8">
            <p className="text-gray-400 text-sm">
              로그인하면 서비스 이용약관에 동의하는 것으로 간주됩니다
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
