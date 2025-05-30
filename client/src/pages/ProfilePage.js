import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import axios from 'axios';

// Axios 기본 설정
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ProfilePage = () => {
  const { user, refreshUser, deleteAccount } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmBattletag, setDeleteConfirmBattletag] = useState('');
  const [deleteError, setDeleteError] = useState('');

  // 기본 사용자 데이터
  const [formData, setFormData] = useState({
    favoriteHeroes: [],
    preferredRoles: []
  });

  // 페이지 로드 시 사용자 정보 새로고침
  useEffect(() => {
    const loadUserData = async () => {
      console.log('프로필 페이지 로드 - 사용자 정보 새로고침 시작');

      // 사용자 정보 강제 리프레시
      const timestamp = new Date().getTime();
      try {
        const response = await axios.get(`/api/auth/me?t=${timestamp}`, {
          withCredentials: true,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });

        console.log('직접 가져온 사용자 데이터:', response.data.user);
        console.log('선호 영웅 (직접):', response.data.user?.favoriteHeroes);
        console.log('선호 역할 (직접):', response.data.user?.preferredRoles);

        // 스토어 업데이트
        await refreshUser();
      } catch (error) {
        console.error('사용자 정보 로드 오류:', error);
      }
    };

    loadUserData();
  }, [refreshUser]);

  // 사용자 데이터가 변경되면 폼 데이터 업데이트
  useEffect(() => {
    if (user) {
      console.log('사용자 데이터 변경 감지:', user);
      setFormData({
        favoriteHeroes: user.favoriteHeroes || [],
        preferredRoles: user.preferredRoles || []
      });
    }
  }, [user]);

  const roles = [
    { id: '탱커', name: '탱커' },
    { id: '투사', name: '투사' },
    { id: '브루저', name: '브루저' },
    { id: '원거리 암살자', name: '원거리 암살자' },
    { id: '근접 암살자', name: '근접 암살자' },
    { id: '지원가', name: '지원가' },
    { id: '힐러', name: '힐러' },
    { id: '서포터', name: '서포터' },
    { id: '전체', name: '전체' }
  ];

  const handleRoleToggle = (roleId) => {
    setFormData(prev => {
      const updatedRoles = prev.preferredRoles.includes(roleId)
        ? prev.preferredRoles.filter(r => r !== roleId)
        : [...prev.preferredRoles, roleId];

      return {
        ...prev,
        preferredRoles: updatedRoles
      };
    });
  };

  const handleHeroChange = (e) => {
    // 쉼표로 구분된 문자열을 배열로 변환
    const heroesArray = e.target.value.split(',').map(hero => hero.trim()).filter(Boolean);

    setFormData(prev => ({
      ...prev,
      favoriteHeroes: heroesArray.slice(0, 5) // 최대 5개까지만 허용
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      // 데이터 유효성 검사 및 형식 변환
      const updatedFormData = {
        ...formData,
        nickname: user.battletag, // 닉네임은 항상 배틀태그로 고정
        // preferredRoles와 favoriteHeroes가 배열이 아닌 경우 빈 배열로 설정
        preferredRoles: Array.isArray(formData.preferredRoles) ? formData.preferredRoles : [],
        favoriteHeroes: Array.isArray(formData.favoriteHeroes) ? formData.favoriteHeroes : []
      };

      console.log('프로필 업데이트 시도:', updatedFormData);

      const response = await axios.post(
        '/api/auth/profile/setup',
        updatedFormData,
        {
          withCredentials: true,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        console.log('프로필 업데이트 응답:', response.data);

        // 사용자 정보 새로고침 - 캐시 방지를 위한 타임스탬프 추가
        const timestamp = new Date().getTime();
        const updatedUser = await axios.get(`/api/auth/me?t=${timestamp}`, {
          withCredentials: true,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });

        // 확실하게 업데이트하기 위해 직접 호출
        await refreshUser();

        console.log('갱신된 사용자 정보:', updatedUser.data.user);
        setSuccessMessage('프로필이 성공적으로 업데이트되었습니다.');
        setIsEditing(false);
      }
    } catch (err) {
      console.error('프로필 업데이트 오류:', err);
      setError(err.response?.data?.message || '프로필 저장 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const openDeleteModal = () => {
    setShowDeleteModal(true);
    setDeleteConfirmBattletag('');
    setDeleteError('');
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteConfirmBattletag('');
    setDeleteError('');
  };

  const handleDeleteAccount = async () => {
    // 배틀태그 확인
    if (!deleteConfirmBattletag) {
      setDeleteError('배틀태그를 입력해주세요.');
      return;
    }

    try {
      setIsLoading(true);
      setDeleteError('');

      // 탈퇴 요청
      const result = await deleteAccount(deleteConfirmBattletag);

      if (!result.success) {
        console.error('계정 탈퇴 실패:', result.error);
        setDeleteError(result.error || '계정 탈퇴 중 오류가 발생했습니다.');
        setIsLoading(false);
      }
      // 성공 시 리디렉션은 store 내에서 자동 처리됨
    } catch (err) {
      console.error('계정 탈퇴 처리 오류:', err);
      setDeleteError('계정 탈퇴 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  };

  // 배틀태그 가져오기
  const getBattleTag = () => {
    if (!user) return '';
    return user.battletag || user.battleTag || '';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 bg-slate-900 text-white min-h-screen">
      <h1 className="text-3xl font-bold text-indigo-400 mb-6">내 프로필</h1>

      <div className="bg-slate-800 shadow-md rounded-lg p-6 mb-8 border border-indigo-900/50">
        <div className="flex flex-col md:flex-row items-start md:items-center mb-6">
          <div className="w-24 h-24 bg-indigo-900/30 rounded-full mr-6 flex items-center justify-center mb-4 md:mb-0">
            <span className="text-indigo-400 font-bold text-3xl">
              {user?.battletag?.charAt(0) || '?'}
            </span>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white">{user?.battletag || '배틀태그 없음'}</h2>
            <p className="text-slate-400">계정 ID: {user?._id || 'ID 없음'}</p>
            <p className="text-slate-400">가입일: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('ko-KR') : '정보 없음'}</p>
          </div>

          <div className="ml-auto mt-4 md:mt-0 flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition"
            >
              {isEditing ? '취소' : '프로필 수정'}
            </button>

            <button
              onClick={openDeleteModal}
              className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition"
            >
              계정 탈퇴
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500 text-red-200 px-4 py-3 rounded-md mb-4">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-900/30 border border-green-500 text-green-200 px-4 py-3 rounded-md mb-4">
            {successMessage}
          </div>
        )}

        {isEditing ? (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-white font-medium mb-2" htmlFor="nickname">
                닉네임 (배틀태그)
              </label>
              <input
                type="text"
                id="nickname"
                name="nickname"
                value={user?.battletag || ''}
                readOnly
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-not-allowed opacity-75"
              />
              <p className="text-slate-400 text-sm mt-1">
                배틀넷 계정의 배틀태그가 닉네임으로 사용됩니다. 변경할 수 없습니다.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-white font-medium mb-2" htmlFor="favoriteHeroes">
                선호 영웅 (쉼표로 구분, 최대 5개)
              </label>
              <input
                type="text"
                id="favoriteHeroes"
                name="favoriteHeroes"
                value={formData.favoriteHeroes.join(', ')}
                onChange={handleHeroChange}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="예: 제이나, 알렉스트라자, 디아블로"
              />
              <p className="text-slate-400 text-sm mt-1">
                선택된 영웅: {formData.favoriteHeroes.length}/5
              </p>
            </div>

            <div className="mb-4">
              <span className="block text-white font-medium mb-2">선호 역할</span>
              <div className="flex flex-wrap gap-3">
                {roles.map(role => (
                  <label
                    key={role.id}
                    className={`
                      flex items-center justify-center px-4 py-2 rounded-md cursor-pointer transition
                      ${formData.preferredRoles.includes(role.id)
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={formData.preferredRoles.includes(role.id)}
                      onChange={() => handleRoleToggle(role.id)}
                      className="sr-only"
                    />
                    {role.name}
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`
                bg-indigo-600 text-white py-2 px-4 rounded transition
                ${isLoading ? 'opacity-75 cursor-not-allowed' : 'hover:bg-indigo-700'}
              `}
            >
              {isLoading ? '저장 중...' : '저장하기'}
            </button>
          </form>
        ) : (
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-medium text-indigo-400">닉네임 (배틀태그)</h3>
              <p className="text-white">{getBattleTag() || '설정된 배틀태그가 없습니다.'}</p>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-medium text-indigo-400">선호 영웅</h3>
              <p className="text-white">
                {user?.favoriteHeroes?.length > 0
                  ? user.favoriteHeroes.join(', ')
                  : '선호 영웅이 설정되지 않았습니다.'}
              </p>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-medium text-indigo-400">선호 역할</h3>
              {user?.preferredRoles?.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-2">
                  {user.preferredRoles.map(roleId => (
                    <span key={roleId} className="inline-block bg-indigo-900/50 text-indigo-300 px-3 py-1 rounded-md text-sm">
                      {roleId}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-white">선호 역할이 설정되지 않았습니다.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 계정 탈퇴 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 px-4">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full border border-indigo-900/50">
            <h2 className="text-xl font-bold text-white mb-4">계정 탈퇴</h2>

            <p className="text-gray-300 mb-6">
              계정을 탈퇴하시면 모든 데이터가 삭제되며 복구할 수 없습니다.
              계정 탈퇴를 진행하시려면 본인의 배틀태그를 정확히 입력해주세요.
            </p>

            <div className="mb-4">
              <label className="block text-white font-medium mb-2" htmlFor="confirmBattletag">
                배틀태그 확인 (예: {user?.battletag})
              </label>
              <input
                type="text"
                id="confirmBattletag"
                value={deleteConfirmBattletag}
                onChange={(e) => setDeleteConfirmBattletag(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="본인의 배틀태그를 입력하세요"
                disabled={isLoading}
              />
              <p className="text-slate-400 text-sm mt-1">
                배틀태그 대소문자와 기호(#)를 정확히 입력해주세요.
              </p>
            </div>

            {deleteError && (
              <div className="bg-red-900/30 border border-red-500 text-red-200 px-4 py-3 rounded-md mb-4">
                {deleteError}
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={closeDeleteModal}
                className="bg-slate-700 text-white py-2 px-4 rounded hover:bg-slate-600 transition"
                disabled={isLoading}
              >
                취소
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isLoading || deleteConfirmBattletag !== user?.battletag}
                className={`
                  bg-red-600 text-white py-2 px-4 rounded transition flex items-center justify-center min-w-[100px]
                  ${isLoading || deleteConfirmBattletag !== user?.battletag
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:bg-red-700'}
                `}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    처리 중...
                  </>
                ) : (
                  '계정 탈퇴'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
