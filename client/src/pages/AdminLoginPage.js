import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import axios from 'axios';

// Axios 기본 설정
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const AdminLoginPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/auth/admin-login', formData);

      // 로그인 성공 시 상태 업데이트 및 관리자 페이지로 이동
      if (response.data && response.data.token) {
        console.log('관리자 로그인 성공:', response.data);
        await login(response.data.token);

        // 로그인 후 잠시 대기하여 사용자 정보가 로드되도록 함
        setTimeout(() => {
          navigate('/admin');
        }, 500);
      } else {
        // 응답은 성공했지만 토큰이 없는 경우
        setError('로그인 응답에 토큰이 없습니다. 관리자에게 문의하세요.');
      }
    } catch (err) {
      console.error('관리자 로그인 오류:', err);

      // 에러 메시지 설정 (페이지 이동 없이)
      if (err.response?.status === 401) {
        setError('아이디 또는 비밀번호가 일치하지 않습니다.');
      } else if (err.response?.status === 403) {
        setError('관리자 권한이 없습니다.');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.code === 'NETWORK_ERROR' || !err.response) {
        setError('서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.');
      } else {
        setError('로그인에 실패했습니다. 잠시 후 다시 시도해주세요.');
      }

      // 폼 데이터 초기화 (보안상 비밀번호만)
      setFormData(prev => ({
        ...prev,
        password: ''
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="bg-slate-800 rounded-lg p-6 shadow-xl border border-indigo-900/50">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white">관리자 로그인</h1>
          <p className="text-gray-400 mt-2">관리자 계정으로 로그인해주세요</p>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-300 mb-2" htmlFor="username">
              아이디
            </label>
            <input
              type="text"
              id="username"
              name="username"
              className="w-full bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded focus:outline-none focus:border-indigo-500"
              placeholder="관리자 아이디 입력"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-300 mb-2" htmlFor="password">
              비밀번호
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="w-full bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded focus:outline-none focus:border-indigo-500"
              placeholder="비밀번호 입력"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                로그인 중...
              </span>
            ) : (
              '로그인'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="/" className="text-indigo-400 hover:text-indigo-300 text-sm">
            &larr; 홈으로 돌아가기
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
