import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-6xl font-bold text-blue-600 mb-6">404</h1>
      <h2 className="text-3xl font-semibold text-gray-800 mb-4">페이지를 찾을 수 없습니다</h2>
      <p className="text-gray-600 text-lg mb-8 max-w-md">
        죄송합니다. 요청하신 페이지가 존재하지 않거나 이동되었습니다.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          to="/"
          className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition"
        >
          홈으로 돌아가기
        </Link>
        <Link
          to="/matchmaking"
          className="bg-gray-200 text-gray-800 py-2 px-6 rounded-lg hover:bg-gray-300 transition"
        >
          매치 찾기
        </Link>
      </div>
      
      <div className="mt-16">
        <img 
          src="/assets/images/404.svg" 
          alt="페이지를 찾을 수 없음" 
          className="max-w-xs opacity-60"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      </div>
    </div>
  );
};

export default NotFoundPage; 