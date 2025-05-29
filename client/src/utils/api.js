import axios from 'axios';

// API 기본 설정
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  timeout: 30000, // 30초 타임아웃 (DB 서버가 느릴 수 있음)
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 - 로딩 상태 관리
api.interceptors.request.use(
  (config) => {
    console.log(`API 요청: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API 요청 오류:', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 오류 처리 및 재시도
api.interceptors.response.use(
  (response) => {
    console.log(`API 응답 성공: ${response.config.url} (${response.status})`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // 타임아웃 오류 처리
    if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      console.warn('API 타임아웃 발생:', originalRequest.url);

      // 재시도 로직 (최대 2번)
      if (!originalRequest._retry && originalRequest._retryCount < 2) {
        originalRequest._retry = true;
        originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

        console.log(`API 재시도 (${originalRequest._retryCount}/2):`, originalRequest.url);

        // 재시도 시 타임아웃을 더 길게 설정
        originalRequest.timeout = 45000; // 45초

        return api(originalRequest);
      }
    }

    // 서버 오류 (5xx) 처리
    if (error.response?.status >= 500) {
      console.error('서버 오류:', error.response.status, error.response.data);

      // 재시도 로직
      if (!originalRequest._retry && originalRequest._retryCount < 1) {
        originalRequest._retry = true;
        originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

        console.log(`서버 오류 재시도 (${originalRequest._retryCount}/1):`, originalRequest.url);

        // 2초 대기 후 재시도
        await new Promise(resolve => setTimeout(resolve, 2000));

        return api(originalRequest);
      }
    }

    console.error('API 오류:', error.response?.status, error.message);
    return Promise.reject(error);
  }
);

// 특별한 API 호출 함수들
export const apiWithRetry = async (config, maxRetries = 3) => {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await api(config);
      return response;
    } catch (error) {
      lastError = error;

      if (i < maxRetries - 1) {
        const delay = Math.min(1000 * Math.pow(2, i), 5000); // 지수 백오프 (최대 5초)
        console.log(`재시도 대기 중... (${delay}ms)`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
};

// 리더보드 API 호출 (최적화됨)
export const fetchLeaderboard = async (params = {}) => {
  const config = {
    method: 'GET',
    url: '/api/users/leaderboard',
    params: {
      minGames: 1,
      limit: 30,
      t: Date.now(), // 캐시 방지
      ...params
    },
    timeout: 45000 // 45초 타임아웃
  };

  return apiWithRetry(config, 3);
};

// 최근 게임 API 호출 (최적화됨)
export const fetchRecentGames = async (params = {}) => {
  const config = {
    method: 'GET',
    url: '/api/matchmaking/recent-games',
    params: {
      limit: 30,
      page: 1,
      t: Date.now(), // 캐시 방지
      ...params
    },
    timeout: 45000 // 45초 타임아웃
  };

  return apiWithRetry(config, 3);
};

// 전체 사용자 목록 API 호출 (폴백용)
export const fetchAllUsers = async (params = {}) => {
  const config = {
    method: 'GET',
    url: '/api/users/all',
    params: {
      limit: 30,
      t: Date.now(), // 캐시 방지
      ...params
    },
    timeout: 45000 // 45초 타임아웃
  };

  return apiWithRetry(config, 2);
};

// 관리자 API 호출 함수들
export const fetchAdminUsers = async (params = {}, token) => {
  const config = {
    method: 'GET',
    url: '/api/admin/users',
    params: {
      page: 1,
      limit: 10,
      t: Date.now(), // 캐시 방지
      ...params
    },
    headers: {
      'Authorization': `Bearer ${token}`
    },
    timeout: 45000 // 45초 타임아웃
  };

  return apiWithRetry(config, 3);
};

export const fetchAdminMatches = async (params = {}, token) => {
  const config = {
    method: 'GET',
    url: '/api/admin/matches',
    params: {
      page: 1,
      limit: 10,
      t: Date.now(), // 캐시 방지
      ...params
    },
    headers: {
      'Authorization': `Bearer ${token}`
    },
    timeout: 45000 // 45초 타임아웃
  };

  return apiWithRetry(config, 3);
};

export const fetchAdminDashboard = async (token) => {
  const config = {
    method: 'GET',
    url: '/api/admin/dashboard',
    params: {
      t: Date.now() // 캐시 방지
    },
    headers: {
      'Authorization': `Bearer ${token}`
    },
    timeout: 45000 // 45초 타임아웃
  };

  return apiWithRetry(config, 3);
};

// 관리자 사용자 삭제
export const deleteAdminUser = async (userId, token) => {
  const config = {
    method: 'DELETE',
    url: `/api/admin/users/${userId}`,
    headers: {
      'Authorization': `Bearer ${token}`
    },
    timeout: 30000
  };

  return apiWithRetry(config, 2);
};

// 관리자 매치 삭제
export const deleteAdminMatch = async (matchId, token) => {
  const config = {
    method: 'DELETE',
    url: `/api/admin/matches/${matchId}`,
    headers: {
      'Authorization': `Bearer ${token}`
    },
    timeout: 30000
  };

  return apiWithRetry(config, 2);
};

export default api;
