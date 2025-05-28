import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import axios from 'axios';
import { toast } from 'react-toastify';

const AdminUsersPage = () => {
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('lastLoginAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [confirmAction, setConfirmAction] = useState(null);
  const [processing, setProcessing] = useState(false);

  const itemsPerPage = 10;

  // 관리자 확인
  useEffect(() => {
    if (!isAuthenticated || !user.isAdmin) {
      setError('관리자 권한이 필요합니다');
      setLoading(false);
      return;
    }

    fetchUsers();
  }, [isAuthenticated, user, page, sortBy, sortDirection]);

  // 사용자 데이터 가져오기
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/users', {
        params: {
          page,
          limit: itemsPerPage,
          sortBy,
          sortDirection,
          search: searchTerm
        }
      });

      setUsers(response.data.users);
      setTotalPages(response.data.totalPages);
      setLoading(false);
    } catch (err) {
      console.error('사용자 데이터 가져오기 오류:', err);
      setError('사용자 데이터를 가져오는데 실패했습니다.');
      setLoading(false);
    }
  };

  // 관리자를 제외한 모든 사용자 삭제 함수
  const deleteAllUsers = async () => {
    if (processing) return;

    if (!window.confirm('정말로 모든 사용자 데이터를 삭제하시겠습니까? 관리자 계정은 제외되며, 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    try {
      setProcessing(true);
      const response = await axios.delete('/api/admin/delete-all-users');
      toast.success(response.data.message);

      // 목록 새로고침
      fetchUsers();
      setSelectedUsers([]);
    } catch (err) {
      console.error('사용자 데이터 삭제 오류:', err);
      toast.error(err.response?.data?.message || '사용자 데이터 삭제 중 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  // 검색 실행
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1); // 검색 시 첫 페이지로 이동
    fetchUsers();
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

  // 사용자 선택 토글
  const toggleUserSelection = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  // 모든 사용자 선택 토글
  const toggleAllUsers = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user._id));
    }
  };

  // 사용자 편집 페이지로 이동
  const editUser = (userId) => {
    navigate(`/admin/users/${userId}`);
  };

  // 단일 사용자 삭제
  const deleteUser = async (userId) => {
    try {
      await axios.delete(`/api/admin/users/${userId}`);
      // 목록에서 삭제된 사용자 제거
      setUsers(users.filter(user => user._id !== userId));
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
      alert('사용자가 성공적으로 삭제되었습니다.');
    } catch (err) {
      console.error('사용자 삭제 오류:', err);
      alert('사용자 삭제에 실패했습니다.');
    }
  };

  // 다중 사용자 삭제
  const deleteSelectedUsers = async () => {
    try {
      await axios.post('/api/admin/users/delete', { userIds: selectedUsers });
      // 목록에서 삭제된 사용자들 제거
      setUsers(users.filter(user => !selectedUsers.includes(user._id)));
      setSelectedUsers([]);
      alert(`${selectedUsers.length}명의 사용자가 성공적으로 삭제되었습니다.`);
    } catch (err) {
      console.error('다중 사용자 삭제 오류:', err);
      alert('사용자 삭제에 실패했습니다.');
    }
  };

  // 확인 모달 표시
  const showConfirmModal = (action, userId) => {
    if (action === 'delete' && !userId && selectedUsers.length === 0) {
      alert('삭제할 사용자를 선택해주세요.');
      return;
    }

    setConfirmAction({
      type: action,
      userId: userId || null,
      isMultiple: !userId && action === 'delete'
    });
  };

  // 확인 모달 닫기
  const closeConfirmModal = () => {
    setConfirmAction(null);
  };

  // 확인 액션 실행
  const executeConfirmAction = () => {
    if (confirmAction.type === 'delete') {
      if (confirmAction.isMultiple) {
        deleteSelectedUsers();
      } else {
        deleteUser(confirmAction.userId);
      }
    }
    closeConfirmModal();
  };

  // 로딩 중 표시
  if (loading && users.length === 0) {
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fadeIn">
      <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center">
        <div className="mb-4 md:mb-0">
          <h1 className="text-3xl font-bold text-indigo-400 mb-2">계정 관리</h1>
          <p className="text-gray-400">총 {users.length} 명의 사용자 (페이지 {page}/{totalPages})</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/admin" className="btn btn-secondary">
            대시보드로 돌아가기
          </Link>
          <Link to="/admin/users/new" className="btn btn-primary">
            새 사용자 추가
          </Link>
          <button
            onClick={() => deleteAllUsers()}
            disabled={processing}
            className="bg-red-800 hover:bg-red-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 transition-colors"
          >
            {processing ? '처리 중...' : '모든 사용자 삭제 (관리자 제외)'}
          </button>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-slate-800 p-4 rounded-lg mb-6">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="배틀태그, 닉네임 또는 이메일로 검색"
              className="w-full bg-slate-700 text-white px-4 py-2 rounded border border-slate-600 focus:border-indigo-500 focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary md:w-auto">
            검색
          </button>
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setPage(1);
                fetchUsers();
              }}
              className="btn btn-secondary md:w-auto"
            >
              초기화
            </button>
          )}
        </form>
      </div>

      {/* 선택된 사용자 액션 */}
      {selectedUsers.length > 0 && (
        <div className="bg-indigo-900/30 p-4 rounded-lg mb-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-white mb-3 md:mb-0">
            {selectedUsers.length}명의 사용자가 선택됨
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() => showConfirmModal('delete')}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition"
            >
              선택 삭제
            </button>
            <button
              onClick={() => setSelectedUsers([])}
              className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded transition"
            >
              선택 취소
            </button>
          </div>
        </div>
      )}

      {/* 사용자 목록 테이블 */}
      <div className="bg-slate-800 rounded-lg overflow-hidden shadow-xl mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-700">
                <th className="px-4 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === users.length && users.length > 0}
                    onChange={toggleAllUsers}
                    className="rounded bg-slate-600 border-slate-500 text-indigo-500 focus:ring-indigo-500"
                  />
                </th>
                <th
                  className="px-4 py-3 cursor-pointer"
                  onClick={() => handleSort('battletag')}
                >
                  <div className="flex items-center">
                    배틀태그
                    {sortBy === 'battletag' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3 cursor-pointer"
                  onClick={() => handleSort('mmr')}
                >
                  <div className="flex items-center">
                    MMR
                    {sortBy === 'mmr' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3 cursor-pointer"
                  onClick={() => handleSort('wins')}
                >
                  <div className="flex items-center">
                    승패
                    {sortBy === 'wins' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3 cursor-pointer"
                  onClick={() => handleSort('lastLoginAt')}
                >
                  <div className="flex items-center">
                    마지막 로그인
                    {sortBy === 'lastLoginAt' && (
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
              {users.map((user) => (
                <tr key={user._id} className="border-t border-slate-700 hover:bg-slate-700/50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user._id)}
                      onChange={() => toggleUserSelection(user._id)}
                      className="rounded bg-slate-600 border-slate-500 text-indigo-500 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-indigo-800 rounded-full flex items-center justify-center mr-3">
                        {user.nickname?.charAt(0) || user.battletag.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-white">{user.battletag}</div>
                        <div className="text-sm text-gray-400">{user.nickname || '-'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono">{user.mmr}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-green-400">{user.wins}</span> / <span className="text-red-400">{user.losses}</span>
                    <div className="text-xs text-gray-500">
                      {user.wins + user.losses > 0
                        ? `${Math.round((user.wins / (user.wins + user.losses)) * 100)}%`
                        : '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {user.lastLoginAt
                      ? new Date(user.lastLoginAt).toLocaleDateString()
                      : '로그인 기록 없음'}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => editUser(user._id)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm transition"
                    >
                      편집
                    </button>
                    <button
                      onClick={() => showConfirmModal('delete', user._id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-4 py-6 text-center text-gray-400">
                    사용자가 없거나 검색 결과가 없습니다.
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

          {[...Array(Math.min(5, totalPages))].map((_, i) => {
            // 페이지 번호 계산 로직
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (page <= 3) {
              pageNum = i + 1;
            } else if (page >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
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

      {/* 확인 모달 */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">
              {confirmAction.type === 'delete' && '사용자 삭제 확인'}
            </h3>
            <p className="text-gray-300 mb-6">
              {confirmAction.type === 'delete' && confirmAction.isMultiple
                ? `${selectedUsers.length}명의 사용자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`
                : '이 사용자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.'}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeConfirmModal}
                className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded transition"
              >
                취소
              </button>
              <button
                onClick={executeConfirmAction}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition"
              >
                {confirmAction.type === 'delete' ? '삭제' : '확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;