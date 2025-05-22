import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

const Header = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = user?.isAdmin === true;
  const isSuperAdmin = user?.isSuperAdmin === true;

  // 로그인 상태와 사용자 정보 디버깅
  useEffect(() => {
    console.log('Header - 인증 상태:', isAuthenticated);
    console.log('Header - 사용자 정보:', user);
  }, [isAuthenticated, user]);

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
      if (dropdownOpen && !event.target.closest('.relative')) {
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
    if (isSuperAdmin) return 'border-red-500 bg-slate-800/80';
    if (isAdmin) return 'border-green-500 bg-slate-800/80';
    return 'border-indigo-500 bg-slate-800';
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

  return (
    <header className="fixed top-0 left-0 right-0 bg-slate-800/90 backdrop-blur shadow-md py-4 px-6 z-50 h-16 flex items-center">
      <div className="grid grid-cols-3 items-center max-w-6xl mx-auto w-full">
        {/* 로고 - 왼쪽 */}
        <div className="flex items-center">
          <Link to="/" className="text-2xl font-bold text-white">
            <span className="text-indigo-400">HOTS</span>Tinder
          </Link>
        </div>

        {/* 배틀태그 표시 - 중앙 */}
        <div className="flex justify-center">
          {isAuthenticated && user && (
            <div className={`px-4 py-2 rounded-md text-center shadow-lg border ${getBorderColor()} flex items-center`}>
              {isSuperAdmin ? (
                <div className="flex flex-col">
                  <span className="text-indigo-300 font-bold">{getBattleTag()}</span>
                  <span className="text-red-400 text-xs font-semibold mt-1 bg-red-900/30 px-2 py-1 rounded">최고관리자</span>
                </div>
              ) : isAdmin ? (
                <div className="flex flex-col">
                  <span className="text-indigo-300 font-bold">{getBattleTag()}</span>
                  <span className="text-green-400 text-xs font-semibold mt-1 bg-green-900/30 px-2 py-1 rounded">관리자</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <span className="text-indigo-300 font-bold">{getBattleTag()}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 모바일 메뉴 버튼 */}
        <div className="md:hidden flex justify-end">
          <button 
            onClick={toggleMobileMenu}
            className="text-slate-300 hover:text-white focus:outline-none"
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
          <nav className="flex items-center space-x-6">
            <Link to="/" className="text-slate-300 hover:text-white">홈</Link>
            <Link to="/leaderboard" className="text-slate-300 hover:text-white">리더보드</Link>
            <Link to="/recent-games" className="text-slate-300 hover:text-white">최근 게임</Link>
            
            {/* 관리자가 아닐 때만 매치 찾기 링크 활성화 */}
            {isAuthenticated && !isAdmin ? (
              <Link to="/matchmaking" className="text-slate-300 hover:text-white">매치 찾기</Link>
            ) : isAuthenticated && isAdmin ? (
              <span className="text-slate-500 cursor-not-allowed">매치 찾기</span>
            ) : (
              <Link to="/login" className="text-slate-300 hover:text-white">매치 찾기</Link>
            )}
            
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={toggleDropdown}
                  className="text-slate-300 hover:text-white flex items-center focus:outline-none"
                >
                  계정
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded shadow-lg py-1 z-10 animate-fadeIn">
                    {isAdmin ? (
                      <span className="block px-4 py-2 text-sm text-slate-500 cursor-not-allowed">대시보드</span>
                    ) : (
                      <Link to="/dashboard" className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-700">대시보드</Link>
                    )}
                    
                    {isAdmin ? (
                      <span className="block px-4 py-2 text-sm text-slate-500 cursor-not-allowed">프로필</span>
                    ) : (
                      <Link to="/profile" className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-700">프로필</Link>
                    )}
                    
                    {isAdmin && (
                      <Link to="/admin" className="block px-4 py-2 text-sm text-green-300 hover:bg-slate-700">관리자 페이지</Link>
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
              <Link to="/login" className="text-slate-300 hover:text-white">로그인</Link>
            )}
          </nav>
        </div>
      </div>

      {/* 모바일 메뉴 */}
      <div 
        className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden fixed top-16 left-0 right-0 bg-slate-800/95 backdrop-blur z-40 shadow-lg ${
          mobileMenuOpen ? 'max-h-96 opacity-100 animate-slideInUp' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="pt-4 pb-2 px-4 space-y-3">
          {isAuthenticated && user && (
            <div className={`px-4 py-2 rounded-md mb-4 text-center shadow-lg border ${getBorderColor()} flex items-center justify-center`}>
              {isSuperAdmin ? (
                <div className="flex flex-col">
                  <span className="text-indigo-300 font-bold">{getBattleTag()}</span>
                  <span className="text-red-400 text-xs font-semibold mt-1 bg-red-900/30 px-2 py-1 rounded">최고관리자</span>
                </div>
              ) : isAdmin ? (
                <div className="flex flex-col">
                  <span className="text-indigo-300 font-bold">{getBattleTag()}</span>
                  <span className="text-green-400 text-xs font-semibold mt-1 bg-green-900/30 px-2 py-1 rounded">관리자</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <span className="text-indigo-300 font-bold">{getBattleTag()}</span>
                </div>
              )}
            </div>
          )}
          
          <Link to="/" className="block py-2 text-slate-300 hover:text-white">홈</Link>
          <Link to="/leaderboard" className="block py-2 text-slate-300 hover:text-white">리더보드</Link>
          <Link to="/recent-games" className="block py-2 text-slate-300 hover:text-white">최근 게임</Link>
          
          {/* 관리자가 아닐 때만 매치 찾기 링크 활성화 */}
          {isAuthenticated && !isAdmin ? (
            <Link to="/matchmaking" className="block py-2 text-slate-300 hover:text-white">매치 찾기</Link>
          ) : isAuthenticated && isAdmin ? (
            <span className="block py-2 text-slate-500 cursor-not-allowed">매치 찾기</span>
          ) : (
            <Link to="/login" className="block py-2 text-slate-300 hover:text-white">매치 찾기</Link>
          )}
          
          {isAuthenticated ? (
            <>
              {isAdmin ? (
                <span className="block py-2 text-slate-500 cursor-not-allowed">대시보드</span>
              ) : (
                <Link to="/dashboard" className="block py-2 text-slate-300 hover:text-white">대시보드</Link>
              )}
              
              {isAdmin ? (
                <span className="block py-2 text-slate-500 cursor-not-allowed">프로필</span>
              ) : (
                <Link to="/profile" className="block py-2 text-slate-300 hover:text-white">프로필</Link>
              )}
              
              {isAdmin && (
                <Link to="/admin" className="block py-2 text-green-300 hover:text-white">관리자 페이지</Link>
              )}
              
              <button
                onClick={handleLogout}
                className="block w-full text-left py-2 text-slate-300 hover:text-white"
              >
                로그아웃
              </button>
            </>
          ) : (
            <Link to="/login" className="block py-2 text-slate-300 hover:text-white">로그인</Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 