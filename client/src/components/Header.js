import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const Header = () => {
  const { isAuthenticated, user, logout, inQueue } = useAuthStore();
  const navigate = useNavigate();

  // 매치 찾기 버튼 클릭 핸들러
  const handleMatchmakingClick = () => {
    navigate('/matchmaking');

    // 이미 대기열에 등록된 상태라면 배경 효과 유지
    if (inQueue && !document.body.classList.contains('queue-active')) {
      document.body.classList.add('queue-active');
    }
  };

  return (
    <header className="bg-slate-900 shadow-md fixed top-0 left-0 right-0 z-50">
      <nav className="flex items-center">
        <button
          onClick={handleMatchmakingClick}
          className="text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded transition"
        >
          매치 찾기
        </button>
      </nav>
    </header>
  );
};

export default Header;