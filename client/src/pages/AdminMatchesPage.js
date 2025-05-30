import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import axios from 'axios';
import { toast } from 'react-toastify';
import { translateMap, translateTeam, translateStatus, translateHero, mapTranslations } from '../utils/hotsTranslations';

// Axios 기본 설정
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const AdminMatchesPage = () => {
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedMatches, setSelectedMatches] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // 필터 상태
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    map: '',
    status: '',
    userId: queryParams.get('user') || ''
  });

  // 정렬 상태
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');

  const itemsPerPage = 10;

  // 전장 목록 - 히오스 공식 한국어명 사용
  const maps = [
    'Cursed Hollow', 'Dragon Shire', 'Blackheart\'s Bay', 'Garden of Terror',
    'Sky Temple', 'Tomb of the Spider Queen', 'Battlefield of Eternity',
    'Infernal Shrines', 'Towers of Doom', 'Braxis Holdout', 'Warhead Junction',
    'Hanamura Temple', 'Volskaya Foundry', 'Alterac Pass'
  ];

  // 매치 상태 목록
  const statuses = ['in_progress', 'completed', 'cancelled', 'invalid'];

  // 관리자 확인
  useEffect(() => {
    if (!isAuthenticated || !user.isAdmin) {
      setError('관리자 권한이 필요합니다');
      setLoading(false);
      return;
    }

    fetchMatches();
  }, [isAuthenticated, user, page, sortBy, sortDirection]);

  // 매치 데이터 가져오기
  const fetchMatches = async () => {
    try {
      setLoading(true);

      // 필터 파라미터 구성
      const params = {
        page,
        limit: itemsPerPage,
        sortBy,
        sortDirection,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        )
      };

      const response = await axios.get('/api/admin/matches', {
        params,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      // 안전한 데이터 설정
      setMatches(response.data.matches || []);
      setTotalPages(Math.max(1, response.data.pagination?.totalPages || 1));
      setLoading(false);
    } catch (err) {
      console.error('매치 데이터 가져오기 오류:', err);
      setError('매치 데이터를 가져오는데 실패했습니다.');
      setMatches([]);
      setTotalPages(1);
      setLoading(false);
    }
  };

  // 모든 매치 삭제 함수
  const deleteAllMatches = async () => {
    if (processing) return;

    if (!window.confirm('정말로 모든 매치 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    try {
      setProcessing(true);
      const response = await axios.delete('/api/admin/delete-all-matches', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      toast.success(response.data.message);

      // 목록 새로고침
      fetchMatches();
      setSelectedMatches([]);
    } catch (err) {
      console.error('매치 데이터 삭제 오류:', err);
      toast.error(err.response?.data?.message || '매치 데이터 삭제 중 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  // 필터 적용
  const applyFilters = (e) => {
    e.preventDefault();
    setPage(1); // 필터 변경 시 첫 페이지로 이동
    fetchMatches();
  };

  // 필터 초기화
  const resetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      map: '',
      status: '',
      userId: ''
    });
    setPage(1);
    fetchMatches();
  };

  // 정렬 변경
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  // 매치 선택 토글
  const toggleMatchSelection = (matchId) => {
    if (selectedMatches.includes(matchId)) {
      setSelectedMatches(selectedMatches.filter(id => id !== matchId));
    } else {
      setSelectedMatches([...selectedMatches, matchId]);
    }
  };

  // 모든 매치 선택 토글
  const toggleAllMatches = () => {
    if (selectedMatches.length === matches.length) {
      setSelectedMatches([]);
    } else {
      setSelectedMatches(matches.map(match => match._id));
    }
  };

  // 매치 편집 페이지로 이동
  const editMatch = (matchId) => {
    navigate(`/admin/matches/${matchId}`);
  };

  // 매치 상세 보기
  const viewMatchDetails = async (matchId) => {
    try {
      const response = await axios.get(`/api/admin/matches/${matchId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setSelectedMatch(response.data);
      setShowDetails(true);
    } catch (err) {
      console.error('매치 상세 조회 오류:', err);
      toast.error('매치 상세 정보를 가져오는데 실패했습니다.');
    }
  };

  // 매치 상세 모달 닫기
  const closeDetails = () => {
    setShowDetails(false);
    setSelectedMatch(null);
  };

  // 매치 무효화
  const invalidateMatch = async (matchId) => {
    try {
      const response = await axios.post(`/api/admin/matches/${matchId}/invalidate`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      // 목록 새로고침
      fetchMatches();
      toast.success(response.data.message || '매치가 성공적으로 무효화되었습니다.');
    } catch (err) {
      console.error('매치 무효화 오류:', err);
      const errorMessage = err.response?.data?.message || '매치 무효화에 실패했습니다.';
      toast.error(errorMessage);
    }
  };

  // 다중 매치 무효화
  const invalidateSelectedMatches = async () => {
    if (selectedMatches.length === 0) {
      toast.warning('무효화할 매치를 선택해주세요.');
      return;
    }

    try {
      const response = await axios.post('/api/admin/matches/invalidate',
        { matchIds: selectedMatches },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      // 목록 새로고침
      fetchMatches();
      setSelectedMatches([]);
      toast.success(response.data.message || `${selectedMatches.length}개의 매치가 성공적으로 무효화되었습니다.`);
    } catch (err) {
      console.error('다중 매치 무효화 오류:', err);
      const errorMessage = err.response?.data?.message || '매치 무효화에 실패했습니다.';
      toast.error(errorMessage);
    }
  };

  // 매치 삭제
  const deleteMatch = async (matchId) => {
    if (!window.confirm('정말로 이 매치를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    try {
      const response = await axios.delete(`/api/admin/matches/${matchId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      // 목록에서 삭제된 매치 제거
      setMatches(matches.filter(match => match._id !== matchId));
      setSelectedMatches(selectedMatches.filter(id => id !== matchId));
      toast.success(response.data.message || '매치가 성공적으로 삭제되었습니다.');
    } catch (err) {
      console.error('매치 삭제 오류:', err);
      const errorMessage = err.response?.data?.message || '매치 삭제에 실패했습니다.';
      toast.error(errorMessage);
    }
  };

  // 다중 매치 삭제
  const deleteSelectedMatches = async () => {
    if (selectedMatches.length === 0) {
      toast.warning('삭제할 매치를 선택해주세요.');
      return;
    }

    if (!window.confirm(`정말로 선택된 ${selectedMatches.length}개의 매치를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    try {
      const response = await axios.post('/api/admin/matches/delete',
        { matchIds: selectedMatches },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      // 목록에서 삭제된 매치들 제거
      setMatches(matches.filter(match => !selectedMatches.includes(match._id)));
      setSelectedMatches([]);
      toast.success(response.data.message || `${selectedMatches.length}개의 매치가 성공적으로 삭제되었습니다.`);
    } catch (err) {
      console.error('다중 매치 삭제 오류:', err);
      const errorMessage = err.response?.data?.message || '매치 삭제에 실패했습니다.';
      toast.error(errorMessage);
    }
  };

  // 로딩 중 표시
  if (loading && matches.length === 0) {
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
        <Link to="/admin" className="text-indigo-400 hover:text-indigo-300">
          &larr; 관리자 대시보드로 돌아가기
        </Link>
      </div>
    );
  }

  // 매치 상태에 따른 스타일
  const getStatusStyle = (status) => {
    switch (status) {
      case '완료':
        return 'bg-green-900/50 text-green-400';
      case '진행 중':
        return 'bg-blue-900/50 text-blue-400';
      case '취소됨':
        return 'bg-red-900/50 text-red-400';
      case '무효':
        return 'bg-yellow-900/50 text-yellow-400';
      default:
        return 'bg-gray-900/50 text-gray-400';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fadeIn">
      <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center">
        <div className="mb-4 md:mb-0">
          <h1 className="text-3xl font-bold text-indigo-400 mb-2">매치 관리</h1>
          <p className="text-gray-400">총 {matches.length} 개의 매치 (페이지 {page}/{totalPages})</p>
        </div>
        <div className="flex space-x-2">
          <Link to="/admin" className="btn btn-secondary">
            대시보드로 돌아가기
          </Link>
          <button
            onClick={() => deleteAllMatches()}
            disabled={processing}
            className="bg-red-800 hover:bg-red-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 transition-colors"
          >
            {processing ? '처리 중...' : '모든 매치 삭제'}
          </button>
        </div>
      </div>

      {/* 필터 및 검색 */}
      <div className="bg-slate-800 p-4 rounded-lg mb-6">
        <form onSubmit={applyFilters} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-gray-400 mb-1 text-sm">시작일</label>
            <input
              type="date"
              className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:border-indigo-500 focus:outline-none"
              value={filters.startDate}
              onChange={(e) => setFilters({...filters, startDate: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-gray-400 mb-1 text-sm">종료일</label>
            <input
              type="date"
              className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:border-indigo-500 focus:outline-none"
              value={filters.endDate}
              onChange={(e) => setFilters({...filters, endDate: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-gray-400 mb-1 text-sm">전장</label>
            <select
              className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:border-indigo-500 focus:outline-none"
              value={filters.map}
              onChange={(e) => setFilters({...filters, map: e.target.value})}
            >
              <option value="">모든 전장</option>
              {maps.map(map => (
                <option key={map} value={map}>{translateMap(map)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-400 mb-1 text-sm">상태</label>
            <select
              className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:border-indigo-500 focus:outline-none"
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
            >
              <option value="">모든 상태</option>
              {statuses.map(status => (
                <option key={status} value={status}>{translateStatus(status)}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end space-x-2">
            <button type="submit" className="btn btn-primary">필터 적용</button>
            <button type="button" onClick={resetFilters} className="btn btn-secondary">초기화</button>
          </div>
        </form>
      </div>

      {/* 선택된 매치 액션 */}
      {selectedMatches.length > 0 && (
        <div className="bg-indigo-900/30 p-4 rounded-lg mb-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-white mb-3 md:mb-0">
            {selectedMatches.length}개의 매치가 선택됨
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() => invalidateSelectedMatches()}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm transition"
            >
              선택 무효화
            </button>
            <button
              onClick={() => deleteSelectedMatches()}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition"
            >
              선택 삭제
            </button>
            <button
              onClick={() => setSelectedMatches([])}
              className="bg-slate-600 hover:bg-slate-700 text-white px-3 py-1 rounded text-sm transition"
            >
              선택 취소
            </button>
          </div>
        </div>
      )}

      {/* 매치 목록 테이블 */}
      <div className="bg-slate-800 rounded-lg overflow-hidden shadow-xl mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-700">
                <th className="px-4 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={selectedMatches.length === matches.length && matches.length > 0}
                    onChange={toggleAllMatches}
                    className="rounded bg-slate-600 border-slate-500 text-indigo-500 focus:ring-indigo-500"
                  />
                </th>
                <th
                  className="px-4 py-3 cursor-pointer"
                  onClick={() => handleSort('matchId')}
                >
                  <div className="flex items-center">
                    매치 ID
                    {sortBy === 'matchId' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3 cursor-pointer"
                  onClick={() => handleSort('map')}
                >
                  <div className="flex items-center">
                    전장
                    {sortBy === 'map' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-4 py-3">승자</th>
                <th
                  className="px-4 py-3 cursor-pointer"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">
                    상태
                    {sortBy === 'status' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3 cursor-pointer"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center">
                    날짜
                    {sortBy === 'createdAt' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-right">작업</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((match) => (
                <tr key={match._id} className="border-t border-slate-700 hover:bg-slate-700/50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedMatches.includes(match._id)}
                      onChange={() => toggleMatchSelection(match._id)}
                      className="rounded bg-slate-600 border-slate-500 text-indigo-500 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-mono text-white">{match.matchId}</div>
                  </td>
                  <td className="px-4 py-3 text-white">{translateMap(match.map)}</td>
                  <td className="px-4 py-3">
                    {match.winner || match.result?.winner ? (
                      <span className={(match.winner || match.result?.winner) === 'blue' ? 'text-blue-400' : 'text-red-400'}>
                        {translateTeam(match.winner || match.result?.winner)}
                      </span>
                    ) : (
                      <span className="text-gray-500">미정</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusStyle(match.status)}`}>
                      {translateStatus(match.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {new Date(match.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right space-x-1">
                    <button
                      onClick={() => viewMatchDetails(match._id)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded text-xs transition"
                    >
                      상세
                    </button>
                    {match.status !== '무효' && (
                      <button
                        onClick={() => invalidateMatch(match._id)}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded text-xs transition"
                      >
                        무효화
                      </button>
                    )}
                    <button
                      onClick={() => deleteMatch(match._id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs transition"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
              {matches.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-4 py-6 text-center text-gray-400">
                    매치가 없거나 검색 결과가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 페이지네이션 */}
      <div className="flex justify-center">
        <div className="flex space-x-1">
          <button
            onClick={() => setPage(1)}
            disabled={page === 1}
            className={`px-3 py-1 rounded ${
              page === 1
                ? 'bg-slate-700 text-gray-500 cursor-not-allowed'
                : 'bg-slate-700 text-white hover:bg-slate-600'
            }`}
          >
            &laquo;
          </button>
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className={`px-3 py-1 rounded ${
              page === 1
                ? 'bg-slate-700 text-gray-500 cursor-not-allowed'
                : 'bg-slate-700 text-white hover:bg-slate-600'
            }`}
          >
            &lt;
          </button>

          {[...Array(Math.min(5, Math.max(1, totalPages)))].map((_, i) => {
            // 페이지 번호 계산 로직
            let pageNum;
            const safeTotalPages = Math.max(1, totalPages);
            if (safeTotalPages <= 5) {
              pageNum = i + 1;
            } else if (page <= 3) {
              pageNum = i + 1;
            } else if (page >= safeTotalPages - 2) {
              pageNum = safeTotalPages - 4 + i;
            } else {
              pageNum = page - 2 + i;
            }

            return (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`px-3 py-1 rounded ${
                  page === pageNum
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-700 text-white hover:bg-slate-600'
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
            className={`px-3 py-1 rounded ${
              page === totalPages
                ? 'bg-slate-700 text-gray-500 cursor-not-allowed'
                : 'bg-slate-700 text-white hover:bg-slate-600'
            }`}
          >
            &gt;
          </button>
          <button
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages}
            className={`px-3 py-1 rounded ${
              page === totalPages
                ? 'bg-slate-700 text-gray-500 cursor-not-allowed'
                : 'bg-slate-700 text-white hover:bg-slate-600'
            }`}
          >
            &raquo;
          </button>
        </div>
      </div>

      {/* 매치 상세 모달 */}
      {showDetails && selectedMatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">매치 상세 정보</h2>
                <button
                  onClick={closeDetails}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              {/* 매치 기본 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-700 p-4 rounded-lg">
                  <h3 className="text-gray-400 text-sm">매치 ID</h3>
                  <p className="text-white font-mono">{selectedMatch.matchId}</p>
                </div>
                <div className="bg-slate-700 p-4 rounded-lg">
                  <h3 className="text-gray-400 text-sm">맵</h3>
                  <p className="text-white">{translateMap(selectedMatch.map)}</p>
                </div>
                <div className="bg-slate-700 p-4 rounded-lg">
                  <h3 className="text-gray-400 text-sm">승리 팀</h3>
                  <p className={selectedMatch.winner === 'blue' ? 'text-blue-400' : 'text-red-400'}>
                    {translateTeam(selectedMatch.winner) || '미정'}
                  </p>
                </div>
                <div className="bg-slate-700 p-4 rounded-lg">
                  <h3 className="text-gray-400 text-sm">게임 시간</h3>
                  <p className="text-white">
                    {selectedMatch.gameDuration ? `${Math.floor(selectedMatch.gameDuration / 60)}분 ${selectedMatch.gameDuration % 60}초` : '미정'}
                  </p>
                </div>
              </div>

              {/* 플레이어 통계 */}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-4">플레이어 통계</h3>

                {selectedMatch.players && selectedMatch.players.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-700">
                        <tr>
                          <th className="px-3 py-2 text-left text-gray-300">플레이어</th>
                          <th className="px-3 py-2 text-left text-gray-300">팀</th>
                          <th className="px-3 py-2 text-left text-gray-300">영웅</th>
                          <th className="px-3 py-2 text-center text-gray-300">킬</th>
                          <th className="px-3 py-2 text-center text-gray-300">데스</th>
                          <th className="px-3 py-2 text-center text-gray-300">어시스트</th>
                          <th className="px-3 py-2 text-center text-gray-300">영웅 피해</th>
                          <th className="px-3 py-2 text-center text-gray-300">공성 피해</th>
                          <th className="px-3 py-2 text-center text-gray-300">힐량</th>
                          <th className="px-3 py-2 text-center text-gray-300">경험치</th>
                          <th className="px-3 py-2 text-center text-gray-300">MMR 변화</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-600">
                        {selectedMatch.players.map((player, index) => (
                          <tr key={index} className="hover:bg-slate-700">
                            <td className="px-3 py-2 text-white">
                              {player.user?.battleTag || player.user?.nickname || 'Unknown'}
                            </td>
                            <td className="px-3 py-2">
                              <span className={`px-2 py-1 rounded text-xs ${
                                player.team === 0 ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'
                              }`}>
                                {translateTeam(player.team === 0 ? 'blue' : 'red')}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-white">{translateHero(player.hero) || '알 수 없음'}</td>
                            <td className="px-3 py-2 text-center text-green-400">{player.kills || 0}</td>
                            <td className="px-3 py-2 text-center text-red-400">{player.deaths || 0}</td>
                            <td className="px-3 py-2 text-center text-yellow-400">{player.assists || 0}</td>
                            <td className="px-3 py-2 text-center text-white">
                              {player.heroDamage ? player.heroDamage.toLocaleString() : '0'}
                            </td>
                            <td className="px-3 py-2 text-center text-white">
                              {player.siegeDamage ? player.siegeDamage.toLocaleString() : '0'}
                            </td>
                            <td className="px-3 py-2 text-center text-white">
                              {player.healing ? player.healing.toLocaleString() : '0'}
                            </td>
                            <td className="px-3 py-2 text-center text-white">
                              {player.experience ? player.experience.toLocaleString() : '0'}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <span className={`${
                                (player.mmrChange || 0) > 0 ? 'text-green-400' :
                                (player.mmrChange || 0) < 0 ? 'text-red-400' : 'text-gray-400'
                              }`}>
                                {player.mmrChange > 0 ? '+' : ''}{player.mmrChange || 0}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    플레이어 통계 데이터가 없습니다.
                  </div>
                )}
              </div>

              {/* 닫기 버튼 */}
              <div className="flex justify-end">
                <button
                  onClick={closeDetails}
                  className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded transition"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMatchesPage;
