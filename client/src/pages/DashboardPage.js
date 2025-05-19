import React from 'react';
import { useAuthStore } from '../stores/authStore';

const DashboardPage = () => {
  const { user } = useAuthStore();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-blue-600 mb-6">대시보드</h1>
      
      {user && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <div className="flex items-center mb-4">
            {user.avatar ? (
              <img src={user.avatar} alt="프로필 사진" className="w-16 h-16 rounded-full mr-4" />
            ) : (
              <div className="w-16 h-16 bg-blue-100 rounded-full mr-4 flex items-center justify-center">
                <span className="text-blue-600 font-bold text-xl">{user.battletag?.charAt(0) || '?'}</span>
              </div>
            )}
            <div>
              <h2 className="text-2xl font-semibold">{user.battletag || '배틀태그 없음'}</h2>
              <p className="text-gray-600">가입일: {new Date(user.createdAt).toLocaleDateString('ko-KR')}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-600">최근 경기</h2>
          <p className="text-gray-600 mb-4">최근 5개 경기의 결과를 확인하세요.</p>
          <div className="space-y-2">
            <p className="text-gray-500 italic">아직 경기 데이터가 없습니다.</p>
          </div>
          <button className="mt-4 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition">
            모든 경기 보기
          </button>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-600">경기 만들기</h2>
          <p className="text-gray-600 mb-4">새로운 커스텀 게임을 만들고 친구들을 초대하세요.</p>
          <button className="mt-4 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition">
            경기 만들기
          </button>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-600">참여 가능한 경기</h2>
          <p className="text-gray-600 mb-4">현재 모집 중인 경기 목록입니다.</p>
          <div className="space-y-2">
            <p className="text-gray-500 italic">현재 모집 중인 경기가 없습니다.</p>
          </div>
          <button className="mt-4 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition">
            경기 찾기
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage; 