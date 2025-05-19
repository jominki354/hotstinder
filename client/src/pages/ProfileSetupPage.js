import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import axios from 'axios';

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

const ROLES = ['탱커', '브루저', '원딜', '서포터', '힐러'];

const ProfileSetupPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, refreshUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' 또는 역할명
  
  const [formData, setFormData] = useState({
    nickname: '',
    preferredRoles: [],
    favoriteHeroes: []
  });
  
  // 리디렉션 처리
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (user?.isProfileComplete) {
      navigate('/');
    } else if (user?.battletag) {
      // 배틀태그에서 닉네임 설정
      setFormData(prev => ({
        ...prev,
        nickname: user.battletag // 닉네임을 배틀태그 전체로 설정
      }));
    }
  }, [isAuthenticated, user, navigate]);
  
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
  
  const handleHeroToggle = (hero) => {
    setFormData(prev => {
      const updatedHeroes = prev.favoriteHeroes.includes(hero)
        ? prev.favoriteHeroes.filter(h => h !== hero)
        : [...prev.favoriteHeroes, hero];
      
      return {
        ...prev,
        favoriteHeroes: updatedHeroes.slice(0, 5) // 최대 5개까지만 선택 가능
      };
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    
    try {
      console.log('프로필 설정 요청 전송:', formData);
      
      const response = await axios.post(
        'http://localhost:5000/api/profile/setup',
        formData,
        { withCredentials: true }
      );
      
      console.log('프로필 설정 응답:', response.data);
      
      if (response.data.success) {
        setSuccessMessage('프로필이 성공적으로 저장되었습니다!');
        
        // 사용자 정보 갱신 - 첫 번째 호출
        const updatedUser = await refreshUser();
        console.log('첫 번째 갱신된 사용자 정보:', updatedUser);
        
        // 캐시 문제를 피하기 위해 직접 서버에 다시 요청
        const timestamp = new Date().getTime();
        const verifyResponse = await axios.get(`http://localhost:5000/api/auth/user?t=${timestamp}`, {
          withCredentials: true,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        console.log('검증 요청 결과:', verifyResponse.data.user);
        console.log('선호 역할 확인:', verifyResponse.data.user?.preferredRoles);
        console.log('선호 영웅 확인:', verifyResponse.data.user?.favoriteHeroes);
        
        // 두 번째 갱신 호출
        await refreshUser();
        
        // 성공 알림
        alert('프로필 설정이 완료되었습니다!');
        
        // 홈페이지로 리디렉션
        navigate('/');
      }
    } catch (err) {
      console.error('프로필 설정 오류:', err);
      setError(err.response?.data?.message || '프로필 저장 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 필터링된 영웅 목록
  const getFilteredHeroes = () => {
    if (activeTab === 'all') {
      return ALL_HEROES;
    } else {
      return HERO_DATA[activeTab] || [];
    }
  };
  
  if (!isAuthenticated) {
    return <div className="flex justify-center items-center min-h-screen bg-slate-900 text-white">로딩 중...</div>;
  }
  
  return (
    <div className="min-h-screen bg-slate-900 py-10 text-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto bg-slate-800 rounded-lg shadow-lg p-6 border border-indigo-900/50">
          <h1 className="text-3xl font-bold text-white mb-6 text-center">프로필 설정</h1>
          <p className="text-indigo-400 mb-6 text-center">
            배틀넷 계정 <span className="font-semibold">{user?.battletag}</span>로 로그인했습니다.<br />
            게임에서 사용할 프로필 정보를 설정해주세요.
          </p>
          
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
          
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-white mb-2 font-semibold">
                닉네임
              </label>
              <input
                type="text"
                name="nickname"
                value={formData.nickname}
                readOnly={true} // 읽기 전용으로 설정
                className="w-full bg-slate-700 border border-slate-600 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-not-allowed opacity-75"
              />
              <p className="text-slate-400 text-sm mt-1">
                배틀넷 계정의 배틀태그가 닉네임으로 사용됩니다. 변경할 수 없습니다.
              </p>
            </div>
            
            <div className="mb-6">
              <label className="block text-white mb-2 font-semibold">
                선호하는 역할 (여러 개 선택 가능)
              </label>
              <div className="flex flex-wrap gap-2">
                {ROLES.map(role => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleRoleToggle(role)}
                    className={`
                      px-4 py-2 rounded-md transition
                      ${formData.preferredRoles.includes(role)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}
                    `}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-white mb-2 font-semibold">
                주요 영웅 (최대 5개)
              </label>
              
              {/* 역할별 탭 */}
              <div className="flex flex-wrap mb-3 border-b border-slate-600">
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`px-4 py-2 rounded-tl-md rounded-tr-md transition ${
                    activeTab === 'all' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  전체 영웅
                </button>
                
                {ROLES.map(role => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setActiveTab(role)}
                    className={`px-4 py-2 rounded-tl-md rounded-tr-md transition ${
                      activeTab === role
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
              
              {/* 선택된 영웅 표시 */}
              {formData.favoriteHeroes.length > 0 && (
                <div className="mb-3 p-3 bg-indigo-900/30 rounded-md">
                  <p className="font-semibold mb-2">선택된 영웅:</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.favoriteHeroes.map(hero => {
                      const heroData = ALL_HEROES.find(h => h.name === hero);
                      return (
                        <div key={hero} className="flex items-center bg-indigo-600 text-white px-3 py-1 rounded-full">
                          <div className="flex items-center">
                            <img 
                              src={heroData?.iconUrl} 
                              alt={hero} 
                              className="w-6 h-6 rounded-full mr-1"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://static.heroesofthestorm.com/heroes/default/icon.png';
                              }}
                            />
                            <span>{hero}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleHeroToggle(hero)}
                            className="ml-2 text-white hover:text-red-300"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* 영웅 선택 그리드 */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-80 overflow-y-auto p-2 bg-slate-700 rounded-md">
                {getFilteredHeroes().map(hero => {
                  const isSelected = formData.favoriteHeroes.includes(hero.name);
                  const isDisabled = !isSelected && formData.favoriteHeroes.length >= 5;
                  
                  return (
                    <button
                      key={hero.name}
                      type="button"
                      onClick={() => handleHeroToggle(hero.name)}
                      disabled={isDisabled}
                      className={`
                        p-2 rounded-md transition flex flex-col items-center justify-center
                        ${isSelected
                          ? 'bg-indigo-600 text-white'
                          : isDisabled
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-600'}
                      `}
                    >
                      <img 
                        src={hero.iconUrl} 
                        alt={hero.name}
                        className="w-12 h-12 rounded-full mb-1"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://static.heroesofthestorm.com/heroes/default/icon.png';
                        }}
                      />
                      <span className="text-xs text-center">{hero.name}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-slate-400 text-sm mt-1">
                선택된 영웅: {formData.favoriteHeroes.length}/5
              </p>
            </div>
            
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={isLoading}
                className={`
                  w-full max-w-md py-3 rounded-md font-semibold text-white transition
                  ${isLoading
                    ? 'bg-indigo-800 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700'}
                `}
              >
                {isLoading ? '저장 중...' : '프로필 저장하기'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetupPage; 