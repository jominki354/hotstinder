// 히어로즈 오브 더 스톰 한국어 공식 번역 매핑

// 영웅 이름 번역 매핑 (영어 -> 한국어)
const HERO_TRANSLATIONS = {
  // 암살자 (Assassin)
  'Alarak': '알라라크',
  'Azmodan': '아즈모단',
  'Cassia': '카시아',
  'Chromie': '크로미',
  'Falstad': '폴스타드',
  'Fenix': '피닉스',
  'Genji': '겐지',
  'Greymane': '그레이메인',
  'Gul\'dan': '굴단',
  'Hanzo': '한조',
  'Hogger': '들창코',
  'Illidan': '일리단',
  'Jaina': '제이나',
  'Kael\'thas': '캘타스',
  'Kel\'Thuzad': '켈투자드',
  'Kerrigan': '케리건',
  'Li-Ming': '리밍',
  'Lunara': '루나라',
  'Maiev': '마이에브',
  'Mephisto': '메피스토',
  'Nazeebo': '나지보',
  'Nova': '노바',
  'Orphea': '오르피아',
  'Probius': '프로비우스',
  'Qhira': '키히라',
  'Raynor': '레이너',
  'Sylvanas': '실바나스',
  'Tracer': '트레이서',
  'Tychus': '타이커스',
  'Valla': '발라',
  'Zagara': '자가라',
  'Zeratul': '제라툴',
  'Zul\'jin': '줄진',

  // 전사 (Warrior)
  'Anub\'arak': '아눕아락',
  'Arthas': '아서스',
  'Blaze': '블레이즈',
  'Chen': '첸',
  'Cho': '초',
  'Dehaka': '데하카',
  'Diablo': '디아블로',
  'D.Va': 'D.Va',
  'E.T.C.': '정예 타우렌 족장',
  'Garrosh': '가로쉬',
  'Imperius': '임페리우스',
  'Johanna': '요한나',
  'Leoric': '레오릭',
  'Mal\'Ganis': '말가니스',
  'Malthael': '말티엘',
  'Mei': '메이',
  'Muradin': '무라딘',
  'Ragnaros': '라그나로스',
  'Rexxar': '렉사르',
  'Sonya': '소냐',
  'Stitches': '누더기',
  'The Butcher': '도살자',
  'Thrall': '스랄',
  'Tyrael': '티리엘',
  'Varian': '바리안',
  'Xul': '줄',
  'Yrel': '이렐',
  'Artanis': '아르타니스',
  'Deathwing': '데스윙',

  // 지원가 (Support)
  'Alexstrasza': '알렉스트라자',
  'Ana': '아나',
  'Anduin': '안두인',
  'Auriel': '아우리엘',
  'Brightwing': '빛나래',
  'Deckard': '데커드',
  'Kharazim': '카라짐',
  'Li Li': '리 리',
  'Lt. Morales': '모랄레스 중위',
  'Lucio': '루시우',
  'Malfurion': '말퓨리온',
  'Rehgar': '레가르',
  'Stukov': '스투코프',
  'Tyrande': '티란데',
  'Uther': '우서',
  'Whitemane': '화이트메인',

  // 전문가 (Specialist)
  'Abathur': '아바투르',
  'Gazlowe': '가즈로',
  'Medivh': '메디브',
  'Murky': '머키',
  'Sgt. Hammer': '해머 상사',
  'The Lost Vikings': '더 로스트 바이킹',
  'Tassadar': '타사다르',
  'Zarya': '자리야',
  'Vikhr': '비크르'
};

// 전장 이름 번역 매핑 (영어 -> 한국어)
const MAP_TRANSLATIONS = {
  'Cursed Hollow': '저주받은 골짜기',
  'Dragon Shire': '용의 둥지',
  'Blackheart\'s Bay': '검은심장 만',
  'Garden of Terror': '공포의 정원',
  'Haunted Mines': '유령 광산',
  'Sky Temple': '하늘 사원',
  'Tomb of the Spider Queen': '거미 여왕의 무덤',
  'Battlefield of Eternity': '영원의 전쟁터',
  'Infernal Shrines': '불지옥 신단',
  'Towers of Doom': '파멸의 탑',
  'Braxis Holdout': '브락시스 항전',
  'Warhead Junction': '핵탄두 격전지',
  'Hanamura Temple': '하나무라 사원',
  'Volskaya Foundry': '볼스카야 공장',
  'Alterac Pass': '알터랙 고개',
  'Hanamura': '하나무라',
  'Volskaya': '볼스카야'
};

// 역할 번역 매핑 (영어 -> 한국어)
const ROLE_TRANSLATIONS = {
  'Tank': '탱커',
  'Bruiser': '브루저',
  'Melee Assassin': '근접 암살자',
  'Ranged Assassin': '원거리 암살자',
  'Healer': '힐러',
  'Support': '지원가',
  'Specialist': '특수병',
  'Warrior': '전사',
  'Assassin': '암살자'
};

// 영웅 이름을 한국어로 번역하는 함수
const translateHeroName = (heroName) => {
  if (!heroName) return '알 수 없음';
  
  // 이미 한국어인 경우 그대로 반환
  if (HERO_TRANSLATIONS[heroName]) {
    return HERO_TRANSLATIONS[heroName];
  }
  
  // 영어 이름을 찾아서 번역
  const koreanName = Object.values(HERO_TRANSLATIONS).find(korean => korean === heroName);
  if (koreanName) {
    return koreanName;
  }
  
  // 번역이 없으면 원본 반환
  return heroName;
};

// 전장 이름을 한국어로 번역하는 함수
const translateMapName = (mapName) => {
  if (!mapName) return '알 수 없음';
  
  // 이미 한국어인 경우 그대로 반환
  if (MAP_TRANSLATIONS[mapName]) {
    return MAP_TRANSLATIONS[mapName];
  }
  
  // 영어 이름을 찾아서 번역
  const koreanName = Object.values(MAP_TRANSLATIONS).find(korean => korean === mapName);
  if (koreanName) {
    return koreanName;
  }
  
  // 번역이 없으면 원본 반환
  return mapName;
};

// 역할 이름을 한국어로 번역하는 함수
const translateRoleName = (roleName) => {
  if (!roleName) return '알 수 없음';
  
  // 이미 한국어인 경우 그대로 반환
  if (ROLE_TRANSLATIONS[roleName]) {
    return ROLE_TRANSLATIONS[roleName];
  }
  
  // 영어 이름을 찾아서 번역
  const koreanName = Object.values(ROLE_TRANSLATIONS).find(korean => korean === roleName);
  if (koreanName) {
    return koreanName;
  }
  
  // 번역이 없으면 원본 반환
  return roleName;
};

// 모든 번역 함수를 한 번에 적용하는 유틸리티 함수
const translateGameData = (gameData) => {
  if (!gameData) return gameData;
  
  const translated = { ...gameData };
  
  // 전장 이름 번역
  if (translated.map) {
    translated.map = translateMapName(translated.map);
  }
  
  // 플레이어 영웅 이름 번역
  if (translated.players) {
    if (Array.isArray(translated.players)) {
      translated.players = translated.players.map(player => ({
        ...player,
        hero: translateHeroName(player.hero),
        role: translateRoleName(player.role)
      }));
    } else if (typeof translated.players === 'object') {
      // 팀별로 구분된 경우
      Object.keys(translated.players).forEach(team => {
        if (Array.isArray(translated.players[team])) {
          translated.players[team] = translated.players[team].map(player => ({
            ...player,
            hero: translateHeroName(player.hero),
            role: translateRoleName(player.role)
          }));
        }
      });
    }
  }
  
  // 블루팀/레드팀 플레이어 번역
  if (translated.bluePlayers) {
    translated.bluePlayers = translated.bluePlayers.map(player => ({
      ...player,
      hero: translateHeroName(player.hero),
      role: translateRoleName(player.role)
    }));
  }
  
  if (translated.redPlayers) {
    translated.redPlayers = translated.redPlayers.map(player => ({
      ...player,
      hero: translateHeroName(player.hero),
      role: translateRoleName(player.role)
    }));
  }
  
  return translated;
};

module.exports = {
  HERO_TRANSLATIONS,
  MAP_TRANSLATIONS,
  ROLE_TRANSLATIONS,
  translateHeroName,
  translateMapName,
  translateRoleName,
  translateGameData
}; 