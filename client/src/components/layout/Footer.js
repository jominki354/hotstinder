import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

const Footer = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();

  const toggleAdminDropdown = () => {
    setAdminDropdownOpen(!adminDropdownOpen);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setAdminDropdownOpen(false);
  };

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setAdminDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <footer className="bg-slate-950 border-t border-indigo-900/50 py-4">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <div className="mb-3 sm:mb-0">
            <Link to="/" className="flex items-center justify-center">
              <span className="text-indigo-400 font-bold text-xl">HOTS</span>
              <span className="text-white font-semibold text-lg ml-2">Tinder</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link to="/about" className="text-slate-400 text-sm hover:text-indigo-400 transition-colors">
              About
            </Link>

            <p className="text-slate-400 text-sm">
              © {currentYear} HOTSTinder
            </p>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={toggleAdminDropdown}
                className="text-slate-400 text-sm hover:text-indigo-400 transition-colors flex items-center"
              >
                관리자
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {adminDropdownOpen && (
                <div className="absolute right-0 bottom-6 w-32 bg-slate-900 border border-slate-700 rounded shadow-lg py-1 z-10 animate-fadeIn">
                  {isAuthenticated ? (
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-xs text-slate-400 hover:bg-slate-800 hover:text-white"
                    >
                      로그아웃
                    </button>
                  ) : (
                    <Link
                      to="/admin-login"
                      className="block px-4 py-2 text-xs text-slate-400 hover:bg-slate-800 hover:text-white"
                    >
                      로그인
                    </Link>
                  )}
                  {isAuthenticated && user?.isAdmin && (
                    <Link
                      to="/admin"
                      className="block px-4 py-2 text-xs text-green-500 hover:bg-slate-800 hover:text-green-400"
                    >
                      관리
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
