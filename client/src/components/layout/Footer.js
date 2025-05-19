import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

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
          
          <div className="flex flex-col items-center sm:items-end">
            <p className="text-slate-400 text-sm text-center mb-1">
              © {currentYear} HOTSTinder
            </p>
            <Link 
              to="/admin-login" 
              className="text-slate-500 text-xs hover:text-indigo-400 transition-colors"
            >
              관리자 로그인
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 