const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

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

// MMR 기반 티어 계산
const getTier = (mmr) => {
  if (mmr >= 2500) return '그랜드마스터';
  if (mmr >= 2200) return '마스터';
  if (mmr >= 2000) return '다이아몬드';
  if (mmr >= 1800) return '플래티넘';
  if (mmr >= 1600) return '골드';
  if (mmr >= 1400) return '실버';
  return '브론즈';
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
    console.log('Vercel /api/users 요청 처리:', req.method, req.url);

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

    // /api/users/leaderboard
    if (pathParts[2] === 'leaderboard' && req.method === 'GET') {
      const { minGames = 1, limit = 100 } = req.query;
      const minGamesNum = parseInt(minGames);
      const limitNum = parseInt(limit);

      try {
        console.log('리더보드 데이터 조회 시작...');

        // MongoDB에서 사용자 데이터 가져오기 (타임아웃 포함)
        const users = await Promise.race([
          User.find({}).lean().exec(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('사용자 조회 타임아웃')), 10000)
          )
        ]);

        console.log(`사용자 데이터 조회 완료: ${users ? users.length : 0}명`);

        if (!users || users.length === 0) {
          console.warn('리더보드에 표시할 사용자 데이터가 없습니다');
          clearTimeout(timeoutId);
          return res.json([]);
        }

        console.log(`리더보드용 사용자 ${users.length}명 조회됨`);

        // 유효한 사용자만 필터링 (최소 게임 수 이상)
        let filteredUsers = users.filter(user => {
          const totalGames = (user.wins || 0) + (user.losses || 0);
          return totalGames >= minGamesNum;
        });

        // MMR 기준으로 정렬
        filteredUsers.sort((a, b) => (b.mmr || 0) - (a.mmr || 0));

        // 제한된 수의 사용자만 반환
        filteredUsers = filteredUsers.slice(0, limitNum);

        // 리더보드 정보로 변환
        const leaderboard = filteredUsers.map((user, index) => {
          const wins = user.wins || 0;
          const losses = user.losses || 0;
          const totalGames = wins + losses;
          const winRate = totalGames > 0 ? ((wins / totalGames) * 100).toFixed(1) : '0.0';

          const btag = user.battletag || user.battleTag || '';
          let mainRole = '없음';
          if (user.preferredRoles && Array.isArray(user.preferredRoles) && user.preferredRoles.length > 0) {
            mainRole = user.preferredRoles[0];
          }

          const mmr = user.mmr || 1500;
          const tier = getTier(mmr);
          const isDummy = user.isDummy || false;

          return {
            rank: index + 1,
            id: user._id || `user-${index}`,
            nickname: user.nickname || (btag ? btag.split('#')[0] : `유저${index+1}`),
            battletag: btag,
            mmr: mmr,
            wins: wins,
            losses: losses,
            winRate: parseFloat(winRate),
            mainRole: mainRole,
            tier: tier,
            totalGames: totalGames,
            isDummy: isDummy
          };
        });

        console.log(`리더보드 데이터 ${leaderboard.length}개 반환`);
        clearTimeout(timeoutId);
        return res.json(leaderboard);
      } catch (err) {
        console.error('리더보드 조회 오류:', err);
        clearTimeout(timeoutId);

        if (err.message.includes('타임아웃')) {
          return res.status(504).json({
            error: '데이터베이스 응답이 느립니다. 잠시 후 다시 시도해주세요.',
            timeout: true
          });
        }

        return res.json([]);
      }
    }

    // /api/users/all
    if (pathParts[2] === 'all' && req.method === 'GET') {
      const { limit = 100 } = req.query;
      const limitNum = parseInt(limit);

      try {
        console.log('전체 사용자 데이터 조회 시작...');

        // MongoDB에서 모든 사용자 데이터 가져오기 (타임아웃 포함)
        const users = await Promise.race([
          User.find({}).lean().exec(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('사용자 조회 타임아웃')), 10000)
          )
        ]);

        console.log(`전체 사용자 데이터 조회 완료: ${users ? users.length : 0}명`);

        if (!users || users.length === 0) {
          console.warn('전체 사용자 데이터가 없습니다');
          clearTimeout(timeoutId);
          return res.json([]);
        }

        console.log(`전체 사용자 ${users.length}명 조회됨`);

        // MMR 기준으로 정렬
        users.sort((a, b) => (b.mmr || 0) - (a.mmr || 0));

        // 제한된 수의 사용자만 반환
        const limitedUsers = users.slice(0, limitNum);

        // 사용자 정보로 변환
        const allUsers = limitedUsers.map((user, index) => {
          const wins = user.wins || 0;
          const losses = user.losses || 0;
          const totalGames = wins + losses;
          const winRate = totalGames > 0 ? ((wins / totalGames) * 100).toFixed(1) : '0.0';

          const btag = user.battletag || user.battleTag || '';
          let mainRole = '없음';
          if (user.preferredRoles && Array.isArray(user.preferredRoles) && user.preferredRoles.length > 0) {
            mainRole = user.preferredRoles[0];
          }

          const mmr = user.mmr || 1500;
          const tier = getTier(mmr);
          const isDummy = user.isDummy || false;

          return {
            rank: index + 1,
            id: user._id || `user-${index}`,
            nickname: user.nickname || (btag ? btag.split('#')[0] : `유저${index+1}`),
            battletag: btag,
            mmr: mmr,
            wins: wins,
            losses: losses,
            winRate: parseFloat(winRate),
            mainRole: mainRole,
            tier: tier,
            totalGames: totalGames,
            isDummy: isDummy
          };
        });

        console.log(`전체 사용자 데이터 ${allUsers.length}개 반환`);
        clearTimeout(timeoutId);
        return res.json(allUsers);
      } catch (err) {
        console.error('전체 사용자 조회 오류:', err);
        clearTimeout(timeoutId);

        if (err.message.includes('타임아웃')) {
          return res.status(504).json({
            error: '데이터베이스 응답이 느립니다. 잠시 후 다시 시도해주세요.',
            timeout: true
          });
        }

        return res.json([]);
      }
    }

    // 기본 사용자 정보 조회 (GET /api/users)
    if (req.method === 'GET' && pathParts.length === 2) {
      try {
        const users = await User.find({}).select('-__v').lean();
        console.log(`사용자 목록 조회 완료: ${users.length}명`);
        return res.json(users);
      } catch (err) {
        console.error('사용자 목록 조회 오류:', err);
        return res.status(500).json({ error: '사용자 목록 조회에 실패했습니다' });
      }
    }

    // 기본 사용자 목록 (경로가 매치되지 않는 경우)
    if (req.method === 'GET') {
      try {
        console.log('기본 사용자 목록 조회 시작...');

        const users = await Promise.race([
          User.find({}).limit(50).lean().exec(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('사용자 조회 타임아웃')), 10000)
          )
        ]);

        console.log(`기본 사용자 목록 조회 완료: ${users ? users.length : 0}명`);
        clearTimeout(timeoutId);
        return res.json(users || []);
      } catch (err) {
        console.error('기본 사용자 목록 조회 오류:', err);
        clearTimeout(timeoutId);

        if (err.message.includes('타임아웃')) {
          return res.status(504).json({
            error: '데이터베이스 응답이 느립니다. 잠시 후 다시 시도해주세요.',
            timeout: true
          });
        }

        return res.json([]);
      }
    }

    // 지원하지 않는 메서드
    clearTimeout(timeoutId);
    return res.status(405).json({ error: '지원하지 않는 메서드입니다' });

  } catch (error) {
    clearTimeout(timeoutId);
    console.error('API 오류:', error);

    if (error.message.includes('타임아웃')) {
      return res.status(504).json({
        error: '데이터베이스 연결이 느립니다. 잠시 후 다시 시도해주세요.',
        timeout: true
      });
    }

    return res.status(500).json({
      error: '서버 오류가 발생했습니다',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
