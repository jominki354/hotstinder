const mongoose = require('mongoose');

// MongoDB 연결 함수 (더 관대한 타임아웃 설정)
const connectMongoDB = async () => {
  if (mongoose.connections[0].readyState) {
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // 30초로 증가
      socketTimeoutMS: 60000, // 60초로 증가
      connectTimeoutMS: 30000, // 연결 타임아웃 30초
      maxPoolSize: 5, // 연결 풀 크기 줄임
      minPoolSize: 1, // 최소 연결 수 줄임
      maxIdleTimeMS: 60000, // 60초 후 유휴 연결 해제
      bufferCommands: false, // 연결 대기 중 명령 버퍼링 비활성화
      bufferMaxEntries: 0, // 버퍼 크기 제한
      retryWrites: true, // 재시도 활성화
      retryReads: true // 읽기 재시도 활성화
    });
    console.log('MongoDB 연결 성공 (관대한 타임아웃)');
  } catch (error) {
    console.error('MongoDB 연결 실패:', error);
    throw error;
  }
};

// Match 모델 정의
const matchSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['open', 'full', 'in_progress', 'completed', 'cancelled'],
    default: 'open'
  },
  gameMode: { type: String, default: 'ranked' },
  maxPlayers: { type: Number, default: 10 },
  map: String,
  isPrivate: { type: Boolean, default: false },
  password: String,
  balanceType: { type: String, default: 'mmr' },
  teams: {
    blue: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      role: String,
      hero: String,
      joinedAt: { type: Date, default: Date.now }
    }],
    red: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      role: String,
      hero: String,
      joinedAt: { type: Date, default: Date.now }
    }]
  },
  result: {
    winner: String, // 'blue', 'red', 또는 null
    blueScore: { type: Number, default: 0 },
    redScore: { type: Number, default: 0 },
    duration: { type: Number, default: 0 } // 초 단위
  },
  playerStats: [{
    userId: String,
    battletag: String,
    team: String,
    hero: String,
    kills: Number,
    deaths: Number,
    assists: Number,
    heroDamage: Number,
    siegeDamage: Number,
    healing: Number,
    experienceContribution: Number,
    mmrBefore: Number,
    mmrAfter: Number,
    mmrChange: Number
  }],
  mmrChanges: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    before: Number,
    after: Number,
    change: Number
  }],
  eventLog: [{
    timestamp: { type: Date, default: Date.now },
    type: String,
    message: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  isSimulation: { type: Boolean, default: false },
  originalMatchId: String,
  replayData: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  scheduledTime: { type: Date, default: Date.now }
});

const Match = mongoose.models.Match || mongoose.model('Match', matchSchema);

// User 모델 정의
const userSchema = new mongoose.Schema({
  bnetId: { type: String, required: true, unique: true },
  battletag: { type: String, required: true },
  nickname: { type: String, required: true },
  profilePicture: String,
  mmr: { type: Number, default: 1500 },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  preferredRoles: [{
    type: String,
    enum: ['탱커', '투사', '원거리 암살자', '근접 암살자', '지원가', '힐러', '서포터', '브루저', '전체']
  }],
  isAdmin: { type: Boolean, default: false },
  isDummy: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

// 맵 이름 번역 함수
const translateMapName = (mapName) => {
  const mapTranslations = {
    'Dragon Shire': '용의 둥지',
    'Cursed Hollow': '저주받은 골짜기',
    'Garden of Terror': '공포의 정원',
    'Sky Temple': '하늘 사원',
    'Tomb of the Spider Queen': '거미 여왕의 무덤',
    'Battlefield of Eternity': '영원의 전쟁터',
    'Infernal Shrines': '불지옥 신단',
    'Towers of Doom': '파멸의 탑',
    'Volskaya Foundry': '볼스카야 공장',
    'Alterac Pass': '알터랙 고개',
    'Blackheart\'s Bay': '검은심장 만',
    'Haunted Mines': '유령 광산',
    'Braxis Holdout': '브락시스 항전',
    'Warhead Junction': '핵탄두 격전지',
    'Hanamura Temple': '하나무라 사원'
  };
  return mapTranslations[mapName] || mapName;
};

// 영웅 이름 번역 함수
const translateHeroName = (heroName) => {
  const heroTranslations = {
    'Abathur': '아바투르',
    'Alarak': '알라라크',
    'Alexstrasza': '알렉스트라자',
    'Ana': '아나',
    'Anduin': '안두인',
    'Anub\'arak': '아눕아락',
    'Artanis': '아르타니스',
    'Arthas': '아서스',
    'Auriel': '아우리엘',
    'Azmodan': '아즈모단',
    'Blaze': '블레이즈',
    'Brightwing': '밝은날개',
    'Cassia': '카시아',
    'Chen': '첸',
    'Cho': '초',
    'Chromie': '크로미',
    'D.Va': '디바',
    'Deckard': '데커드',
    'Dehaka': '데하카',
    'Diablo': '디아블로',
    'E.T.C.': '정예 타우렌 족장',
    'Falstad': '팔스타드',
    'Fenix': '피닉스',
    'Gall': '갈',
    'Garrosh': '가로쉬',
    'Gazlowe': '가즐로',
    'Genji': '겐지',
    'Greymane': '그레이메인',
    'Gul\'dan': '굴단',
    'Hanzo': '한조',
    'Illidan': '일리단',
    'Imperius': '임페리우스',
    'Jaina': '제이나',
    'Johanna': '요한나',
    'Junkrat': '정크랫',
    'Kael\'thas': '캘타스',
    'Kel\'Thuzad': '켈투자드',
    'Kerrigan': '케리건',
    'Kharazim': '카라짐',
    'Leoric': '레오릭',
    'Li Li': '리리',
    'Li-Ming': '리밍',
    'Lt. Morales': '모랄레스 중위',
    'Lucio': '루시우',
    'Lunara': '루나라',
    'Maiev': '마이에브',
    'Mal\'Ganis': '말가니스',
    'Malfurion': '말퓨리온',
    'Malthael': '말티엘',
    'Medivh': '메디브',
    'Mephisto': '메피스토',
    'Muradin': '무라딘',
    'Murky': '머키',
    'Nazeebo': '나지보',
    'Nova': '노바',
    'Orphea': '오르피아',
    'Probius': '탐사정',
    'Qhira': '키라',
    'Ragnaros': '라그나로스',
    'Raynor': '레이너',
    'Rehgar': '렉가르',
    'Rexxar': '렉사르',
    'Samuro': '사무로',
    'Sgt. Hammer': '해머 상사',
    'Sonya': '소냐',
    'Stitches': '스티치스',
    'Stukov': '스투코프',
    'Sylvanas': '실바나스',
    'Tassadar': '태사다르',
    'The Butcher': '도살자',
    'The Lost Vikings': '길 잃은 바이킹',
    'Thrall': '스랄',
    'Tracer': '트레이서',
    'Tychus': '타이커스',
    'Tyrael': '티리엘',
    'Tyrande': '티란데',
    'Uther': '우서',
    'Valeera': '발리라',
    'Valla': '발라',
    'Varian': '바리안',
    'Whitemane': '화이트메인',
    'Xul': '줄',
    'Yrel': '이렐',
    'Zagara': '자가라',
    'Zarya': '자리야',
    'Zeratul': '제라툴',
    'Zuljin': '줄진'
  };
  return heroTranslations[heroName] || heroName;
};

module.exports = async function handler(req, res) {
  // 요청 타임아웃 설정 (Vercel Functions 최대 시간)
  const timeoutId = setTimeout(() => {
    if (!res.headersSent) {
      console.error('API 타임아웃 발생');
      res.status(504).json({
        error: '요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.',
        timeout: true
      });
    }
  }, 25000); // 25초 타임아웃

  try {
    console.log('Vercel /api/matchmaking 요청 처리:', req.method, req.url);

    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'https://hotstinder.vercel.app');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // OPTIONS 요청 처리
    if (req.method === 'OPTIONS') {
      clearTimeout(timeoutId);
      return res.status(200).end();
    }

    // MongoDB 연결 (타임아웃 포함)
    console.log('MongoDB 연결 시도 중...');
    await Promise.race([
      connectMongoDB(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('MongoDB 연결 타임아웃')), 15000)
      )
    ]);
    console.log('MongoDB 연결 완료');

    const { pathname } = new URL(req.url, `http://${req.headers.host}`);
    const pathParts = pathname.split('/').filter(Boolean);

    // /api/matchmaking/recent-games
    if (pathParts[2] === 'recent-games' && req.method === 'GET') {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 30;
      const skip = (page - 1) * limit;

      try {
        // 전체 완료된 게임 수 조회
        const totalCount = await Match.countDocuments({ status: 'completed' });

        // 페이지네이션을 적용한 쿼리
        const recentGames = await Match.find({ status: 'completed' })
          .sort({ scheduledTime: -1 })
          .skip(skip)
          .limit(limit)
          .populate('teams.blue.user', 'battleTag nickname mmr battletag')
          .populate('teams.red.user', 'battleTag nickname mmr battletag');

        // 전체 게임 수를 헤더에 추가
        res.set('X-Total-Count', totalCount.toString());

        // 클라이언트에 맞는 형식으로 변환
        const formattedGames = recentGames.map(game => {
          // 게임 시간 형식화
          const gameDate = new Date(game.scheduledTime || Date.now());
          const formattedDate = `${gameDate.getFullYear()}년 ${gameDate.getMonth() + 1}월 ${gameDate.getDate()}일`;
          const hours = gameDate.getHours().toString().padStart(2, '0');
          const minutes = gameDate.getMinutes().toString().padStart(2, '0');
          const formattedTime = `${hours}:${minutes}`;

          // 게임 시간 형식화 (분:초)
          const duration = game.result?.duration || 0;
          const durationMinutes = Math.floor(duration / 60);
          const durationSeconds = duration % 60;
          const formattedDuration = `${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}`;

          // 팀 구성 확인 및 변환
          const blueTeam = Array.isArray(game.teams?.blue) ? game.teams.blue : [];
          const redTeam = Array.isArray(game.teams?.red) ? game.teams.red : [];

          // playerStats 배열에서 통계 데이터 가져오기
          const playerStats = Array.isArray(game.playerStats) ? game.playerStats : [];

          // 플레이어 통계를 battletag로 매핑하는 함수
          const getPlayerStats = (battletag, team) => {
            const stats = playerStats.find(stat =>
              stat.battletag === battletag && stat.team === team
            );
            return stats || {};
          };

          // 평균 MMR 계산 함수
          const calcAvgMmr = (teamPlayers) => {
            if (!teamPlayers || teamPlayers.length === 0) return 1500;
            const validPlayers = teamPlayers.filter(p => p.user && p.user.mmr);
            if (validPlayers.length === 0) return 1500;
            const totalMmr = validPlayers.reduce((sum, p) => sum + (p.user.mmr || 1500), 0);
            return Math.round(totalMmr / validPlayers.length);
          };

          // 플레이어 정보 변환 함수
          const formatPlayers = (teamPlayers, teamName) => {
            if (!teamPlayers || !Array.isArray(teamPlayers)) return [];

            return teamPlayers.map(player => {
              const userInfo = player.user;
              const nickname = userInfo?.nickname ||
                (userInfo?.battletag ? userInfo.battletag.split('#')[0] :
                  (userInfo?.battleTag ? userInfo.battleTag.split('#')[0] : '알 수 없음'));

              // playerStats에서 해당 플레이어의 통계 찾기
              const battletag = userInfo?.battletag || userInfo?.battleTag;
              const stats = battletag ? getPlayerStats(battletag, teamName) : {};

              return {
                id: userInfo?._id || 'unknown',
                nickname: nickname,
                role: player.role || '알 수 없음',
                hero: translateHeroName(stats?.hero) || translateHeroName(player.hero) || '알 수 없음',
                kills: stats?.kills || 0,
                deaths: stats?.deaths || 0,
                assists: stats?.assists || 0,
                heroDamage: stats?.heroDamage || 0,
                siegeDamage: stats?.siegeDamage || 0,
                healing: stats?.healing || 0,
                experienceContribution: stats?.experienceContribution || 0,
                mmrBefore: stats?.mmrBefore || 1500,
                mmrAfter: stats?.mmrAfter || 1500,
                mmrChange: stats?.mmrChange || 0
              };
            });
          };

          // 시뮬레이션 매치인지 확인
          const isSimulationMatch = game.isSimulation ||
            (playerStats.length > 0 && playerStats.some(p => p.userId && p.userId.startsWith('sim_')));

          // 시뮬레이션 매치 처리
          if (isSimulationMatch) {
            const blueTeamStats = playerStats.filter(p => p.team === 'blue');
            const redTeamStats = playerStats.filter(p => p.team === 'red');

            const formatSimulationPlayers = (teamStats) => {
              return teamStats.map(stat => ({
                id: stat.userId || 'sim-unknown',
                nickname: stat.battletag ? stat.battletag.split('#')[0] : '시뮬레이션 플레이어',
                role: '알 수 없음',
                hero: translateHeroName(stat.hero) || '알 수 없음',
                kills: stat.kills || 0,
                deaths: stat.deaths || 0,
                assists: stat.assists || 0,
                heroDamage: stat.heroDamage || 0,
                siegeDamage: stat.siegeDamage || 0,
                healing: stat.healing || 0,
                experienceContribution: stat.experienceContribution || 0,
                mmrBefore: stat.mmrBefore || 1500,
                mmrAfter: stat.mmrAfter || 1500,
                mmrChange: stat.mmrChange || 0
              }));
            };

            const blueTeamAvgMmr = blueTeamStats.length > 0
              ? Math.round(blueTeamStats.reduce((sum, p) => sum + (p.mmrBefore || 1500), 0) / blueTeamStats.length)
              : 1500;

            const redTeamAvgMmr = redTeamStats.length > 0
              ? Math.round(redTeamStats.reduce((sum, p) => sum + (p.mmrBefore || 1500), 0) / redTeamStats.length)
              : 1500;

            return {
              id: game._id,
              title: game.title || '시뮬레이션 매치',
              map: translateMapName(game.map) || '알 수 없는 맵',
              gameMode: '시뮬레이션',
              date: formattedDate,
              time: formattedTime,
              duration: formattedDuration,
              winner: game.result?.winner || 'none',
              blueTeam: {
                name: '블루팀 (시뮬레이션)',
                avgMmr: blueTeamAvgMmr,
                players: formatSimulationPlayers(blueTeamStats)
              },
              redTeam: {
                name: '레드팀 (시뮬레이션)',
                avgMmr: redTeamAvgMmr,
                players: formatSimulationPlayers(redTeamStats)
              }
            };
          }

          // 일반 매치 처리
          const blueTeamName = blueTeam.length > 0 ? '블루팀' : '블루팀 (빈 팀)';
          const redTeamName = redTeam.length > 0 ? '레드팀' : '레드팀 (빈 팀)';

          return {
            id: game._id,
            title: game.title || '알 수 없는 매치',
            map: translateMapName(game.map) || '알 수 없는 맵',
            gameMode: game.gameMode || '일반 게임',
            date: formattedDate,
            time: formattedTime,
            duration: formattedDuration,
            winner: game.result?.winner || 'none',
            blueTeam: {
              name: blueTeamName,
              avgMmr: calcAvgMmr(blueTeam),
              players: formatPlayers(blueTeam, 'blue')
            },
            redTeam: {
              name: redTeamName,
              avgMmr: calcAvgMmr(redTeam),
              players: formatPlayers(redTeam, 'red')
            }
          };
        });

        console.log(`최근 게임 ${formattedGames.length}개 반환 (총 ${totalCount}개)`);
        return res.json(formattedGames);
      } catch (err) {
        console.error('최근 게임 조회 오류:', err);
        return res.json([]);
      }
    }

    // 지원하지 않는 경로
    return res.status(404).json({ error: '요청한 리소스를 찾을 수 없습니다' });

  } catch (error) {
    console.error('/api/matchmaking 오류:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
};
