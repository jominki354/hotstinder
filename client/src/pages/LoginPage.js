import React from 'react';

const LoginPage = () => {
  // API 기본 URL (환경에 따라 동적 설정)
  const getApiUrl = () => {
    // 프로덕션 환경 (Vercel 배포)
    if (process.env.NODE_ENV === 'production') {
      return process.env.REACT_APP_API_URL || 'https://hotstinder.vercel.app';
    }
    // 개발 환경
    return process.env.REACT_APP_API_URL || 'http://localhost:5000';
  };

  const API_URL = getApiUrl();

  const handleBattleNetLogin = (e) => {
    e.preventDefault();

    // 새 창이나 현재 창에서 직접 URL 열기
    window.location.href = `${API_URL}/api/auth/bnet`;
  };

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-12 px-4 bg-slate-900 min-h-screen">
      <div className="text-center mb-8 sm:mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 sm:mb-4">
          <span className="text-indigo-400">HOTS</span>Tinder
        </h1>
        <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto">
          배틀넷 계정으로 간편하게 로그인하고 커스텀 게임에 참여하세요!
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 sm:gap-12 items-center">
        <div>
          <div className="bg-slate-800 p-6 rounded-lg shadow-lg border border-indigo-900/50">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">로그인</h2>
            <p className="text-gray-300 mb-6 sm:mb-8">
              아래 사항에 동의하고 가입합니다
            </p>
            <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
              <li className="flex items-start">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-gray-300">배틀태그 지역태그 #3으로 시작</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-gray-300">최소 계정 레벨 300 이상부터</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-gray-300">관리자에 의해 임의로 유효성 판단</span>
              </li>
            </ul>

            <button
              type="button"
              onClick={handleBattleNetLogin}
              className="battlenet-button w-full"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2ZM16.382 17.5C16.382 17.5 15.164 16.588 14.184 16C14.184 16 14.977 15.043 15.249 14.577C15.522 14.112 14.539 14.332 14.198 14.332C13.857 14.332 12.496 14.332 12.097 14.332C11.698 14.332 10.906 14.332 9.994 14.332C9.083 14.332 8.29 14.332 8.29 14.332C8.29 14.332 7.38 14.332 6.584 14.681C5.788 15.03 5.536 16.152 5.536 16.152C5.536 16.152 5.941 17 6.667 17.444C7.394 17.888 8.364 17.888 8.364 17.888H15.522C15.522 17.888 16.382 17.5 16.382 17.5ZM12.318 13.455C12.318 13.455 13.595 12.542 14.198 12.172C14.801 11.802 15.132 11.506 15.132 11.506C15.132 11.506 15.368 11.321 15.566 10.966C15.764 10.612 15.764 10.185 15.566 9.83C15.368 9.475 15.015 9.069 14.663 8.714C14.311 8.36 13.893 8.147 13.52 7.934C13.148 7.721 11.809 7.314 11.809 7.314C11.809 7.314 11.033 7.277 10.38 7.721C9.728 8.165 9.469 8.714 9.247 9.252C9.025 9.79 9.025 10.363 9.173 10.781C9.321 11.199 9.766 11.728 9.766 11.728C9.766 11.728 10.084 12.061 10.755 12.505C11.427 12.949 12.318 13.455 12.318 13.455Z" />
              </svg>
              배틀넷으로 로그인
            </button>
          </div>
        </div>

        <div className="hidden md:block">
          <div className="relative">
            <img
              src="https://blz-contentstack-images.akamaized.net/v3/assets/blt3e332b432769ff34/blt466dc9d442dfc64d/5e78e5a0b13e9663187c1857/heroes-of-the-storm.jpg"
              alt="Heroes of the Storm"
              className="rounded-lg shadow-xl w-full h-auto border border-indigo-900/30"
            />
            <div className="absolute bottom-0 left-0 p-6 bg-slate-900/70 rounded-bl-lg rounded-br-lg w-full">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">커스텀 게임 매칭</h3>
              <p className="text-gray-300">
                실력이 비슷한 다른 플레이어들과 함께 균형 잡힌 게임을 즐겨보세요.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 sm:mt-16 text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">이용 안내</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
          <div className="bg-slate-800 p-6 rounded-lg shadow-lg text-center border border-indigo-900/50">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white mb-2">계정 연결</h3>
            <p className="text-gray-300">
              배틀넷 계정으로 로그인하여 히어로즈 오브 더 스톰 프로필을 연결합니다.
            </p>
          </div>
          <div className="bg-slate-800 p-6 rounded-lg shadow-lg text-center border border-indigo-900/50">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white mb-2">매치 찾기</h3>
            <p className="text-gray-300">
              원하는 매치를 찾거나 직접 새로운 매치를 생성하여 다른 플레이어를 초대합니다.
            </p>
          </div>
          <div className="bg-slate-800 p-6 rounded-lg shadow-lg text-center sm:col-span-2 md:col-span-1 border border-indigo-900/50">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white mb-2">게임 즐기기</h3>
            <p className="text-gray-300">
              게임이 시작되면 참가자들과 커뮤니케이션하며 히어로즈 오브 더 스톰을 즐깁니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;