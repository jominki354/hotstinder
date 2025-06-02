import { create } from 'zustand';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import { persist } from 'zustand/middleware';

// 토큰 만료 검사 함수
const isTokenExpired = (token) => {
  if (!token) return true;

  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  } catch (err) {
    console.error('토큰 검증 오류:', err);
    return true;
  }
};

const useAuthStore = create(
  persist(
    (set, get) => ({
      token: localStorage.getItem('token'),
      isAuthenticated: !!localStorage.getItem('token'),
      user: null,
      loading: true,
      error: null,
      // 대기열 상태 - persist에서 관리하되 localStorage와 동기화
      inQueue: false,
      // 매치 진행 중 상태 - persist에서 관리하되 localStorage와 동기화
      matchInProgress: false,
      currentMatchId: '',
      // 매치 정보 상태
      matchInfo: null,

      // 대기열 상태 설정 함수
      setQueueStatus: (status) => {
        // 상태 변경과 함께 localStorage에도 저장
        localStorage.setItem('inQueue', status.toString());
        set({ inQueue: status });
        console.log('[AuthStore] 대기열 상태 변경:', status);
      },

      // 매치 진행 중 상태 설정 함수
      setMatchProgress: (status, matchId = '') => {
        // status가 undefined나 null인 경우 false로 처리
        const normalizedStatus = status !== undefined && status !== null ? status : false;

        // 상태 변경과 함께 localStorage에도 저장
        localStorage.setItem('matchInProgress', normalizedStatus.toString());
        if (normalizedStatus && matchId) {
          localStorage.setItem('currentMatchId', matchId);
          set({ matchInProgress: normalizedStatus, currentMatchId: matchId });
        } else {
          if (!normalizedStatus) {
            localStorage.removeItem('currentMatchId');
          }
          set({ matchInProgress: normalizedStatus, currentMatchId: normalizedStatus ? get().currentMatchId : '' });
        }

        // 매치 진행 중이면 대기열 상태는 자동으로 false로 설정
        if (normalizedStatus) {
          localStorage.setItem('inQueue', 'false');
          set({ inQueue: false });
        }

        console.log('[AuthStore] 매치 진행 상태 변경:', normalizedStatus, matchId ? `매치 ID: ${matchId}` : '');
      },

      // localStorage와 상태 동기화 함수
      syncWithLocalStorage: () => {
        const localInQueue = localStorage.getItem('inQueue') === 'true';
        const localMatchInProgress = localStorage.getItem('matchInProgress') === 'true';
        const localCurrentMatchId = localStorage.getItem('currentMatchId') || '';

        let localMatchInfo = null;
        try {
          const savedMatchInfo = localStorage.getItem('lastMatchInfo');
          localMatchInfo = savedMatchInfo ? JSON.parse(savedMatchInfo) : null;
        } catch (err) {
          console.error('[AuthStore] 매치 정보 파싱 오류:', err);
        }

        const currentState = get();
        const needsUpdate =
          currentState.inQueue !== localInQueue ||
          currentState.matchInProgress !== localMatchInProgress ||
          currentState.currentMatchId !== localCurrentMatchId;

        if (needsUpdate) {
          console.log('[AuthStore] localStorage와 상태 동기화:', {
            before: {
              inQueue: currentState.inQueue,
              matchInProgress: currentState.matchInProgress,
              currentMatchId: currentState.currentMatchId
            },
            after: {
              inQueue: localInQueue,
              matchInProgress: localMatchInProgress,
              currentMatchId: localCurrentMatchId
            }
          });

          set({
            inQueue: localInQueue,
            matchInProgress: localMatchInProgress,
            currentMatchId: localCurrentMatchId,
            matchInfo: localMatchInfo
          });
        }
      },

      // 서버 상태 확인 및 동기화 함수
      syncWithServer: async () => {
        const token = get().token;
        if (!token) return;

        try {
          console.log('[AuthStore] 서버 상태 동기화 시작');

          const response = await axios.get('/api/matchmaking/status', {
            headers: { 'Authorization': `Bearer ${token}` },
            timeout: 8000
          });

          if (response.data.success) {
            const serverState = response.data;
            const currentState = get();

            console.log('[AuthStore] 서버 상태 확인:', {
              server: {
                inQueue: serverState.inQueue,
                matchInProgress: serverState.matchInProgress,
                matchId: serverState.matchInfo?.matchId
              },
              client: {
                inQueue: currentState.inQueue,
                matchInProgress: currentState.matchInProgress,
                matchId: currentState.currentMatchId
              }
            });

            // 서버 상태와 클라이언트 상태가 다르면 서버 상태로 동기화
            if (serverState.inQueue !== currentState.inQueue) {
              console.log('[AuthStore] 대기열 상태 서버 동기화:', serverState.inQueue);
              get().setQueueStatus(serverState.inQueue);
            }

            if (serverState.matchInProgress !== currentState.matchInProgress) {
              console.log('[AuthStore] 매치 상태 서버 동기화:', serverState.matchInProgress);
              get().setMatchProgress(serverState.matchInProgress, serverState.matchInfo?.matchId);
            }

            if (serverState.matchInfo && serverState.matchInProgress) {
              get().setMatchInfo(serverState.matchInfo);
            }

            return true;
          }
        } catch (error) {
          console.error('[AuthStore] 서버 상태 동기화 실패:', error);
          return false;
        }
      },

      // 매치 정보 설정 함수 추가
      setMatchInfo: (matchInfoData) => {
        if (!matchInfoData) {
          console.error('[AuthStore] 매치 정보가 없습니다');
          return;
        }

        // 최소한의 유효성 검사
        if (!matchInfoData.matchId || !matchInfoData.blueTeam || !matchInfoData.redTeam) {
          console.error('[AuthStore] 유효하지 않은 매치 정보:', matchInfoData);
          return;
        }

        // 매치 정보 저장
        try {
          const matchInfoStr = JSON.stringify(matchInfoData);
          localStorage.setItem('lastMatchInfo', matchInfoStr);
          set({ matchInfo: matchInfoData });
          console.log('[AuthStore] 매치 정보 업데이트:', matchInfoData.matchId);
        } catch (err) {
          console.error('[AuthStore] 매치 정보 저장 오류:', err);
        }
      },

      // 매치 정보 삭제 함수 추가
      clearMatchInfo: () => {
        localStorage.removeItem('lastMatchInfo');
        set({ matchInfo: null });
        console.log('[AuthStore] 매치 정보 삭제됨');
      },

      // 사용자 정보 표준화 함수
      normalizeUserData: (userData) => {
        if (!userData) return null;

        // 배틀태그 정보 일관성 유지
        const normalizedUser = { ...userData };

        // 다양한 배틀태그 필드 처리
        if (!normalizedUser.battletag) {
          normalizedUser.battletag = normalizedUser.battleTag || normalizedUser.battleNetTag || normalizedUser.nickname || '';
        }

        // 역방향 호환성을 위해 battleTag 필드도 설정
        if (!normalizedUser.battleTag) {
          normalizedUser.battleTag = normalizedUser.battletag;
        }

        // _id 필드가 없거나 유효하지 않은 경우 id로 대체
        if (!normalizedUser._id && normalizedUser.id) {
          normalizedUser._id = normalizedUser.id;
        }

        // createdAt 필드가 없는 경우 현재 시간 사용
        if (!normalizedUser.createdAt) {
          if (normalizedUser.created) {
            normalizedUser.createdAt = normalizedUser.created;
          } else {
            // 현재 시간을 기본값으로 사용
            normalizedUser.createdAt = new Date().toISOString();
          }
        }

        // previousTier 필드가 없는 경우 기본값 설정
        if (!normalizedUser.previousTier) {
          normalizedUser.previousTier = 'placement';
        }

        // 관리자 권한 처리 - PostgreSQL과 MongoDB 호환
        if (normalizedUser.role === 'admin') {
          // PostgreSQL: role 필드가 'admin'인 경우
          normalizedUser.isAdmin = true;
          normalizedUser.isSuperAdmin = true;
        } else if (normalizedUser.isAdmin === true) {
          // MongoDB: isAdmin 필드가 true인 경우 (기존 로직 유지)
          normalizedUser.isAdmin = true;
        } else {
          // 기본값: 관리자가 아님
          normalizedUser.isAdmin = false;
          normalizedUser.isSuperAdmin = false;
        }

        // isProfileComplete 필드 처리 - 서버 데이터를 우선시
        if (normalizedUser.profileComplete === true || normalizedUser.isProfileComplete === true) {
          normalizedUser.isProfileComplete = true;
          // 서버에서 프로필 완료 상태가 true이면 localStorage에도 저장
          localStorage.setItem('profileComplete', 'true');
        } else {
          // 서버에서 프로필 완료 상태가 false이면 localStorage도 제거
          localStorage.removeItem('profileComplete');
          normalizedUser.isProfileComplete = false;
        }

        console.log('표준화된 사용자 정보:', normalizedUser);
        console.log('관리자 권한 매핑:', {
          originalRole: userData.role,
          originalIsAdmin: userData.isAdmin,
          normalizedIsAdmin: normalizedUser.isAdmin,
          normalizedIsSuperAdmin: normalizedUser.isSuperAdmin
        });

        return normalizedUser;
      },

      // 토큰으로 사용자 정보 로드
      loadUser: async () => {
        const token = get().token;
        if (!token) {
          console.error('[AuthStore] 사용자 로드 실패 - 토큰이 없음');
          set({
            isAuthenticated: false,
            user: null,
            loading: false,
            error: '인증 토큰이 없습니다'
          });
          return null;
        }

        try {
          set({ loading: true });
          console.log('[AuthStore] 사용자 정보 로드 시도 - 토큰 길이:', token.length);

          // 헤더에 토큰 설정
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          // 사용자 정보 요청 (withCredentials 옵션 추가)
          // 상대 URL 사용으로 변경 (배포 환경에서도 작동하도록)
          console.log('[AuthStore] /api/auth/me API 호출');
          const res = await axios.get('/api/auth/me', {
            withCredentials: true,
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });

          // 응답 데이터 검증
          if (!res.data || !res.data.user) {
            console.error('[AuthStore] API 응답에 사용자 정보가 없음:', res.data);
            throw new Error('API 응답에 사용자 정보가 없습니다');
          }

          // 사용자 정보 정규화
          const normalizedUser = get().normalizeUserData(res.data.user);

          console.log('[AuthStore] 사용자 정보 로드 성공:', normalizedUser.battletag);
          console.log('[AuthStore] 관리자 권한 확인:', {
            isAdmin: normalizedUser.isAdmin,
            isSuperAdmin: normalizedUser.isSuperAdmin,
            originalData: res.data.user
          });

          set({
            isAuthenticated: true,
            user: normalizedUser,
            loading: false,
            error: null
          });

          return normalizedUser;
        } catch (err) {
          console.error('[AuthStore] 사용자 로드 오류:',
            err.response?.status,
            err.response?.data || err.message
          );

          // 인증 오류 (401)인 경우에만 로그아웃 처리
          if (err.response?.status === 401) {
            console.warn('[AuthStore] 인증 만료 또는 유효하지 않은 토큰');
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];

            set({
              token: null,
              isAuthenticated: false,
              user: null,
              loading: false,
              error: '세션이 만료되었습니다. 다시 로그인해주세요.'
            });
          } else {
            // 다른 오류는 인증 상태는 유지하고 오류만 표시
            set({
              loading: false,
              error: '사용자 정보를 불러오는 중 오류가 발생했습니다.'
            });
          }

          return null;
        }
      },

      // 로그인 (토큰 저장)
      login: async (token) => {
        try {
          if (!token) {
            console.error('[AuthStore] 로그인 시도 - 토큰이 없음');
            set({
              error: '유효한 인증 토큰이 없습니다',
              loading: false
            });
            return false;
          }

          console.log('[AuthStore] 로그인 시도 - 토큰 길이:', token.length);

          // 토큰 저장 전에 유효성 검사 시도
          try {
            const decoded = jwtDecode(token);
            console.log('[AuthStore] 토큰 디코딩 성공:', {
              id: decoded.id,
              exp: new Date(decoded.exp * 1000).toISOString()
            });

            // 토큰 만료 확인
            const currentTime = Date.now() / 1000;
            if (decoded.exp < currentTime) {
              console.error('[AuthStore] 만료된 토큰:', {
                expTime: new Date(decoded.exp * 1000).toISOString(),
                currentTime: new Date(currentTime * 1000).toISOString()
              });
              throw new Error('인증 토큰이 만료되었습니다');
            }
          } catch (decodeErr) {
            console.error('[AuthStore] 토큰 검증 오류:', decodeErr);
            // 디코딩 오류는 경고로만 남기고 진행(실제 검증은 서버에서)
          }

          // 토큰 저장
          localStorage.setItem('token', token);
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          console.log('[AuthStore] 토큰 저장 완료, 인증 상태 업데이트');

          set({
            token,
            isAuthenticated: true,
            loading: true,  // 로딩 시작
            error: null
          });

          // 사용자 정보 로드 (비동기 처리)
          console.log('[AuthStore] 사용자 정보 로드 시도');

          try {
            const user = await get().loadUser();

            if (!user) {
              console.warn('[AuthStore] 사용자 정보가 없습니다');
              // 사용자 정보가 없어도 인증 상태는 유지 (토큰 기반)
              set({ loading: false });
              return true;
            }

            console.log('[AuthStore] 로그인 성공 - 사용자:', user.battletag);

            // 로딩 완료
            set({ loading: false });

            return true;
          } catch (loadErr) {
            console.error('[AuthStore] 사용자 정보 로드 오류:', loadErr);

            // 사용자 정보 로드 실패해도 로그인은 성공으로 간주
            set({ loading: false });
            return true;
          }
        } catch (err) {
          console.error('[AuthStore] 로그인 처리 오류:', err);

          // 오류 발생 시 로그아웃 처리
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];

          set({
            token: null,
            isAuthenticated: false,
            user: null,
            loading: false,
            error: err.message || '로그인 처리 중 오류가 발생했습니다'
          });

          return false;
        }
      },

      // 사용자 인증 상태 확인
      checkAuth: async () => {
        try {
          set({ loading: true });

          // 토큰 확인
          const token = get().token;
          if (!token) {
            set({
              isAuthenticated: false,
              user: null,
              loading: false,
              error: null
            });
            return false;
          }

          // 헤더에 토큰 설정
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          // /api/auth/me 엔드포인트 호출로 변경
          const response = await axios.get('/api/auth/me', {
            withCredentials: true
          });

          // 사용자 정보 정규화
          const normalizedUser = get().normalizeUserData(response.data.user);

          // 로컬 스토리지에서 프로필 설정 정보를 확인하고 보강
          const profileComplete = localStorage.getItem('profileComplete');
          const preferredRoles = localStorage.getItem('userPreferredRoles');
          const previousTier = localStorage.getItem('userPreviousTier');

          if (profileComplete === 'true') {
            normalizedUser.isProfileComplete = true;

            // 추가 프로필 정보가 있으면 적용
            if (preferredRoles) {
              try {
                normalizedUser.preferredRoles = JSON.parse(preferredRoles);
              } catch (e) {
                console.error('선호하는 역할 정보 파싱 오류:', e);
              }
            }

            if (previousTier) {
              normalizedUser.previousTier = previousTier;
            }
          }

          console.log('인증 상태 확인 결과:', normalizedUser);

          set({
            isAuthenticated: true,
            user: normalizedUser,
            loading: false,
            error: null
          });

          return true;
        } catch (error) {
          console.error('인증 상태 확인 오류:', error);

          // 토큰이 유효하지 않은 경우 로그아웃 상태로 설정
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];

          set({
            token: null,
            isAuthenticated: false,
            user: null,
            loading: false,
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

          // token을 사용하여 /api/auth/me 엔드포인트 호출
          const token = get().token;
          if (!token) return null;

          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const response = await axios.get(`/api/auth/me?t=${timestamp}`, {
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });

          // 사용자 정보 정규화
          const normalizedUser = get().normalizeUserData(response.data.user);

          console.log('[AuthStore] 서버에서 받은 사용자 정보:', {
            preferredRoles: normalizedUser.preferredRoles,
            previousTier: normalizedUser.previousTier,
            isProfileComplete: normalizedUser.isProfileComplete,
            nickname: normalizedUser.nickname
          });

          // 서버 정보를 우선시하되, 서버에 정보가 없는 경우에만 로컬 스토리지 사용
          const localProfileComplete = localStorage.getItem('profileComplete');
          const preferredRoles = localStorage.getItem('userPreferredRoles');
          const previousTier = localStorage.getItem('userPreviousTier');
          const nickname = localStorage.getItem('userNickname');

          // 서버에 프로필 완료 정보가 없고 로컬에 있는 경우에만 적용
          if (normalizedUser.isProfileComplete === undefined && localProfileComplete === 'true') {
            normalizedUser.isProfileComplete = true;
            console.log('[AuthStore] 로컬 스토리지의 profileComplete 값 적용');
          }

          // 서버에 선호 역할 정보가 없고 로컬에 있는 경우에만 적용
          if ((!normalizedUser.preferredRoles || normalizedUser.preferredRoles.length === 0) && preferredRoles) {
            try {
              normalizedUser.preferredRoles = JSON.parse(preferredRoles);
              console.log('[AuthStore] 로컬 스토리지의 선호 역할 정보 적용:', normalizedUser.preferredRoles);
            } catch (e) {
              console.error('[AuthStore] 선호 역할 정보 파싱 오류:', e);
            }
          }

          // 서버에 이전 티어 정보가 없고 로컬에 있는 경우에만 적용
          if (!normalizedUser.previousTier && previousTier) {
            normalizedUser.previousTier = previousTier;
            console.log('[AuthStore] 로컬 스토리지의 이전 티어 정보 적용:', normalizedUser.previousTier);
          }

          // 서버에 닉네임이 없고 로컬에 있는 경우에만 적용
          if (!normalizedUser.nickname && nickname) {
            normalizedUser.nickname = nickname;
            console.log('[AuthStore] 로컬 스토리지의 닉네임 정보 적용:', normalizedUser.nickname);
          }

          console.log('[AuthStore] 최종 사용자 정보:', {
            preferredRoles: normalizedUser.preferredRoles,
            previousTier: normalizedUser.previousTier,
            isProfileComplete: normalizedUser.isProfileComplete,
            nickname: normalizedUser.nickname
          });

          set({
            isAuthenticated: true,
            user: normalizedUser,
            loading: false,
            error: null
          });

          return normalizedUser;
        } catch (error) {
          console.error('사용자 정보 새로고침 오류:', error);
          return null;
        }
      },

      // 로그아웃
      logout: async () => {
        try {
          set({ loading: true }); // 로딩 시작

          // 현재 대기열 상태 확인
          const currentInQueue = get().inQueue;

          // 대기열에 있다면 먼저 대기열 취소 API 호출
          if (currentInQueue) {
            try {
              console.log('[AuthStore] 로그아웃 전 대기열 취소 시도');
              await axios.post('/api/matchmaking/leave', {}, {
                withCredentials: true,
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
              });
              console.log('[AuthStore] 로그아웃 전 대기열 취소 성공');
            } catch (queueError) {
              console.error('[AuthStore] 로그아웃 중 대기열 취소 오류:', queueError);
              // 대기열 취소 실패해도 로그아웃은 계속 진행
            }
          }

          // 서버에 로그아웃 요청
          const response = await axios.get('http://localhost:5000/api/auth/logout', {
            withCredentials: true
          });

          // 로컬 스토리지 데이터 모두 제거
          localStorage.removeItem('token');
          localStorage.removeItem('profileComplete');
          localStorage.removeItem('inQueue'); // 대기열 상태
          localStorage.removeItem('userPreferredRoles'); // 선호하는 역할
          localStorage.removeItem('userPreviousTier'); // 이전 티어
          localStorage.removeItem('userNickname'); // 닉네임

          // axios 기본 헤더에서 인증 토큰 제거
          delete axios.defaults.headers.common['Authorization'];

          // 대기열 상태도 리셋
          set({
            token: null,
            isAuthenticated: false,
            user: null,
            inQueue: false,
            error: null
          });

          // 로그아웃 후 홈페이지 이동
          window.location.href = '/';

          return { success: true, message: '성공적으로 로그아웃되었습니다.' };
        } catch (error) {
          console.error('로그아웃 오류:', error);

          // 로그아웃 실패해도 클라이언트에서는 로그아웃 처리
          localStorage.removeItem('token');
          localStorage.removeItem('profileComplete');
          localStorage.removeItem('inQueue'); // 대기열 상태
          localStorage.removeItem('userPreferredRoles'); // 선호하는 역할
          localStorage.removeItem('userPreviousTier'); // 이전 티어
          localStorage.removeItem('userNickname'); // 닉네임

          delete axios.defaults.headers.common['Authorization'];

          set({
            token: null,
            isAuthenticated: false,
            user: null,
            inQueue: false,
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

          // 현재 대기열 상태 확인
          const currentInQueue = get().inQueue;

          // 대기열에 있다면 먼저 대기열 취소 API 호출
          if (currentInQueue) {
            try {
              console.log('[AuthStore] 회원 탈퇴 전 대기열 취소 시도');
              await axios.post('/api/matchmaking/leave', {}, {
                withCredentials: true,
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
              });
              console.log('[AuthStore] 회원 탈퇴 전 대기열 취소 성공');
            } catch (queueError) {
              console.error('[AuthStore] 회원 탈퇴 중 대기열 취소 오류:', queueError);
              // 대기열 취소 실패해도 회원 탈퇴는 계속 진행
            }
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
            localStorage.removeItem('profileComplete');
            localStorage.removeItem('inQueue'); // 대기열 상태도 제거
            delete axios.defaults.headers.common['Authorization'];

            // 상태 초기화
            set({
              token: null,
              isAuthenticated: false,
              user: null,
              inQueue: false,
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

          console.log('프로필 업데이트 시도:', profileData);

          const response = await axios.post(
            '/api/auth/profile/setup',
            profileData,
            {
              withCredentials: true,
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
              }
            }
          );

          console.log('프로필 업데이트 응답:', response.data);

          if (response.data.success) {
            // 사용자 정보 다시 로드
            const updatedUser = await get().refreshUser();
            console.log('프로필 업데이트 후 사용자 정보:', updatedUser);

            set({
              isLoading: false,
              error: null
            });
            return { success: true };
          } else {
            console.warn('프로필 업데이트 성공 플래그가 false:', response.data);
            set({
              isLoading: false,
              error: response.data.message || '프로필 업데이트에 실패했습니다.'
            });
            return {
              success: false,
              error: response.data.message || '프로필 업데이트에 실패했습니다.'
            };
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
      clearError: () => set({ error: null }),

      // 초기화 (앱 시작 시 localStorage에서 상태 복원 및 서버 동기화)
      initialize: async () => {
        console.log('[AuthStore] 앱 초기화 시작');

        // 1. localStorage와 상태 동기화
        get().syncWithLocalStorage();

        // 2. 토큰이 있으면 사용자 정보 로드
        const token = localStorage.getItem('token');
        if (token && !isTokenExpired(token)) {
          try {
            await get().loadUser();

            // 3. 사용자 정보 로드 성공 시 서버 상태 동기화
            await get().syncWithServer();

            console.log('[AuthStore] 앱 초기화 완료 - 사용자 인증 및 상태 동기화 성공');
          } catch (error) {
            console.error('[AuthStore] 앱 초기화 중 사용자 정보 로드 실패:', error);
          }
        } else {
          console.log('[AuthStore] 앱 초기화 완료 - 토큰 없음 또는 만료됨');
        }
      },

      // 사용자 프로필 가져오기 (fetchUserProfile 별칭)
      fetchUserProfile: () => {
        return get().loadUser();
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        inQueue: state.inQueue,
        matchInProgress: state.matchInProgress,
        currentMatchId: state.currentMatchId,
        matchInfo: state.matchInfo
      })
    }
  )
);

export { useAuthStore };
