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
    previousTier: 'placement',
    favoriteHeroes: [],
    isAdmin: false
  });
  const [isEdited, setIsEdited] = useState(false);
  const [matchHistory, setMatchHistory] = useState([]);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [userLogs, setUserLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // 티어 목록
  const tiers = [
    { id: 'placement', name: '배치' },
    { id: 'bronze', name: '브론즈' },
    { id: 'silver', name: '실버' },
    { id: 'gold', name: '골드' },
    { id: 'platinum', name: '플래티넘' },
    { id: 'diamond', name: '다이아몬드' },
    { id: 'master', name: '마스터' },
    { id: 'grandmaster', name: '그랜드마스터' }
  ];

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
      fetchUserLogs();
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
        previousTier: response.data.previousTier || 'placement',
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

  // 사용자 로그 가져오기
  const fetchUserLogs = async () => {
    try {
      setLogsLoading(true);
      const response = await axios.get(`/api/admin/users/${userId}/logs`);
      setUserLogs(response.data);
      setLogsLoading(false);
    } catch (err) {
      console.error('사용자 로그 가져오기 오류:', err);
      setLogsLoading(false);
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

  // 폼 제출 처리
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      console.log('폼 제출:', formData);
      console.log('관리자 권한 설정 상태:', formData.isAdmin);

      if (userId === 'new') {
        // 새 사용자 생성
        const response = await axios.post('/api/admin/users', formData);
        console.log('새 사용자 생성 결과:', response.data);
        alert('새 사용자가 성공적으로 생성되었습니다.');
        navigate('/admin/users');
      } else {
        // 기존 사용자 업데이트
        // 변경 전 isAdmin 값 저장
        const prevIsAdmin = userData.isAdmin;

        // 사용자 업데이트 요청
        const response = await axios.put(`/api/admin/users/${userId}`, formData);
        console.log('사용자 업데이트 결과:', response.data);

        // 관리자 권한 변경 확인
        if (prevIsAdmin !== formData.isAdmin) {
          console.log(`관리자 권한 변경: ${prevIsAdmin} -> ${formData.isAdmin}`);
          console.log(`서버 응답의 isAdmin: ${response.data.isAdmin}`);

          if (response.data.isAdmin !== formData.isAdmin) {
            console.warn('서버에서 관리자 권한이 예상대로 업데이트되지 않았습니다!');
            alert('관리자 권한 변경이 제대로 적용되지 않았을 수 있습니다. 페이지를 새로고침하여 확인해주세요.');
          } else {
            alert('사용자 정보가 성공적으로 업데이트되었습니다.');
          }
        } else {
          alert('사용자 정보가 성공적으로 업데이트되었습니다.');
        }

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
              <label className="block text-gray-400 mb-1" htmlFor="previousTier">이전 시즌 티어</label>
              <select
                id="previousTier"
                name="previousTier"
                value={formData.previousTier}
                onChange={handleInputChange}
                className="w-full bg-slate-700 text-white px-4 py-2 rounded border border-slate-600 focus:border-indigo-500 focus:outline-none"
              >
                {tiers.map(tier => (
                  <option key={tier.id} value={tier.id}>{tier.name}</option>
                ))}
              </select>
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

              {/* 사용자 로그 */}
              <div className="bg-slate-800 rounded-lg p-6 shadow-xl mb-6">
                <h2 className="text-xl font-semibold text-white mb-4">접속 로그</h2>

                {logsLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                  </div>
                ) : userLogs.length > 0 ? (
                  <div className="overflow-auto max-h-[400px]">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-slate-800 z-10">
                        <tr className="text-gray-400 border-b border-slate-700">
                          <th className="text-left pb-2 pt-2">시간</th>
                          <th className="text-left pb-2 pt-2">액션</th>
                          <th className="text-left pb-2 pt-2">IP</th>
                          <th className="text-left pb-2 pt-2">브라우저</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userLogs.map(log => {
                          // 브라우저 정보 파싱
                          let browserInfo = '알 수 없음';
                          if (log.userAgent) {
                            if (log.userAgent.includes('Chrome')) {
                              browserInfo = 'Chrome';
                            } else if (log.userAgent.includes('Firefox')) {
                              browserInfo = 'Firefox';
                            } else if (log.userAgent.includes('Safari')) {
                              browserInfo = 'Safari';
                            } else if (log.userAgent.includes('Edge')) {
                              browserInfo = 'Edge';
                            } else if (log.userAgent.includes('MSIE') || log.userAgent.includes('Trident')) {
                              browserInfo = 'IE';
                            }
                          }

                          return (
                            <tr key={log._id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                              <td className="py-2">
                                {new Date(log.timestamp).toLocaleString()}
                              </td>
                              <td className="py-2">
                                {log.action === 'login' ? '로그인' :
                                  log.action === 'admin_login' ? '관리자 로그인' :
                                    log.action === 'logout' ? '로그아웃' :
                                      log.action === 'profile_update' ? '프로필 수정' : '기타'}
                              </td>
                              <td className="py-2 text-xs font-mono">
                                <span title={log.ipAddress}>
                                  {log.ipAddress}
                                </span>
                              </td>
                              <td className="py-2">
                                <span title={log.userAgent || '정보 없음'}>
                                  {browserInfo}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-400">로그 기록이 없습니다.</p>
                )}
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