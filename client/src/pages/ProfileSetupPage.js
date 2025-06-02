import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import axios from 'axios';
import { toast } from 'react-toastify';
import { translateHero } from '../utils/hotsTranslations';

// Axios 기본 설정
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// 역할별 영웅 분류 및 아이콘 URL
const HERO_DATA = {
  '탱커': [
    { name: '디아블로', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/diablo/icon.png' },
    { name: '정예 타우렌 족장', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/etc/icon.png' },
    { name: '가로쉬', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/garrosh/icon.png' },
    { name: '요한나', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/johanna/icon.png' },
    { name: '무라딘', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/muradin/icon.png' },
    { name: '아서스', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/arthas/icon.png' },
    { name: '블레이즈', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/blaze/icon.png' },
    { name: '누더기', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/stitches/icon.png' },
    { name: '아눕아락', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/anubarak/icon.png' },
    { name: '티리엘', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/tyrael/icon.png' },
    { name: '말가니스', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/malganis/icon.png' },
    { name: '메이', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/mei/icon.png' }
  ],
  '브루저': [
    { name: '알라라크', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/alarak/icon.png' },
    { name: '데하카', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/dehaka/icon.png' },
    { name: '소냐', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/sonya/icon.png' },
    { name: '스랄', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/thrall/icon.png' },
    { name: '레오릭', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/leoric/icon.png' },
    { name: '바리안', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/varian/icon.png' },
    { name: '아르타니스', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/artanis/icon.png' },
    { name: '라그나로스', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/ragnaros/icon.png' },
    { name: '임페리우스', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/imperius/icon.png' },
    { name: '첸', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/chen/icon.png' },
    { name: '줄', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/xul/icon.png' },
    { name: 'D.Va', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/dva/icon.png' },
    { name: '이렐', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/yrel/icon.png' },
    { name: '말티엘', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/malthael/icon.png' },
    { name: '렉사르', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/rexxar/icon.png' },
    { name: '데스윙', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/deathwing/icon.png' }
  ],
  '원딜': [
    { name: '아즈모단', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/azmodan/icon.png' },
    { name: '카시아', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/cassia/icon.png' },
    { name: '폴스타드', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/falstad/icon.png' },
    { name: '굴단', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/guldan/icon.png' },
    { name: '한조', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/hanzo/icon.png' },
    { name: '켈투자드', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/kelthuzad/icon.png' },
    { name: '캘타스', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/kaelthas/icon.png' },
    { name: '리밍', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/li-ming/icon.png' },
    { name: '노바', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/nova/icon.png' },
    { name: '오르피아', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/orphea/icon.png' },
    { name: '프로비우스', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/probius/icon.png' },
    { name: '레이너', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/raynor/icon.png' },
    { name: '실바나스', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/sylvanas/icon.png' },
    { name: '타이커스', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/tychus/icon.png' },
    { name: '발라', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/valla/icon.png' },
    { name: '자가라', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/zagara/icon.png' },
    { name: '줄진', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/zuljin/icon.png' },
    { name: '크로미', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/chromie/icon.png' },
    { name: '제이나', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/jaina/icon.png' },
    { name: '피닉스', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/fenix/icon.png' },
    { name: '해머 상사', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/sgthammer/icon.png' },
    { name: '트레이서', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/tracer/icon.png' },
    { name: '루나라', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/lunara/icon.png' },
    { name: '제라툴', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/zeratul/icon.png' },
    { name: '그레이메인', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/greymane/icon.png' },
    { name: '키히라', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/qhira/icon.png' }
  ],
  '서포터': [
    { name: '아바투르', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/abathur/icon.png' },
    { name: '메디브', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/medivh/icon.png' },
    { name: '더 로스트 바이킹', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/the-lost-vikings/icon.png' },
    { name: '자리야', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/zarya/icon.png' },
    { name: '타사다르', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/tassadar/icon.png' },
    { name: '가즈로', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/gazlowe/icon.png' }
  ],
  '힐러': [
    { name: '알렉스트라자', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/alexstrasza/icon.png' },
    { name: '아나', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/ana/icon.png' },
    { name: '안두인', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/anduin/icon.png' },
    { name: '빛나래', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/brightwing/icon.png' },
    { name: '데커드', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/deckard/icon.png' },
    { name: '카라짐', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/kharazim/icon.png' },
    { name: '리 리', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/li-li/icon.png' },
    { name: '루시우', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/lucio/icon.png' },
    { name: '말퓨리온', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/malfurion/icon.png' },
    { name: '모랄레스 중위', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/lt-morales/icon.png' },
    { name: '레가르', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/rehgar/icon.png' },
    { name: '스투코프', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/stukov/icon.png' },
    { name: '우서', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/uther/icon.png' },
    { name: '화이트메인', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/whitemane/icon.png' },
    { name: '티란데', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/tyrande/icon.png' },
    { name: '아우리엘', iconUrl: 'https://heroesofthestorm.blizzard.com/static/images/heroes/auriel/icon.png' }
  ]
};

// 전체 영웅 데이터를 하나의 배열로 평탄화
const ALL_HEROES = Object.values(HERO_DATA).flat();

// 역할 정의 - 매치메이킹 페이지와 동일하게 변경
const ROLES = [
  { id: '전체', name: '전체', icon: '🎯', description: '모든 역할 가능' },
  { id: '탱커', name: '탱커', icon: '🛡️', description: '팀을 보호하는 전면 방어' },
  { id: '브루저', name: '브루저', icon: '⚔️', description: '근접 전투 전문가' },
  { id: '원거리 암살자', name: '원거리 딜러', icon: '🏹', description: '원거리 공격 전문' },
  { id: '근접 암살자', name: '근접 딜러', icon: '🗡️', description: '기습과 암살 전문' },
  { id: '지원가', name: '지원가', icon: '✨', description: '팀 지원 및 유틸리티' },
  { id: '힐러', name: '힐러', icon: '💚', description: '팀원 치료 전문' }
];

// 티어 정의
const TIERS = [
  { id: 'placement', name: '배치', icon: '❓', color: 'from-gray-500 to-gray-700', minMmr: 1500, maxMmr: 1500 },
  { id: 'bronze', name: '브론즈', icon: '🥉', color: 'from-yellow-800 to-yellow-950', minMmr: 1200, maxMmr: 1399 },
  { id: 'silver', name: '실버', icon: '🥈', color: 'from-gray-300 to-gray-500', minMmr: 1400, maxMmr: 1599 },
  { id: 'gold', name: '골드', icon: '🏆', color: 'from-yellow-300 to-yellow-500', minMmr: 1600, maxMmr: 1799 },
  { id: 'platinum', name: '플래티넘', icon: '🥇', color: 'from-teal-300 to-teal-500', minMmr: 1800, maxMmr: 1999 },
  { id: 'diamond', name: '다이아몬드', icon: '💎', color: 'from-blue-300 to-blue-500', minMmr: 2000, maxMmr: 2199 },
  { id: 'master', name: '마스터', icon: '⭐', color: 'from-purple-300 to-purple-500', minMmr: 2200, maxMmr: 2499 },
  { id: 'grandmaster', name: '그랜드마스터', icon: '👑', color: 'from-red-300 to-red-500', minMmr: 2500, maxMmr: 3000 }
];

const ProfileSetupPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, refreshUser, deleteAccount, updateProfile } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successState, setSuccessState] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' 또는 'delete'
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);

  // 간소화된 폼 데이터
  const [formData, setFormData] = useState({
    nickname: '',
    previousTier: 'placement', // 기본값 배치
    preferredRoles: []
  });

  // 배틀태그 가져오기 함수
  const getBattleTag = () => {
    if (!user) return '';
    return user.battletag || user.battleTag || user.battleNetTag || user.nickname || '';
  };

  // 사용자 ID 가져오기 함수
  const getUserId = () => {
    if (!user) return '';
    return user._id || user.id || '';
  };

  // 계정 생성일 가져오기 함수
  const getCreatedAt = () => {
    if (!user || !user.createdAt) return new Date().toLocaleDateString('ko-KR');
    return new Date(user.createdAt).toLocaleDateString('ko-KR');
  };

  // 리디렉션 처리 및 초기 데이터 로딩
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // 이미 프로필 설정이 완료된 경우 편집 모드로 설정
    if (user?.isProfileComplete) {
      setIsEditMode(true);
    }

    // 배틀태그에서 닉네임 설정
    const battletag = getBattleTag();

    // 사용자 데이터가 있으면 기존 정보 설정 (개선된 로직)
    if (user) {
      console.log('[ProfileSetupPage] 사용자 데이터 로드:', {
        preferredRoles: user.preferredRoles,
        previousTier: user.previousTier,
        isProfileComplete: user.isProfileComplete,
        battletag: battletag
      });

      setFormData(prev => ({
        ...prev,
        nickname: battletag || prev.nickname,
        preferredRoles: Array.isArray(user.preferredRoles) ? user.preferredRoles : [],
        previousTier: user.previousTier || 'placement'
      }));
    } else if (battletag) {
      // 사용자 데이터가 없지만 배틀태그가 있는 경우
      setFormData(prev => ({
        ...prev,
        nickname: battletag
      }));
    }
  }, [isAuthenticated, user, navigate]);

  // 사용자 정보가 변경될 때마다 폼 데이터 업데이트
  useEffect(() => {
    if (user) {
      const battletag = getBattleTag();

      console.log('[ProfileSetupPage] 사용자 정보 변경 감지:', {
        preferredRoles: user.preferredRoles,
        previousTier: user.previousTier,
        isProfileComplete: user.isProfileComplete
      });

      setFormData(prev => ({
        ...prev,
        nickname: battletag || prev.nickname,
        preferredRoles: Array.isArray(user.preferredRoles) ? user.preferredRoles : prev.preferredRoles,
        previousTier: user.previousTier || prev.previousTier
      }));

      // 프로필 완료 상태에 따라 편집 모드 설정
      if (user.isProfileComplete && !isEditMode) {
        setIsEditMode(true);
      }
    }
  }, [user?.preferredRoles, user?.previousTier, user?.isProfileComplete, isEditMode]);

  // 역할 토글 핸들러
  const handleRoleToggle = (role) => {
    setFormData(prev => {
      const updatedRoles = prev.preferredRoles.includes(role)
        ? prev.preferredRoles.filter(r => r !== role)
        : [...prev.preferredRoles, role];

      return {
        ...prev,
        preferredRoles: updatedRoles
      };
    });
  };

  // 티어 선택 핸들러
  const handleTierSelect = (tierId) => {
    setFormData(prev => ({
      ...prev,
      previousTier: tierId
    }));
  };

  // 프로필 저장 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // 데이터 검증
      if (formData.preferredRoles.length === 0) {
        setError('선호하는 역할을 하나 이상 선택해주세요.');
        setIsLoading(false);
        return;
      }

      // 선택한 티어의 MMR 정보 가져오기
      const selectedTier = TIERS.find(tier => tier.id === formData.previousTier);
      const initialMmr = Math.floor((selectedTier.minMmr + selectedTier.maxMmr) / 2); // 해당 티어의 중간값

      // 서버에 전송할 데이터 - 명확한 JSON 구조
      const profileData = {
        nickname: formData.nickname || '',
        preferredRoles: formData.preferredRoles || [],
        previousTier: formData.previousTier || 'placement',
        initialMmr: initialMmr || 1500,
        isProfileComplete: true
      };

      console.log('🔧 프로필 데이터 전송 준비:', profileData);

      let result;
      if (isEditMode) {
        // 기존 프로필 업데이트
        result = await updateProfile(profileData);
      } else {
        // 새 프로필 생성 - axios 요청 개선
        try {
          const token = localStorage.getItem('token');

          if (!token) {
            throw new Error('인증 토큰이 없습니다. 다시 로그인해주세요.');
          }

          console.log('🔧 API 요청 시작:', {
            url: '/api/auth/profile/setup',
            method: 'POST',
            hasToken: !!token,
            dataKeys: Object.keys(profileData)
          });

          const response = await axios({
            method: 'POST',
            url: '/api/auth/profile/setup',
            data: profileData,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            withCredentials: true,
            timeout: 30000 // 30초 타임아웃
          });

          console.log('✅ 프로필 설정 응답 성공:', response.data);
          result = { success: response.data.success };

        } catch (apiError) {
          console.error('❌ API 요청 실패:', {
            status: apiError.response?.status,
            statusText: apiError.response?.statusText,
            data: apiError.response?.data,
            message: apiError.message
          });

          // 구체적인 에러 메시지 제공
          let errorMessage = '프로필 저장 중 오류가 발생했습니다.';

          if (apiError.response?.status === 401) {
            errorMessage = '인증이 만료되었습니다. 다시 로그인해주세요.';
            // 토큰 제거 및 로그인 페이지로 리다이렉트
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
            return;
          } else if (apiError.response?.status === 400) {
            errorMessage = apiError.response.data?.message || '입력 데이터에 문제가 있습니다.';
          } else if (apiError.response?.status === 500) {
            errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
          } else if (apiError.code === 'ECONNABORTED') {
            errorMessage = '요청 시간이 초과되었습니다. 네트워크 연결을 확인해주세요.';
          }

          throw new Error(errorMessage);
        }
      }

      if (result.success) {
        // 사용자 정보 갱신
        console.log('[ProfileSetupPage] 프로필 저장 성공, 사용자 정보 갱신 시작');
        const updatedUser = await refreshUser();

        if (updatedUser) {
          console.log('[ProfileSetupPage] 사용자 정보 갱신 완료:', {
            preferredRoles: updatedUser.preferredRoles,
            previousTier: updatedUser.previousTier,
            isProfileComplete: updatedUser.isProfileComplete
          });
        }

        // 성공 상태로 설정
        setIsLoading(false);
        setSuccessState(true);

        // 로컬 스토리지에 프로필 완료 상태와 추가 정보 저장 (백업용)
        localStorage.setItem('profileComplete', 'true');
        localStorage.setItem('userPreferredRoles', JSON.stringify(formData.preferredRoles));
        localStorage.setItem('userPreviousTier', formData.previousTier);
        localStorage.setItem('userNickname', formData.nickname);

        // 사용자 정보 갱신 후 1초 후 대시보드로 리다이렉션 (새 프로필 생성 시에만)
        if (!isEditMode) {
          setTimeout(() => {
            console.log('[ProfileSetupPage] 프로필 설정 완료, 대시보드로 이동');
            navigate('/dashboard');
          }, 1000);
        } else {
          // 편집 모드에서는 성공 메시지만 표시하고 페이지에 남음
          setTimeout(() => {
            setSuccessState(false);
          }, 2000);
        }
      } else {
        throw new Error(result.error || '프로필 저장에 실패했습니다.');
      }
    } catch (err) {
      console.error('💥 프로필 설정 오류:', err);

      const errorMessage = err.message || '프로필 저장 중 오류가 발생했습니다.';
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  // 계정 탈퇴 핸들러
  const handleAccountDelete = async (e) => {
    e.preventDefault();

    if (deleteConfirmation !== getBattleTag()) {
      setError('배틀태그를 정확히 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await deleteAccount(getBattleTag());

      if (result.success) {
        // deleteAccount 함수 내에서 로그아웃 및 홈페이지 리다이렉션 처리됨
      } else {
        throw new Error(result.error || '계정 삭제에 실패했습니다.');
      }
    } catch (err) {
      console.error('계정 탈퇴 오류:', err);

      const errorMessage = err.response?.data?.message ||
                          err.message ||
                          '계정 탈퇴 중 오류가 발생했습니다.';

      setError(errorMessage);
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return <div className="flex justify-center items-center min-h-screen text-white">로딩 중...</div>;
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="relative z-10 p-4">
        <div className="max-w-4xl mx-auto">
          {/* 헤더 */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
              {isEditMode ? '프로필 관리' : '프로필 설정'}
            </h1>
            <p className="text-xl text-gray-300">
              {isEditMode ? '프로필 정보를 수정하세요' : '게임 프로필을 설정하여 매치메이킹을 시작하세요'}
            </p>
          </div>

          <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-600/30 rounded-3xl p-8">
            {/* 계정 정보 표시 */}
            <div className="mb-8 text-center">
              <div className="w-20 h-20 bg-slate-700/30 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-white">{getBattleTag().charAt(0) || '?'}</span>
              </div>
              <p className="text-blue-400 text-lg font-medium">
                {getBattleTag()}
              </p>
              <div className="mt-2 flex justify-center space-x-4 text-gray-400 text-sm">
                <p>계정 ID: {getUserId()}</p>
                <p>가입일: {getCreatedAt()}</p>
              </div>
            </div>

            {/* 탭 메뉴 */}
            <div className="flex mb-8 border-b border-slate-600/50">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex-1 py-3 px-4 text-center font-medium transition-all duration-300 ${
                  activeTab === 'profile'
                    ? 'text-blue-400 border-b-2 border-blue-500 bg-blue-500/10'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-slate-700/30'
                }`}
              >
                프로필 {isEditMode ? '수정' : '설정'}
              </button>
              <button
                onClick={() => setActiveTab('delete')}
                className={`flex-1 py-3 px-4 text-center font-medium transition-all duration-300 ${
                  activeTab === 'delete'
                    ? 'text-red-400 border-b-2 border-red-500 bg-red-500/10'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-slate-700/30'
                }`}
              >
                계정 탈퇴
              </button>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-500 text-red-200 px-4 py-3 rounded-xl mb-6">
                {error}
              </div>
            )}

            {/* 프로필 설정/수정 폼 */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* 닉네임 영역 */}
                <div>
                  <label className="block text-white mb-3 font-semibold text-lg">
                    닉네임
                  </label>
                  <input
                    type="text"
                    name="nickname"
                    value={formData.nickname}
                    readOnly={true}
                    className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-not-allowed opacity-75"
                  />
                  <p className="text-slate-400 text-sm mt-2">
                    배틀넷 계정의 배틀태그가 닉네임으로 사용됩니다. 변경할 수 없습니다.
                  </p>
                </div>

                {/* 이전 티어 선택 영역 */}
                <div>
                  <label className="block text-white mb-4 font-semibold text-lg">
                    이전 시즌 티어
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {TIERS.map((tier) => (
                      <button
                        key={tier.id}
                        type="button"
                        onClick={() => handleTierSelect(tier.id)}
                        className={`
                          relative p-6 rounded-2xl transition-all duration-300 overflow-hidden group
                          ${formData.previousTier === tier.id
                            ? 'ring-2 ring-white shadow-xl transform scale-105'
                            : 'hover:shadow-lg hover:scale-102'}
                        `}
                      >
                        <div className={`absolute inset-0 bg-gradient-to-br ${tier.color} opacity-80 group-hover:opacity-90 transition-opacity`}></div>
                        <div className="relative z-10 flex flex-col items-center">
                          <span className="text-3xl mb-2">{tier.icon}</span>
                          <span className="font-bold text-white text-lg tracking-wide">{tier.name}</span>
                          {tier.id !== 'placement' && (
                            <span className="text-white/90 text-xs mt-1">{tier.minMmr} - {tier.maxMmr}</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                  <p className="text-slate-400 text-sm mt-3">
                    선택한 티어의 평균 MMR이 초기값으로 설정됩니다.
                  </p>
                </div>

                {/* 선호하는 역할 영역 */}
                <div>
                  <label className="block text-white mb-6 font-semibold text-lg flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-500/20 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    선호하는 역할 (여러 개 선택 가능)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {ROLES.map((role) => (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => handleRoleToggle(role.id)}
                        className={`p-4 rounded-2xl border-2 transition-all duration-300 text-center ${
                          formData.preferredRoles.includes(role.id)
                            ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/25'
                            : 'border-slate-600/50 bg-slate-700/20 hover:border-slate-500 hover:bg-slate-700/30'
                        }`}
                      >
                        <div className="text-2xl mb-2">{role.icon}</div>
                        <div className="text-sm font-bold text-white">{role.name}</div>
                      </button>
                    ))}
                  </div>
                  <p className="text-slate-400 text-sm mt-4">
                    선택된 역할: {formData.preferredRoles.length}개
                  </p>
                </div>

                {/* 버튼 영역 */}
                <div className="pt-6">
                  <button
                    type="submit"
                    disabled={isLoading || successState}
                    className={`
                      w-full py-4 rounded-xl font-semibold text-white transition-all duration-300 text-lg
                      ${successState
                        ? 'bg-green-600 cursor-default'
                        : isLoading
                          ? 'bg-blue-800 cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 transform hover:scale-105 shadow-lg'}
                    `}
                  >
                    {successState
                      ? '저장 성공!'
                      : isLoading
                        ? '저장 중...'
                        : isEditMode
                          ? '프로필 수정하기'
                          : '프로필 저장하기'
                    }
                  </button>

                  {isEditMode && (
                    <button
                      type="button"
                      onClick={() => navigate('/dashboard')}
                      className="w-full mt-4 py-4 rounded-xl font-semibold text-white bg-slate-700/50 hover:bg-slate-600/50 transition-all duration-300"
                    >
                      대시보드로 돌아가기
                    </button>
                  )}
                </div>
              </form>
            )}

            {/* 계정 탈퇴 폼 */}
            {activeTab === 'delete' && (
              <div className="space-y-6">
                <div className="bg-red-900/30 border border-red-500 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-red-400 mb-3">주의: 계정 탈퇴</h3>
                  <p className="text-gray-300 mb-3">
                    계정을 탈퇴하면 프로필 정보, 게임 기록, 통계 등 모든 데이터가 삭제됩니다.
                    이 작업은 되돌릴 수 없습니다.
                  </p>
                  <p className="text-gray-300">
                    계정 탈퇴를 원하시면 아래에 배틀태그를 입력해주세요.
                  </p>
                </div>

                <form onSubmit={handleAccountDelete} className="space-y-6">
                  <div>
                    <label className="block text-white mb-3 font-semibold text-lg">
                      배틀태그 확인
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmation}
                      onChange={(e) => setDeleteConfirmation(e.target.value)}
                      placeholder={`배틀태그 입력 (${getBattleTag()})`}
                      className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <p className="text-slate-400 text-sm mt-2">
                      정확한 배틀태그를 입력해야 계정 탈퇴가 진행됩니다.
                    </p>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isLoading || deleteConfirmation !== getBattleTag()}
                      className={`
                        w-full py-4 rounded-xl font-semibold text-white transition-all duration-300 text-lg
                        ${isLoading
                          ? 'bg-red-800 cursor-not-allowed'
                          : deleteConfirmation === getBattleTag()
                            ? 'bg-red-600 hover:bg-red-700 transform hover:scale-105'
                            : 'bg-red-900/50 cursor-not-allowed'}
                      `}
                    >
                      {isLoading ? '처리 중...' : '계정 탈퇴하기'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('profile')}
                      className="w-full mt-4 py-4 rounded-xl font-semibold text-white bg-slate-700/50 hover:bg-slate-600/50 transition-all duration-300"
                    >
                      취소하고 돌아가기
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetupPage;
