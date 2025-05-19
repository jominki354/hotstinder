import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import axios from 'axios';

const AdminUserEditPage = () => {
  const { isAuthenticated, user } = useAuthStore();
  const { userId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    battletag: '',
    nickname: '',
    email: '',
    mmr: 1500,
    wins: 0,
    losses: 0,
    preferredRoles: [],
    mainRole: '',
    favoriteHeroes: [],
    isAdmin: false
  });
  const [isEdited, setIsEdited] = useState(false);
  const [matchHistory, setMatchHistory] = useState([]);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // 역할 목록
  const roles = ['탱커', '투사', '힐러', '원거리 암살자', '근접 암살자', '전문가'];

  // 관리자 확인
  useEffect(() => {
    if (!isAuthenticated || !user.isAdmin) {
      setError('관리자 권한이 필요합니다');
      setLoading(false);
      return;
    }
    
    if (userId === 'new') {
      // 새 사용자 추가 모드
      setLoading(false);
    } else {
      // 기존 사용자 수정 모드
      fetchUserData();
    }
  }, [isAuthenticated, user, userId]);

  // 사용자 데이터 가져오기
  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/admin/users/${userId}`);
      setUserData(response.data);
      
      // 폼 데이터 초기화
      setFormData({
        battletag: response.data.battletag || '',
        nickname: response.data.nickname || '',
        email: response.data.email || '',
        mmr: response.data.mmr || 1500,
        wins: response.data.wins || 0,
        losses: response.data.losses || 0,
        preferredRoles: response.data.preferredRoles || [],
        mainRole: response.data.mainRole || '',
        favoriteHeroes: response.data.favoriteHeroes || [],
        isAdmin: response.data.isAdmin || false
      });
      
      // 매치 히스토리 가져오기
      const matchesResponse = await axios.get(`/api/admin/users/${userId}/matches`);
      setMatchHistory(matchesResponse.data);
      
      setLoading(false);
    } catch (err) {
      console.error('사용자 데이터 가져오기 오류:', err);
      setError('사용자 데이터를 가져오는데 실패했습니다.');
      setLoading(false);
    }
  };

  // 입력 필드 변경 처리
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // 체크박스인 경우 checked 값 사용
    const inputValue = type === 'checkbox' ? checked : value;
    
    // 숫자 필드인 경우 숫자로 변환
    const parsedValue = ['mmr', 'wins', 'losses'].includes(name)
      ? parseInt(inputValue, 10) || 0
      : inputValue;
    
    setFormData({
      ...formData,
      [name]: parsedValue
    });
    
    setIsEdited(true);
  };

  // 선호 역할 토글
  const togglePreferredRole = (role) => {
    const updatedRoles = formData.preferredRoles.includes(role)
      ? formData.preferredRoles.filter(r => r !== role)
      : [...formData.preferredRoles, role];
    
    setFormData({
      ...formData,
      preferredRoles: updatedRoles
    });
    
    setIsEdited(true);
  };

  // 폼 제출 처리
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (userId === 'new') {
        // 새 사용자 생성
        await axios.post('/api/admin/users', formData);
        alert('새 사용자가 성공적으로 생성되었습니다.');
        navigate('/admin/users');
      } else {
        // 기존 사용자 업데이트
        await axios.put(`/api/admin/users/${userId}`, formData);
        alert('사용자 정보가 성공적으로 업데이트되었습니다.');
        setIsEdited(false);
        fetchUserData(); // 최신 데이터로 새로고침
      }
    } catch (err) {
      console.error('사용자 저장 오류:', err);
      alert(`사용자 저장에 실패했습니다: ${err.response?.data?.message || err.message}`);
    }
  };

  // MMR 리셋 확인
  const confirmResetMMR = () => {
    setShowResetConfirm(true);
  };

  // MMR 리셋 실행
  const resetMMR = async () => {
    try {
      await axios.post(`/api/admin/users/${userId}/reset-mmr`);
      alert('사용자의 MMR이 성공적으로 리셋되었습니다.');
      fetchUserData(); // 최신 데이터로 새로고침
    } catch (err) {
      console.error('MMR 리셋 오류:', err);
      alert('MMR 리셋에 실패했습니다.');
    } finally {
      setShowResetConfirm(false);
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
        <Link to="/admin/users" className="text-indigo-400 hover:text-indigo-300">
          &larr; 사용자 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fadeIn">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-indigo-400">
          {userId === 'new' ? '새 사용자 추가' : '사용자 편집'}
        </h1>
        <Link to="/admin/users" className="text-indigo-400 hover:text-indigo-300">
          &larr; 사용자 목록으로 돌아가기
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 사용자 정보 편집 폼 */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-slate-800 rounded-lg p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-white mb-4">사용자 정보</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-gray-400 mb-1" htmlFor="battletag">배틀태그</label>
                <input
                  type="text"
                  id="battletag"
                  name="battletag"
                  value={formData.battletag}
                  onChange={handleInputChange}
                  className="w-full bg-slate-700 text-white px-4 py-2 rounded border border-slate-600 focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1" htmlFor="nickname">닉네임</label>
                <input
                  type="text"
                  id="nickname"
                  name="nickname"
                  value={formData.nickname}
                  onChange={handleInputChange}
                  className="w-full bg-slate-700 text-white px-4 py-2 rounded border border-slate-600 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-400 mb-1" htmlFor="email">이메일</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full bg-slate-700 text-white px-4 py-2 rounded border border-slate-600 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-gray-400 mb-1" htmlFor="mmr">MMR</label>
                <input
                  type="number"
                  id="mmr"
                  name="mmr"
                  value={formData.mmr}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full bg-slate-700 text-white px-4 py-2 rounded border border-slate-600 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1" htmlFor="wins">승리</label>
                <input
                  type="number"
                  id="wins"
                  name="wins"
                  value={formData.wins}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full bg-slate-700 text-white px-4 py-2 rounded border border-slate-600 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1" htmlFor="losses">패배</label>
                <input
                  type="number"
                  id="losses"
                  name="losses"
                  value={formData.losses}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full bg-slate-700 text-white px-4 py-2 rounded border border-slate-600 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-400 mb-1" htmlFor="mainRole">주 역할</label>
              <select
                id="mainRole"
                name="mainRole"
                value={formData.mainRole}
                onChange={handleInputChange}
                className="w-full bg-slate-700 text-white px-4 py-2 rounded border border-slate-600 focus:border-indigo-500 focus:outline-none"
              >
                <option value="">선택 안함</option>
                {roles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-400 mb-2">선호 역할</label>
              <div className="flex flex-wrap gap-2">
                {roles.map(role => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => togglePreferredRole(role)}
                    className={`px-3 py-1 rounded text-sm ${
                      formData.preferredRoles.includes(role)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isAdmin"
                  checked={formData.isAdmin}
                  onChange={handleInputChange}
                  className="rounded bg-slate-700 border-slate-600 text-indigo-500 focus:ring-indigo-500 mr-2"
                />
                <span className="text-white">관리자 권한 부여</span>
              </label>
            </div>
            
            <div className="flex justify-end space-x-3">
              {userId !== 'new' && (
                <button
                  type="button"
                  onClick={confirmResetMMR}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded transition"
                >
                  MMR 리셋
                </button>
              )}
              <Link
                to="/admin/users"
                className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded transition"
              >
                취소
              </Link>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded transition"
                disabled={!isEdited && userId !== 'new'}
              >
                {userId === 'new' ? '사용자 생성' : '변경사항 저장'}
              </button>
            </div>
          </form>
        </div>

        {/* 사용자 통계 및 정보 */}
        <div className="lg:col-span-1">
          {userId !== 'new' && (
            <>
              <div className="bg-slate-800 rounded-lg p-6 shadow-xl mb-6">
                <h2 className="text-xl font-semibold text-white mb-4">사용자 통계</h2>
                
                <div className="mb-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-400">승률</span>
                    <span className="text-white font-medium">
                      {formData.wins + formData.losses > 0
                        ? `${Math.round((formData.wins / (formData.wins + formData.losses)) * 100)}%`
                        : '-'}
                    </span>
                  </div>
                  {formData.wins + formData.losses > 0 && (
                    <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-green-500 h-full"
                        style={{
                          width: `${Math.round(
                            (formData.wins / (formData.wins + formData.losses)) * 100
                          )}%`
                        }}
                      ></div>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-700/50 p-3 rounded">
                    <div className="text-gray-400 text-sm mb-1">총 게임</div>
                    <div className="text-white text-lg font-semibold">
                      {formData.wins + formData.losses}
                    </div>
                  </div>
                  <div className="bg-slate-700/50 p-3 rounded">
                    <div className="text-gray-400 text-sm mb-1">MMR</div>
                    <div className="text-white text-lg font-semibold">
                      {formData.mmr}
                    </div>
                  </div>
                  <div className="bg-green-900/30 p-3 rounded">
                    <div className="text-green-400 text-sm mb-1">승리</div>
                    <div className="text-white text-lg font-semibold">
                      {formData.wins}
                    </div>
                  </div>
                  <div className="bg-red-900/30 p-3 rounded">
                    <div className="text-red-400 text-sm mb-1">패배</div>
                    <div className="text-white text-lg font-semibold">
                      {formData.losses}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-800 rounded-lg p-6 shadow-xl">
                <h2 className="text-xl font-semibold text-white mb-4">최근 매치</h2>
                
                {matchHistory.length > 0 ? (
                  <ul className="space-y-3">
                    {matchHistory.slice(0, 5).map(match => (
                      <li key={match._id} className="border-l-4 border-indigo-500 pl-3 py-1">
                        <Link
                          to={`/admin/matches/${match._id}`}
                          className="text-white hover:text-indigo-300 transition"
                        >
                          <div className="font-medium">{match.map}</div>
                          <div className="flex justify-between text-sm">
                            <span className={match.playerTeam === match.winner ? 'text-green-400' : 'text-red-400'}>
                              {match.playerTeam === match.winner ? '승리' : '패배'}
                            </span>
                            <span className="text-gray-400">
                              {new Date(match.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400">매치 기록이 없습니다.</p>
                )}
                
                {matchHistory.length > 5 && (
                  <div className="mt-4 text-center">
                    <Link
                      to={`/admin/matches?user=${userId}`}
                      className="text-indigo-400 hover:text-indigo-300"
                    >
                      모든 매치 보기 &rarr;
                    </Link>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* MMR 리셋 확인 모달 */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">MMR 리셋 확인</h3>
            <p className="text-gray-300 mb-6">
              이 사용자의 MMR을 기본값(1500)으로 리셋하시겠습니까?
              <br />이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded transition"
              >
                취소
              </button>
              <button
                onClick={resetMMR}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded transition"
              >
                리셋
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserEditPage; 