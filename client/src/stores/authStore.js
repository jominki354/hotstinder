import { create } from 'zustand';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

export const useAuthStore = create((set, get) => ({
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  user: null,
  loading: true,
  error: null,

  // 토큰으로 사용자 정보 로드
  loadUser: async () => {
    const token = get().token;
    if (!token) return;

    try {
      set({ loading: true });
      
      // 헤더에 토큰 설정
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // 사용자 정보 요청
      const res = await axios.get('/api/auth/me');
      
      set({ 
        isAuthenticated: true, 
        user: res.data.user, 
        loading: false,
        error: null
      });
    } catch (err) {
      console.error('사용자 로드 오류:', err.response?.data || err.message);
      
      // 토큰이 유효하지 않은 경우 로그아웃
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];

      set({ 
        token: null,
        isAuthenticated: false, 
        user: null, 
        loading: false,
        error: err.response?.data?.message || '인증 오류가 발생했습니다'
      });
    }
  },

  // 로그인 (토큰 저장)
  login: (token) => {
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    set({ 
      token,
      isAuthenticated: true,
      loading: false,
      error: null
    });
    
    // 사용자 정보 로드
    get().loadUser();
  },

  // 사용자 인증 상태 확인
  checkAuth: async () => {
    try {
      set({ isLoading: true });
      const response = await axios.get('http://localhost:5000/api/auth/user', {
        withCredentials: true
      });
      
      const { isAuthenticated, user } = response.data;
      set({ 
        isAuthenticated, 
        user,
        isLoading: false,
        error: null
      });
      
      return isAuthenticated;
    } catch (error) {
      console.error('인증 상태 확인 오류:', error);
      set({ 
        isAuthenticated: false, 
        user: null,
        isLoading: false,
        error: '인증 상태를 확인하는 중 오류가 발생했습니다.'
      });
      return false;
    }
  },
  
  // 사용자 정보 새로고침
  refreshUser: async () => {
    try {
      // 캐시 방지를 위한 타임스탬프 추가
      const timestamp = new Date().getTime();
      console.log('사용자 정보 새로고침 시작...');
      
      const response = await axios.get(`http://localhost:5000/api/auth/user?t=${timestamp}`, {
        withCredentials: true,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      const { isAuthenticated, user } = response.data;
      
      console.log('사용자 정보 갱신 결과:', user); 
      console.log('선호 역할:', user?.preferredRoles);
      console.log('선호 영웅:', user?.favoriteHeroes);
      
      set({ 
        isAuthenticated, 
        user,
        isLoading: false,
        error: null
      });
      
      return user;
    } catch (error) {
      console.error('사용자 정보 새로고침 오류:', error);
      return null;
    }
  },
  
  // 로그아웃
  logout: async () => {
    try {
      set({ loading: true }); // 로딩 시작
      
      // 서버에 로그아웃 요청
      const response = await axios.get('http://localhost:5000/api/auth/logout', {
        withCredentials: true
      });
      
      // 로컬 스토리지 토큰 제거
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      
      // 상태 초기화
      set({ 
        token: null,
        isAuthenticated: false, 
        user: null,
        loading: false,
        error: null
      });
      
      // 로그아웃 후 홈페이지 이동
      window.location.href = '/';
      
      return { success: true, message: '성공적으로 로그아웃되었습니다.' };
    } catch (error) {
      console.error('로그아웃 오류:', error);
      
      // 로그아웃 실패해도 클라이언트에서는 로그아웃 처리
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      
      set({ 
        token: null,
        isAuthenticated: false, 
        user: null,
        loading: false,
        error: '로그아웃 중 오류가 발생했습니다. 다시 시도해주세요.'
      });
      
      // 로그아웃 후 홈페이지 이동
      window.location.href = '/';
      
      return { success: false, error: '로그아웃 중 오류가 발생했습니다.' };
    }
  },
  
  // 회원 탈퇴
  deleteAccount: async (battletag) => {
    try {
      set({ loading: true, error: null });
      
      // 배틀태그가 입력되지 않은 경우
      if (!battletag) {
        set({ loading: false, error: '배틀태그를 입력해주세요.' });
        return { success: false, error: '배틀태그를 입력해주세요.' };
      }
      
      // 서버에 계정 삭제 요청
      const response = await axios.post('http://localhost:5000/api/user/delete', 
        { battletag },
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      // 요청 성공 시 (응답 데이터 확인)
      if (response.status === 200 && response.data && response.data.success === true) {
        // 탈퇴 완료 알림 표시
        alert('탈퇴가 완료되었습니다. 이용해 주셔서 감사합니다.');
        
        // 로컬 스토리지 토큰 제거
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        
        // 상태 초기화
        set({ 
          token: null,
          isAuthenticated: false, 
          user: null,
          loading: false,
          error: null
        });
        
        // 홈페이지로 이동
        window.location.href = '/';
        
        return { 
          success: true, 
          message: '계정이 성공적으로 삭제되었습니다. 이용해주셔서 감사합니다.' 
        };
      } else {
        // 응답은 성공했지만 응답 내용에 오류가 있는 경우
        const errorMessage = response.data.message || '계정 삭제 중 오류가 발생했습니다.';
        console.error('계정 탈퇴 실패 응답:', response.data);
        
        set({ 
          loading: false,
          error: errorMessage
        });
        
        return { 
          success: false, 
          error: errorMessage
        };
      }
    } catch (error) {
      console.error('계정 탈퇴 오류:', error);
      const errorMessage = error.response?.data?.message || '계정 삭제 중 오류가 발생했습니다.';
      
      set({ 
        loading: false,
        error: errorMessage
      });
      
      return { success: false, error: errorMessage };
    }
  },

  // 토큰 유효성 검사
  isTokenValid: () => {
    const token = get().token;
    if (!token) return false;

    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      
      // 토큰 만료 확인
      if (decoded.exp < currentTime) {
        get().logout();
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('토큰 검증 오류:', err);
      get().logout();
      return false;
    }
  },

  // 프로필 설정
  updateProfile: async (profileData) => {
    try {
      set({ isLoading: true });
      const response = await axios.post(
        'http://localhost:5000/api/profile/setup',
        profileData,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        // 사용자 정보 다시 로드
        await get().refreshUser();
        set({ 
          isLoading: false,
          error: null
        });
        return { success: true };
      }
    } catch (error) {
      console.error('프로필 업데이트 오류:', error);
      set({ 
        isLoading: false,
        error: error.response?.data?.message || '프로필 업데이트 중 오류가 발생했습니다.'
      });
      return { 
        success: false, 
        error: error.response?.data?.message || '프로필 업데이트 중 오류가 발생했습니다.'
      };
    }
  },
  
  // 오류 초기화
  clearError: () => set({ error: null })
})); 