import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

const Header = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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

  return (
    <header className="bg-slate-800/90 backdrop-blur shadow-md py-4 px-6">
      <div className="grid grid-cols-3 items-center max-w-6xl mx-auto">
        {/* 로고 - 왼쪽 */}
        <div className="flex items-center">
          <Link to="/" className="text-2xl font-bold text-white">
            <span className="text-indigo-400">HOTS</span>Tinder
          </Link>
        </div>

        {/* 배틀태그 표시 - 중앙 */}
        <div className="flex justify-center">
          {isAuthenticated && user && (
            <div className="bg-slate-800 px-4 py-2 rounded-md text-center shadow-lg border border-indigo-500">
              <span className="text-indigo-300 font-bold">{user.battletag}</span>
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
            <Link to="/matchmaking" className="text-slate-300 hover:text-white">매치 찾기</Link>
            
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
                    <Link to="/dashboard" className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-700">대시보드</Link>
                    <Link to="/profile" className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-700">프로필</Link>
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
        className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden ${
          mobileMenuOpen ? 'max-h-96 opacity-100 animate-slideInUp' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="pt-4 pb-2 px-4 space-y-3">
          {isAuthenticated && user && (
            <div className="bg-slate-800 px-4 py-2 rounded-md mb-4 text-center shadow-lg border border-indigo-500">
              <span className="text-indigo-300 font-bold">{user.battletag}</span>
            </div>
          )}
          
          <Link to="/" className="block py-2 text-slate-300 hover:text-white">홈</Link>
          <Link to="/leaderboard" className="block py-2 text-slate-300 hover:text-white">리더보드</Link>
          <Link to="/recent-games" className="block py-2 text-slate-300 hover:text-white">최근 게임</Link>
          <Link to="/matchmaking" className="block py-2 text-slate-300 hover:text-white">매치 찾기</Link>
          
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="block py-2 text-slate-300 hover:text-white">대시보드</Link>
              <Link to="/profile" className="block py-2 text-slate-300 hover:text-white">프로필</Link>
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