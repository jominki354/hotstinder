const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// MongoDB 연결 함수
const connectMongoDB = async () => {
  if (mongoose.connections[0].readyState) {
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB 연결 성공');
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
  spectators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  chat: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: String,
    timestamp: { type: Date, default: Date.now }
  }],
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

// 인증 미들웨어
const authenticate = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('인증 토큰이 필요합니다');
  }

  const token = authHeader.substring(7);
  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');

  // 사용자 정보 조회
  const user = await User.findById(decoded.id);
  if (!user) {
    throw new Error('사용자를 찾을 수 없습니다');
  }

  return user;
};

module.exports = async function handler(req, res) {
  try {
    console.log('Vercel /api/matches 요청 처리:', req.method, req.url);

    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'https://hotstinder.vercel.app');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // OPTIONS 요청 처리
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // MongoDB 연결
    await connectMongoDB();

    const { pathname } = new URL(req.url, `http://${req.headers.host}`);
    const pathParts = pathname.split('/').filter(Boolean);

    // GET /api/matches - 매치 목록 조회
    if (req.method === 'GET' && pathParts.length === 2) {
      try {
        const user = await authenticate(req);

        const { status = 'open', page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        // 쿼리 생성
        const query = {};
        if (status !== 'all') {
          query.status = status;
        }

        // 매치 조회
        const matches = await Match.find(query)
          .populate('createdBy', 'battleTag nickname profilePicture')
          .sort('-createdAt')
          .skip(skip)
          .limit(parseInt(limit));

        // 총 매치 수 조회
        const totalMatches = await Match.countDocuments(query);

        console.log(`매치 목록 조회 완료: ${matches.length}개, 총 ${totalMatches}개`);

        return res.json({
          matches,
          pagination: {
            total: totalMatches,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalMatches / limit)
          }
        });
      } catch (err) {
        console.error('매치 목록 조회 오류:', err);
        return res.status(500).json({ message: '매치 목록 조회에 실패했습니다' });
      }
    }

    // POST /api/matches - 새 매치 생성
    if (req.method === 'POST' && pathParts.length === 2) {
      try {
        const user = await authenticate(req);

        const {
          title, description, gameMode, maxPlayers,
          map, isPrivate, password, balanceType, scheduledTime
        } = req.body;

        // 매치 객체 생성
        const newMatch = new Match({
          title,
          description,
          createdBy: user._id,
          gameMode,
          maxPlayers: maxPlayers || 10,
          map,
          isPrivate: isPrivate || false,
          password: isPrivate ? password : null,
          balanceType: balanceType || 'mmr',
          scheduledTime: scheduledTime || Date.now()
        });

        // 생성자를 첫 번째 참가자로 등록
        newMatch.teams.blue.push({ user: user._id });

        // 매치 저장
        await newMatch.save();

        // 생성된 매치 반환
        const populatedMatch = await Match.findById(newMatch._id)
          .populate('createdBy', 'battleTag nickname profilePicture')
          .populate('teams.blue.user', 'battleTag nickname profilePicture')
          .populate('teams.red.user', 'battleTag nickname profilePicture');

        console.log(`새 매치 생성 완료: ${newMatch._id}`);
        return res.status(201).json(populatedMatch);
      } catch (err) {
        console.error('매치 생성 오류:', err);
        return res.status(500).json({ message: '매치 생성에 실패했습니다' });
      }
    }

    // GET /api/matches/:id - 특정 매치 정보 조회
    if (req.method === 'GET' && pathParts.length === 3) {
      try {
        const user = await authenticate(req);
        const matchId = pathParts[2];

        const match = await Match.findById(matchId)
          .populate('createdBy', 'battleTag nickname profilePicture')
          .populate('teams.blue.user', 'battleTag nickname profilePicture')
          .populate('teams.red.user', 'battleTag nickname profilePicture')
          .populate('spectators', 'battleTag nickname profilePicture')
          .populate('chat.user', 'battleTag nickname profilePicture');

        if (!match) {
          return res.status(404).json({ message: '매치를 찾을 수 없습니다' });
        }

        // 비공개 매치인 경우 접근 권한 확인
        if (match.isPrivate) {
          const isCreator = match.createdBy._id.toString() === user._id.toString();
          const isParticipant =
            match.teams.blue.some(p => p.user._id.toString() === user._id.toString()) ||
            match.teams.red.some(p => p.user._id.toString() === user._id.toString()) ||
            match.spectators.some(s => s._id.toString() === user._id.toString());

          if (!isCreator && !isParticipant) {
            return res.status(403).json({ message: '비공개 매치에 접근할 권한이 없습니다' });
          }
        }

        console.log(`매치 상세 조회 완료: ${matchId}`);
        return res.json(match);
      } catch (err) {
        console.error('매치 조회 오류:', err);
        return res.status(500).json({ message: '매치 정보 조회에 실패했습니다' });
      }
    }

    // PUT /api/matches/:id/join - 매치 참가
    if (req.method === 'PUT' && pathParts.length === 4 && pathParts[3] === 'join') {
      try {
        const user = await authenticate(req);
        const matchId = pathParts[2];
        const { team, role, password } = req.body;

        const match = await Match.findById(matchId);
        if (!match) {
          return res.status(404).json({ message: '매치를 찾을 수 없습니다' });
        }

        // 매치 상태 확인
        if (match.status !== 'open') {
          return res.status(400).json({ message: '참가할 수 없는 매치입니다' });
        }

        // 비공개 매치 비밀번호 확인
        if (match.isPrivate && match.password !== password) {
          return res.status(403).json({ message: '비밀번호가 일치하지 않습니다' });
        }

        // 이미 참가한 사용자인지 확인
        const isAlreadyInBlue = match.teams.blue.some(p => p.user.toString() === user._id.toString());
        const isAlreadyInRed = match.teams.red.some(p => p.user.toString() === user._id.toString());

        if (isAlreadyInBlue || isAlreadyInRed) {
          return res.status(400).json({ message: '이미 이 매치에 참가하고 있습니다' });
        }

        // 팀 선택 (자동 밸런싱 또는 수동 선택)
        let targetTeam = team;
        if (!targetTeam || targetTeam === 'auto') {
          // 자동 밸런싱: 플레이어 수가 적은 팀에 배정
          targetTeam = match.teams.blue.length <= match.teams.red.length ? 'blue' : 'red';
        }

        // 팀 인원 수 확인
        const currentTeamSize = match.teams[targetTeam].length;
        const maxTeamSize = Math.floor(match.maxPlayers / 2);

        if (currentTeamSize >= maxTeamSize) {
          return res.status(400).json({ message: '해당 팀이 가득 찼습니다' });
        }

        // 플레이어 추가
        match.teams[targetTeam].push({
          user: user._id,
          role: role || '미정',
          joinedAt: new Date()
        });

        // 매치가 가득 찬 경우 상태 변경
        const totalPlayers = match.teams.blue.length + match.teams.red.length;
        if (totalPlayers >= match.maxPlayers) {
          match.status = 'full';
        }

        await match.save();

        // 업데이트된 매치 반환
        const updatedMatch = await Match.findById(matchId)
          .populate('createdBy', 'battleTag nickname profilePicture')
          .populate('teams.blue.user', 'battleTag nickname profilePicture')
          .populate('teams.red.user', 'battleTag nickname profilePicture');

        console.log(`매치 참가 완료: ${user.nickname} -> ${matchId} (${targetTeam}팀)`);
        return res.json(updatedMatch);
      } catch (err) {
        console.error('매치 참가 오류:', err);
        return res.status(500).json({ message: '매치 참가에 실패했습니다' });
      }
    }

    // PUT /api/matches/:id/leave - 매치 떠나기
    if (req.method === 'PUT' && pathParts.length === 4 && pathParts[3] === 'leave') {
      try {
        const user = await authenticate(req);
        const matchId = pathParts[2];

        const match = await Match.findById(matchId);
        if (!match) {
          return res.status(404).json({ message: '매치를 찾을 수 없습니다' });
        }

        // 매치 상태 확인
        if (match.status !== 'open' && match.status !== 'full') {
          return res.status(400).json({ message: '떠날 수 없는 매치입니다' });
        }

        // 플레이어 제거
        const blueIndex = match.teams.blue.findIndex(p => p.user.toString() === user._id.toString());
        const redIndex = match.teams.red.findIndex(p => p.user.toString() === user._id.toString());

        if (blueIndex !== -1) {
          match.teams.blue.splice(blueIndex, 1);
        } else if (redIndex !== -1) {
          match.teams.red.splice(redIndex, 1);
        } else {
          return res.status(400).json({ message: '이 매치에 참가하고 있지 않습니다' });
        }

        // 매치 상태 업데이트
        const totalPlayers = match.teams.blue.length + match.teams.red.length;
        if (totalPlayers < match.maxPlayers && match.status === 'full') {
          match.status = 'open';
        }

        // 매치 생성자가 떠나는 경우 매치 취소
        if (match.createdBy.toString() === user._id.toString() && totalPlayers === 0) {
          match.status = 'cancelled';
        }

        await match.save();

        // 업데이트된 매치 반환
        const updatedMatch = await Match.findById(matchId)
          .populate('createdBy', 'battleTag nickname profilePicture')
          .populate('teams.blue.user', 'battleTag nickname profilePicture')
          .populate('teams.red.user', 'battleTag nickname profilePicture');

        console.log(`매치 떠나기 완료: ${user.nickname} <- ${matchId}`);
        return res.json(updatedMatch);
      } catch (err) {
        console.error('매치 떠나기 오류:', err);
        return res.status(500).json({ message: '매치 떠나기에 실패했습니다' });
      }
    }

    // 지원하지 않는 경로
    return res.status(404).json({ error: '요청한 리소스를 찾을 수 없습니다' });

  } catch (error) {
    console.error('/api/matches 오류:', error);

    if (error.message.includes('토큰') || error.message.includes('인증')) {
      return res.status(401).json({ error: error.message });
    } else {
      return res.status(500).json({ error: '서버 오류가 발생했습니다' });
    }
  }
};
