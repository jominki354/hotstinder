import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

const Header = () => {
  const { isAuthenticated, user, logout, matchInProgress, currentMatchId, matchInfo, inQueue } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [localInQueue, setLocalInQueue] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = user?.isAdmin === true;
  const isSuperAdmin = user?.isSuperAdmin === true;

  // 로그인 상태와 사용자 정보 디버깅
  useEffect(() => {
    console.log('Header - 인증 상태:', isAuthenticated);
    console.log('Header - 사용자 정보:', user);
    console.log('Header - isAdmin:', user?.isAdmin);
    console.log('Header - isSuperAdmin:', user?.isSuperAdmin);
  }, [isAuthenticated, user]);

  // localStorage 대기열 상태 확인
  useEffect(() => {
    const checkLocalQueue = () => {
      const localQueueStatus = localStorage.getItem('inQueue') === 'true';
      setLocalInQueue(localQueueStatus);
    };

    // 초기 확인
    checkLocalQueue();

    // localStorage 변경 감지
    const handleStorageChange = (e) => {
      if (e.key === 'inQueue') {
        checkLocalQueue();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // 주기적으로 확인 (같은 탭에서의 변경 감지) - 더 빠른 반응
    const interval = setInterval(checkLocalQueue, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // 실제 대기열 상태 (localStorage 우선)
  const actualInQueue = localInQueue || inQueue;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // 다른 곳을 클릭하면 드롭다운이 닫히도록 처리
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownOpen && !event.target.closest('.dropdown-container')) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [dropdownOpen]);

  // 페이지가 변경되면 모바일 메뉴 닫기
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // 사용자 권한에 따른 스타일 및 표시 텍스트 결정
  const getBorderColor = () => {
    if (isSuperAdmin) return 'border-red-400/60 bg-slate-900/60 shadow-2xl shadow-red-500/20';
    if (isAdmin) return 'border-green-400/60 bg-slate-900/60 shadow-2xl shadow-green-500/20';
    return 'border-blue-400/60 bg-slate-900/60 shadow-2xl shadow-blue-500/20';
  };

  // 배틀태그 가져오기 함수 개선
  const getBattleTag = () => {
    if (!user) return '';

    // 디버깅용 로그
    console.log('Header - getBattleTag 호출됨:', {
      battletag: user.battletag,
      battleTag: user.battleTag,
      battleNetTag: user.battleNetTag,
      nickname: user.nickname,
      raw: user
    });

    // null 체크를 포함한 배틀태그 반환 로직 (우선순위 처리)
    return user.battletag || user.battleTag || user.battleNetTag || user.nickname || '';
  };

  // 매치 찾기 버튼 클릭 핸들러
  const handleMatchFindingClick = () => {
    // 매치 진행 중이면 매치 상세 페이지로 이동
    if (matchInProgress && currentMatchId) {
      // 저장된 매치 정보가 있으면 함께 전달
      let savedMatchInfo = null;
      try {
        const savedMatchInfoStr = localStorage.getItem('lastMatchInfo');
        if (savedMatchInfoStr) {
          savedMatchInfo = JSON.parse(savedMatchInfoStr);
        }
      } catch (err) {
        console.error('저장된 매치 정보 파싱 오류:', err);
      }

      // 매치 상세 페이지로 이동
      navigate('/match-details', {
        state: {
          matchInfo: savedMatchInfo || matchInfo || { matchId: currentMatchId }
        }
      });
    } else {
      // 매치 진행 중이 아니면 매치메이킹 페이지로 이동
      navigate('/matchmaking');
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-slate-800/90 backdrop-blur shadow-md py-4 px-6 z-50 h-16 flex items-center">
      <div className="grid grid-cols-3 items-center max-w-6xl mx-auto w-full">
        {/* 로고 - 왼쪽 */}
        <div className="flex items-center">
          <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent hover:from-blue-300 hover:via-purple-300 hover:to-pink-300 transition-all duration-300">
            HotsTinder
          </Link>
        </div>

        {/* 배틀태그 표시 - 중앙 */}
        <div className="flex justify-center">
          {isAuthenticated && user && (
            <div className={`relative px-6 py-3 rounded-2xl text-center shadow-xl border-2 transition-all duration-300 hover:scale-105 ${getBorderColor()}`}>
              {/* 배경 글로우 효과 */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 blur-sm"></div>

              {isSuperAdmin ? (
                <div className="relative flex flex-col items-center">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-red-500 to-rose-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
                      </svg>
                    </div>
                    <span className="text-white font-bold text-lg bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                      {getBattleTag()}
                    </span>
                  </div>
                  <div className="bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
                    👑 최고관리자
                  </div>
                </div>
              ) : isAdmin ? (
                <div className="relative flex flex-col items-center">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-white font-bold text-lg bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                      {getBattleTag()}
                    </span>
                  </div>
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                    ⚡ 관리자
                  </div>
                </div>
              ) : (
                <div className="relative flex items-center justify-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <span className="text-white font-bold text-lg bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    {getBattleTag()}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 모바일 메뉴 버튼 */}
        <div className="md:hidden flex justify-end relative z-[120]">
          <button
            onClick={toggleMobileMenu}
            className="text-slate-300 hover:text-white focus:outline-none p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
            aria-label={mobileMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* 데스크톱 메뉴 - 오른쪽 */}
        <div className="hidden md:flex justify-end">
          <nav className="flex items-center space-x-4">
            <Link to="/" className="text-slate-300 hover:text-white text-sm">홈</Link>
            <Link to="/leaderboard" className="text-slate-300 hover:text-white text-sm">리더보드</Link>
            <Link to="/recent-games" className="text-slate-300 hover:text-white text-sm">최근 게임</Link>

            {/* 관리자 전용 링크 */}
            {user?.isAdmin && (
              <Link to="/admin" className="text-yellow-400 hover:text-yellow-300 text-sm">관리자</Link>
            )}

            {/* 관리자가 아닐 때만 매치 찾기 버튼 표시 */}
            {isAuthenticated && !isAdmin && (
              <button
                onClick={handleMatchFindingClick}
                className={`relative text-slate-300 hover:text-white transition-colors text-sm flex items-center gap-2 ${
                  actualInQueue ? 'text-blue-400 hover:text-blue-300' : ''
                }`}
              >
                {/* 대기열 상태 표시 점 */}
                {actualInQueue && (
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                )}
                {matchInProgress ? '매치 정보' : actualInQueue ? '대기열 상태' : '매치 찾기'}
              </button>
            )}

            {/* 로그인하지 않은 사용자에게만 매치 찾기 링크 표시 */}
            {!isAuthenticated && (
              <Link to="/login" className="text-slate-300 hover:text-white text-sm">매치 찾기</Link>
            )}

            {isAuthenticated ? (
              <div className="relative dropdown-container">
                <button
                  onClick={toggleDropdown}
                  className="text-slate-300 hover:text-white flex items-center focus:outline-none text-sm"
                >
                  계정
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded shadow-lg py-1 z-10 animate-fadeIn">
                    {isAdmin ? (
                      <span
                        className="block px-4 py-2 text-sm text-slate-500 cursor-not-allowed relative group"
                        title="관리자는 대시보드에 접근할 수 없습니다"
                      >
                        대시보드
                        <span className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-slate-700 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                          관리자는 대시보드에 접근할 수 없습니다
                        </span>
                      </span>
                    ) : (
                      <Link to="/dashboard" className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-700">대시보드</Link>
                    )}

                    {isAdmin ? (
                      <span
                        className="block px-4 py-2 text-sm text-slate-500 cursor-not-allowed relative group"
                        title="관리자는 프로필에 접근할 수 없습니다"
                      >
                        프로필
                        <span className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-slate-700 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                          관리자는 프로필에 접근할 수 없습니다
                        </span>
                      </span>
                    ) : (
                      <Link to="/profile" className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-700">프로필</Link>
                    )}

                    {isAdmin && (
                      <>
                        <div className="border-t border-slate-600 my-1"></div>
                        <Link to="/admin" className="block px-4 py-2 text-sm text-green-300 hover:bg-slate-700">
                          관리자 페이지
                        </Link>
                      </>
                    )}

                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700"
                    >
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="text-slate-300 hover:text-white text-sm">로그인</Link>
            )}
          </nav>
        </div>
      </div>

      {/* 모바일 메뉴 */}
      <div
        className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden fixed top-16 left-0 right-0 bg-slate-800/95 backdrop-blur z-[110] shadow-lg ${
          mobileMenuOpen ? 'max-h-96 opacity-100 animate-slideInUp' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="pt-4 pb-2 px-4 space-y-3 max-h-80 overflow-y-auto">
          {isAuthenticated && user && (
            <div className={`relative px-4 py-2 rounded-xl mb-4 text-center shadow-lg border transition-all duration-300 ${getBorderColor()}`}>
              {/* 배경 글로우 효과 */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 blur-sm"></div>

              {isSuperAdmin ? (
                <div className="relative flex flex-col items-center">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 bg-gradient-to-r from-red-500 to-rose-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
                      </svg>
                    </div>
                    <span className="text-white font-bold text-sm bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                      {getBattleTag()}
                    </span>
                  </div>
                  <div className="bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-pulse">
                    👑 최고관리자
                  </div>
                </div>
              ) : isAdmin ? (
                <div className="relative flex flex-col items-center">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-white font-bold text-sm bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                      {getBattleTag()}
                    </span>
                  </div>
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                    ⚡ 관리자
                  </div>
                </div>
              ) : (
                <div className="relative flex items-center justify-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <span className="text-white font-bold text-sm bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    {getBattleTag()}
                  </span>
                </div>
              )}
            </div>
          )}

          <Link to="/" className="block py-3 text-slate-300 hover:text-white text-center border-b border-slate-700" onClick={() => setMobileMenuOpen(false)}>홈</Link>
          <Link to="/leaderboard" className="block py-3 text-slate-300 hover:text-white text-center border-b border-slate-700" onClick={() => setMobileMenuOpen(false)}>리더보드</Link>
          <Link to="/recent-games" className="block py-3 text-slate-300 hover:text-white text-center border-b border-slate-700" onClick={() => setMobileMenuOpen(false)}>최근 게임</Link>

          {/* 관리자 전용 링크 */}
          {user?.isAdmin && (
            <Link to="/admin" className="block py-3 text-yellow-400 hover:text-yellow-300 text-center border-b border-slate-700" onClick={() => setMobileMenuOpen(false)}>관리자</Link>
          )}

          {/* 관리자가 아닐 때만 매치 찾기 버튼 표시 */}
          {isAuthenticated && !isAdmin && (
            <button
              onClick={() => {
                handleMatchFindingClick();
                setMobileMenuOpen(false);
              }}
              className={`w-full py-3 text-center border-b border-slate-700 relative text-slate-300 hover:text-white transition-colors flex items-center justify-center gap-2 ${
                actualInQueue ? 'text-blue-400 hover:text-blue-300' : ''
              }`}
            >
              {/* 대기열 상태 표시 점 */}
              {actualInQueue && (
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              )}
              {matchInProgress ? '매치 정보' : actualInQueue ? '대기열 상태' : '매치 찾기'}
            </button>
          )}

          {/* 로그인하지 않은 사용자에게만 매치 찾기 링크 표시 */}
          {!isAuthenticated && (
            <Link to="/login" className="block py-3 text-slate-300 hover:text-white text-center border-b border-slate-700" onClick={() => setMobileMenuOpen(false)}>매치 찾기</Link>
          )}

          {isAuthenticated ? (
            <>
              {isAdmin ? (
                <span
                  className="block py-3 text-slate-500 cursor-not-allowed text-center border-b border-slate-700"
                  title="관리자는 대시보드에 접근할 수 없습니다"
                >
                  대시보드
                </span>
              ) : (
                <Link to="/dashboard" className="block py-3 text-slate-300 hover:text-white text-center border-b border-slate-700" onClick={() => setMobileMenuOpen(false)}>대시보드</Link>
              )}

              {isAdmin ? (
                <span
                  className="block py-3 text-slate-500 cursor-not-allowed text-center border-b border-slate-700"
                  title="관리자는 프로필에 접근할 수 없습니다"
                >
                  프로필
                </span>
              ) : (
                <Link to="/profile" className="block py-3 text-slate-300 hover:text-white text-center border-b border-slate-700" onClick={() => setMobileMenuOpen(false)}>프로필</Link>
              )}

              {isAdmin && (
                <Link to="/admin" className="block py-3 text-green-300 hover:text-white text-center border-b border-slate-700" onClick={() => setMobileMenuOpen(false)}>관리자 페이지</Link>
              )}

              <button
                onClick={handleLogout}
                className="block w-full text-center py-3 text-slate-300 hover:text-white bg-red-600/20 hover:bg-red-600/40 rounded mt-2"
              >
                로그아웃
              </button>
            </>
          ) : (
            <Link to="/login" className="block py-3 text-slate-300 hover:text-white text-center border-b border-slate-700" onClick={() => setMobileMenuOpen(false)}>로그인</Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
