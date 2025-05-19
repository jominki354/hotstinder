import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import axios from 'axios';

const AdminPage = () => {
  const { isAuthenticated, user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMatches: 0,
    activeUsers: 0,
    recentMatches: 0
  });
  const [error, setError] = useState('');
  
  // 더미 데이터 관련 상태
  const [dummyUserCount, setDummyUserCount] = useState(100);
  const [dummyMatchCount, setDummyMatchCount] = useState(200);
  const [generatingDummy, setGeneratingDummy] = useState(false);
  const [deletingDummy, setDeletingDummy] = useState(false);
  const [dummyMessage, setDummyMessage] = useState('');

  useEffect(() => {
    // 관리자 확인
    if (!isAuthenticated || !user.isAdmin) {
      setError('관리자 권한이 필요합니다');
      setLoading(false);
      return;
    }

    // 대시보드 통계 가져오기
    const fetchDashboardStats = async () => {
      try {
        const response = await axios.get('/api/admin/dashboard');
        setStats(response.data);
        setLoading(false);
      } catch (err) {
        console.error('통계 데이터 가져오기 오류:', err);
        setError('통계 데이터를 가져오는데 실패했습니다.');
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, [isAuthenticated, user]);

  // 더미 데이터 생성
  const generateDummyData = async () => {
    try {
      setGeneratingDummy(true);
      setDummyMessage('');
      
      const response = await axios.post('/api/admin/dummy/generate', {
        userCount: dummyUserCount,
        matchCount: dummyMatchCount
      });
      
      setDummyMessage(response.data.message);
      
      // 통계 업데이트
      const statsResponse = await axios.get('/api/admin/dashboard');
      setStats(statsResponse.data);
    } catch (err) {
      console.error('더미 데이터 생성 오류:', err);
      setDummyMessage('더미 데이터 생성에 실패했습니다: ' + (err.response?.data?.message || err.message));
    } finally {
      setGeneratingDummy(false);
    }
  };

  // 더미 데이터 삭제
  const deleteDummyData = async () => {
    if (!window.confirm('모든 더미 데이터를 삭제하시겠습니까?')) {
      return;
    }
    
    try {
      setDeletingDummy(true);
      setDummyMessage('');
      
      const response = await axios.delete('/api/admin/dummy');
      setDummyMessage(response.data.message);
      
      // 통계 업데이트
      const statsResponse = await axios.get('/api/admin/dashboard');
      setStats(statsResponse.data);
    } catch (err) {
      console.error('더미 데이터 삭제 오류:', err);
      setDummyMessage('더미 데이터 삭제에 실패했습니다: ' + (err.response?.data?.message || err.message));
    } finally {
      setDeletingDummy(false);
    }
  };

  // 로딩 중 표시
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // 에러 메시지 표시
  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded mb-6">
          {error}
        </div>
        <Link to="/" className="text-indigo-400 hover:text-indigo-300">
          &larr; 홈으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fadeIn">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-indigo-400 mb-2">관리자 대시보드</h1>
          <p className="text-gray-400">HotsTinder 서비스 관리 페이지입니다.</p>
        </div>
        <Link to="/" className="text-indigo-400 hover:text-indigo-300">
          &larr; 홈으로 돌아가기
        </Link>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-indigo-900/30 p-4 rounded-lg shadow-lg">
          <h3 className="text-gray-400 mb-1">총 사용자</h3>
          <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
        </div>
        <div className="bg-indigo-900/30 p-4 rounded-lg shadow-lg">
          <h3 className="text-gray-400 mb-1">총 매치</h3>
          <p className="text-3xl font-bold text-white">{stats.totalMatches}</p>
        </div>
        <div className="bg-indigo-900/30 p-4 rounded-lg shadow-lg">
          <h3 className="text-gray-400 mb-1">활성 사용자</h3>
          <p className="text-3xl font-bold text-white">{stats.activeUsers}</p>
          <p className="text-xs text-gray-500">최근 7일 로그인</p>
        </div>
        <div className="bg-indigo-900/30 p-4 rounded-lg shadow-lg">
          <h3 className="text-gray-400 mb-1">최근 매치</h3>
          <p className="text-3xl font-bold text-white">{stats.recentMatches}</p>
          <p className="text-xs text-gray-500">최근 24시간</p>
        </div>
      </div>

      {/* 관리 메뉴 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Link to="/admin/users" className="block">
          <div className="bg-slate-800 p-6 rounded-lg shadow-lg hover:bg-slate-700 transition-colors">
            <h2 className="text-2xl font-bold text-indigo-400 mb-2">계정 관리</h2>
            <p className="text-gray-400 mb-4">
              사용자 계정 정보를 조회하고 관리합니다. 프로필 정보 편집, 계정 삭제 및 권한 관리를 수행할 수 있습니다.
            </p>
            <span className="text-indigo-300 inline-flex items-center">
              관리하기
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </span>
          </div>
        </Link>
        <Link to="/admin/matches" className="block">
          <div className="bg-slate-800 p-6 rounded-lg shadow-lg hover:bg-slate-700 transition-colors">
            <h2 className="text-2xl font-bold text-indigo-400 mb-2">매치 관리</h2>
            <p className="text-gray-400 mb-4">
              게임 매치 기록을 조회하고 관리합니다. 매치 세부 정보 확인, 결과 수정, 무효화 처리 및 MMR 조정이 가능합니다.
            </p>
            <span className="text-indigo-300 inline-flex items-center">
              관리하기
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </span>
          </div>
        </Link>
      </div>

      {/* 더미 데이터 관리 */}
      <div className="bg-slate-800 p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-2xl font-bold text-indigo-400 mb-4">테스트 데이터 관리</h2>
        <p className="text-gray-400 mb-6">
          테스트 목적의 더미 사용자와 매치 데이터를 생성하거나 삭제합니다. 생성된 더미 데이터는 'isDummy' 속성으로 구분되어 일괄 삭제가 가능합니다.
        </p>
        
        {dummyMessage && (
          <div className="bg-indigo-900/30 border border-indigo-700 text-indigo-300 px-4 py-3 rounded mb-6">
            {dummyMessage}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-white font-medium mb-3">더미 데이터 생성</h3>
            <div className="mb-4">
              <label className="block text-gray-400 mb-1" htmlFor="dummyUserCount">더미 사용자 수</label>
              <input
                type="number"
                id="dummyUserCount"
                value={dummyUserCount}
                onChange={(e) => setDummyUserCount(parseInt(e.target.value) || 0)}
                min="1"
                max="1000"
                className="w-full bg-slate-700 text-white px-4 py-2 rounded border border-slate-600 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-400 mb-1" htmlFor="dummyMatchCount">더미 매치 수</label>
              <input
                type="number"
                id="dummyMatchCount"
                value={dummyMatchCount}
                onChange={(e) => setDummyMatchCount(parseInt(e.target.value) || 0)}
                min="1"
                max="1000"
                className="w-full bg-slate-700 text-white px-4 py-2 rounded border border-slate-600 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <button
              onClick={generateDummyData}
              disabled={generatingDummy}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition flex items-center justify-center w-full"
            >
              {generatingDummy ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  생성 중...
                </>
              ) : (
                '더미 데이터 생성'
              )}
            </button>
          </div>
          <div>
            <h3 className="text-white font-medium mb-3">더미 데이터 삭제</h3>
            <p className="text-gray-400 mb-4">
              생성된 모든 더미 데이터를 데이터베이스에서 일괄 삭제합니다. 이 작업은 되돌릴 수 없으니 주의하세요.
              삭제는 'isDummy' 속성이 true로 설정된 데이터만 대상으로 합니다.
            </p>
            <button
              onClick={deleteDummyData}
              disabled={deletingDummy}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition flex items-center justify-center w-full"
            >
              {deletingDummy ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  삭제 중...
                </>
              ) : (
                '모든 더미 데이터 삭제'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 추가 관리 기능 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/admin/settings" className="bg-slate-700/50 p-4 rounded-lg flex items-center hover:bg-slate-700 transition-colors">
          <div className="bg-indigo-800/50 p-2 rounded-full mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-medium">시스템 설정</h3>
            <p className="text-gray-400 text-sm">서비스 환경 설정 관리</p>
          </div>
        </Link>
        <Link to="/admin/logs" className="bg-slate-700/50 p-4 rounded-lg flex items-center hover:bg-slate-700 transition-colors">
          <div className="bg-indigo-800/50 p-2 rounded-full mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-medium">시스템 로그</h3>
            <p className="text-gray-400 text-sm">활동 로그 및 오류 기록</p>
          </div>
        </Link>
        <Link to="/admin/stats" className="bg-slate-700/50 p-4 rounded-lg flex items-center hover:bg-slate-700 transition-colors">
          <div className="bg-indigo-800/50 p-2 rounded-full mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-medium">통계 분석</h3>
            <p className="text-gray-400 text-sm">서비스 사용 현황 및 통계</p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default AdminPage; 