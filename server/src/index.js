require('dotenv').config();
const express = require('express');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const matchRoutes = require('./routes/match.routes');
const matchmakingRoutes = require('./routes/matchmaking.routes');
const adminRoutes = require('./routes/admin.routes');
const configPassport = require('./config/passport');
const { createServer } = require('http');
const { setupSocketIO } = require('./socket');
const BnetStrategy = require('passport-bnet').Strategy;
const UserModel = require('./models/NeDBUser');
const fs = require('fs');
const path = require('path');

// 메모리 사용자 저장소 초기화 (NeDB를 사용하지 않을 경우)
const memoryUsers = new Map();

// NeDB 사용 설정 - 환경 변수에서 값을 읽어옴
global.useNeDB = process.env.USE_NEDB === 'true';
console.log(`데이터 저장소: ${global.useNeDB ? 'NeDB' : 'Memory Store'} 사용 중`);

// 앱 초기화
const app = express();
const httpServer = createServer(app);

// 미들웨어 설정
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.SESSION_SECRET || 'hotstinder-secret'));

// 세션 설정
app.use(session({
  store: new MemoryStore({
    checkPeriod: 86400000 // 24시간마다 만료된 세션 정리
  }),
  secret: process.env.SESSION_SECRET || 'hotstinder-secret',
  resave: true,
  saveUninitialized: true,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000, // 24시간
    httpOnly: true
  }
}));

// 디버깅 미들웨어 - 모든 요청에 대한 세션 정보 로깅
app.use((req, res, next) => {
  console.log('\n--- 새 요청 ---');
  console.log('요청 URL:', req.url);
  console.log('세션 ID:', req.sessionID);
  console.log('세션 내용:', req.session);
  console.log('인증 상태:', req.isAuthenticated ? req.isAuthenticated() : '미확인');
  next();
});

// Passport 설정
app.use(passport.initialize());
app.use(passport.session());

// 디버그 로깅 함수
const logDebug = (message, data) => {
  console.log(`[디버그] ${message}`, data !== undefined ? data : '');
  // 파일에 로그 저장 (선택 사항)
  fs.appendFileSync(
    'debug.log', 
    `${new Date().toISOString()} - ${message} ${data !== undefined ? JSON.stringify(data) : ''}\n`
  );
};

// Battle.net 전략 설정
passport.use(new BnetStrategy({
    clientID: process.env.BNET_CLIENT_ID,
    clientSecret: process.env.BNET_CLIENT_SECRET,
    callbackURL: process.env.BNET_CALLBACK_URL,
    region: process.env.BNET_REGION || 'kr',  // 한국 리전 사용
    passReqToCallback: true // 요청 객체를 콜백으로 전달
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      // 프로필 정보 로깅
      logDebug('배틀넷 인증 성공. 프로필 정보:', {
        id: profile.id,
        battletag: profile.battletag,
        provider: profile.provider,
        session: req.sessionID
      });
      
      let user;
      let isNewUser = false;
      
      if (global.useNeDB) {
        // NeDB에서 사용자 찾기 또는 생성
        user = await UserModel.findByBnetId(profile.id);
        
        if (!user) {
          // 새 사용자 생성
          user = await UserModel.create({
            bnetId: profile.id,
            battletag: profile.battletag,
            accessToken,
            refreshToken,
            isProfileComplete: false,
            mmr: 1500,
            wins: 0,
            losses: 0,
            preferredRoles: [],
            favoriteHeroes: []
          });
          isNewUser = true;
          logDebug('새 사용자 등록 (NeDB):', user.battletag);
        } else {
          // 기존 사용자 토큰 업데이트
          user = await UserModel.update(user._id, {
            accessToken,
            refreshToken,
            lastLoginAt: new Date()
          });
          logDebug('기존 사용자 로그인 (NeDB):', user.battletag);
        }
        return done(null, { ...user, isNewUser });
      } else {
        // 메모리에서 사용자 찾기 또는 생성
        user = memoryUsers.get(profile.id);
        
        if (!user) {
          // 새 사용자 생성
          user = {
            _id: Date.now().toString(),
            bnetId: profile.id,
            battletag: profile.battletag,
            nickname: profile.battletag.split('#')[0],
            accessToken,
            refreshToken,
            isProfileComplete: false,
            mmr: 1500,
            wins: 0,
            losses: 0,
            preferredRoles: [],
            favoriteHeroes: [],
            lastLoginAt: new Date(),
            createdAt: new Date()
          };
          memoryUsers.set(profile.id, user);
          isNewUser = true;
          logDebug('새 사용자 등록 (메모리):', user.battletag);
        } else {
          // 기존 사용자 토큰 업데이트
          user.accessToken = accessToken;
          user.refreshToken = refreshToken;
          user.lastLoginAt = new Date();
          logDebug('기존 사용자 로그인 (메모리):', user.battletag);
        }
        return done(null, { ...user, isNewUser });
      }
    } catch (error) {
      logDebug('사용자 처리 중 오류:', error);
      return done(error, null);
    }
  }
));

// 사용자 직렬화/역직렬화 (세션 관리용)
passport.serializeUser((user, done) => {
  logDebug('사용자 직렬화:', user.battletag);
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    let user = null;
    
    if (global.useNeDB) {
      // NeDB에서 사용자 찾기
      user = await UserModel.findById(id);
    } else {
      // 메모리에서 사용자 찾기
      memoryUsers.forEach((u) => {
        if (u._id === id) {
          user = u;
        }
      });
    }
    
    if (user) {
      logDebug('사용자 역직렬화:', user.battletag);
      done(null, user);
    } else {
      throw new Error('사용자를 찾을 수 없습니다');
    }
  } catch (err) {
    logDebug('역직렬화 오류:', err);
    done(err, null);
  }
});

// 인증 라우트
// Battle.net 로그인 시작
app.get('/api/auth/bnet', (req, res, next) => {
  logDebug('배틀넷 로그인 시작', { sessionID: req.sessionID });
  
  // 랜덤 state 문자열 생성
  const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  logDebug('생성된 state', state);
  
  // 세션에 state 저장 및 세션 저장 강제
  req.session.state = state;
  req.session.save((err) => {
    if (err) {
      logDebug('세션 저장 오류:', err);
      return res.redirect('http://localhost:3000/login?error=' + encodeURIComponent('세션 오류가 발생했습니다.'));
    }
    
    logDebug('세션에 state 저장됨', { state, sessionID: req.sessionID });
    
    // 배틀넷 인증 시작
    passport.authenticate('bnet', { 
      scope: ['openid'],
      state: state
    })(req, res, next);
  });
});

// 개발 환경용 임시 로그인 (Battle.net API 키가 없을 때 사용)
if (process.env.NODE_ENV === 'development') {
  app.get('/api/auth/dev-login', async (req, res) => {
    try {
      // 개발용 테스트 사용자 생성 또는 가져오기
      const testBnetId = 'dev12345';
      let user = await UserModel.findByBnetId(testBnetId);
      
      if (!user) {
        // 새 테스트 사용자 생성
        user = await UserModel.create({
          bnetId: testBnetId,
          battletag: 'DevUser#1234',
          accessToken: 'dev_access_token',
          refreshToken: 'dev_refresh_token',
          isProfileComplete: false,
          mmr: 1500,
          wins: 0,
          losses: 0,
          preferredRoles: [],
          favoriteHeroes: []
        });
        console.log('개발용 테스트 사용자 생성:', user.battletag);
      } else {
        console.log('기존 개발용 테스트 사용자 사용:', user.battletag);
      }
      
      // 사용자 로그인 처리
      req.login(user, (err) => {
        if (err) {
          console.error('개발 로그인 에러:', err);
          return res.redirect('http://localhost:3000/login?error=' + encodeURIComponent('로그인 중 오류가 발생했습니다.'));
        }
        
        console.log('개발 모드 로그인 성공');
        
        // 프로필 설정 여부에 따라 리디렉션
        if (!user.isProfileComplete) {
          res.redirect('http://localhost:3000/profile/setup');
        } else {
          res.redirect('http://localhost:3000');
        }
      });
    } catch (error) {
      console.error('개발 로그인 에러:', error);
      res.redirect('http://localhost:3000/login?error=' + encodeURIComponent('로그인 중 오류가 발생했습니다.'));
    }
  });
}

// Battle.net 콜백 처리
app.get('/api/auth/bnet/callback', 
  (req, res, next) => {
    logDebug('배틀넷 콜백 요청 도착', { 
      state: req.query.state, 
      code: req.query.code ? '존재함' : '없음',
      sessionID: req.sessionID
    });
    
    // 세션 정보 확인
    logDebug('콜백의 세션 정보', { 
      sessionID: req.sessionID,
      sessionState: req.session.state
    });
    
    // state 검증
    if (!req.session.state) {
      logDebug('세션에 state가 없음', req.session);
      return res.redirect('http://localhost:3000/login?error=' + encodeURIComponent('세션 정보가 없습니다. 다시 로그인해주세요.'));
    }
    
    if (req.query.state !== req.session.state) {
      logDebug('State 검증 실패:', {
        received: req.query.state,
        stored: req.session.state
      });
      return res.redirect('http://localhost:3000/login?error=' + encodeURIComponent('보안 검증에 실패했습니다.'));
    }
    
    logDebug('State 검증 성공, 인증 진행');
    next();
  },
  passport.authenticate('bnet', { 
    failureRedirect: 'http://localhost:3000/login?error=auth_failed',
    failWithError: true
  }),
  (req, res) => {
    // 인증 성공 시 처리
    logDebug('인증 성공, 리디렉션 결정 중', {
      user: req.user ? req.user.battletag : '사용자 정보 없음',
      isNewUser: req.user ? req.user.isNewUser : '확인 불가',
      isProfileComplete: req.user ? req.user.isProfileComplete : '확인 불가'
    });
    
    // 새 사용자인 경우 프로필 작성 페이지로 리디렉션
    if (req.user.isNewUser || !req.user.isProfileComplete) {
      logDebug('프로필 작성 필요, 프로필 페이지로 리디렉션');
      res.redirect('http://localhost:3000/profile/setup');
    } else {
      // 기존 사용자는 홈페이지로 리디렉션
      logDebug('프로필 이미 완료, 홈페이지로 리디렉션');
      res.redirect('http://localhost:3000');
    }
  },
  (err, req, res, next) => {
    // 인증 실패 시 에러 처리
    logDebug('인증 실패:', err);
    res.redirect('http://localhost:3000/login?error=' + encodeURIComponent('인증에 실패했습니다.'));
  }
);

// 로그아웃
app.get('/api/auth/logout', (req, res) => {
  console.log('로그아웃 요청:', req.user?.battletag);
  req.logout(function(err) {
    if (err) {
      console.error('로그아웃 에러:', err);
      return next(err);
    }
    console.log('로그아웃 성공');
    res.redirect('http://localhost:3000');
  });
});

// 사용자 정보 조회 API
app.get('/api/auth/user', (req, res) => {
  console.log('사용자 정보 요청. 인증 상태:', req.isAuthenticated());
  if (req.isAuthenticated()) {
    console.log('인증된 사용자:', req.user.battletag);
    console.log('사용자 선호 영웅:', req.user.favoriteHeroes);
    console.log('사용자 선호 역할:', req.user.preferredRoles);
    
    // 원본 사용자 정보 확인
    console.log('원본 사용자 데이터:', {
      _id: req.user._id,
      bnetId: req.user.bnetId,
      battletag: req.user.battletag,
      selectedRoles: req.user.preferredRoles,
      selectedHeroes: req.user.favoriteHeroes
    });
    
    if (global.useNeDB) {
      console.log('NeDB 사용자 정보 확인 중...');
      // 사용자 정보를 최신 상태로 가져오기 위해 비동기 작업 수행
      UserModel.findById(req.user._id)
        .then(user => {
          if (user) {
            console.log('NeDB에서 찾은 최신 사용자 정보:', {
              _id: user._id,
              preferredRoles: user.preferredRoles,
              favoriteHeroes: user.favoriteHeroes
            });
            
            // 세션 업데이트 (선택 사항)
            req.user.preferredRoles = user.preferredRoles;
            req.user.favoriteHeroes = user.favoriteHeroes;
          }
        })
        .catch(err => {
          console.error('NeDB 사용자 조회 오류:', err);
        });
    }
    
    // 민감한 정보 제외
    const userResponse = {
      _id: req.user._id,
      bnetId: req.user.bnetId,
      battletag: req.user.battletag,
      nickname: req.user.nickname,
      isProfileComplete: req.user.isProfileComplete,
      preferredRoles: req.user.preferredRoles || [],
      favoriteHeroes: req.user.favoriteHeroes || [],
      mmr: req.user.mmr,
      wins: req.user.wins,
      losses: req.user.losses,
      lastLoginAt: req.user.lastLoginAt,
      createdAt: req.user.createdAt
    };
    
    console.log('응답으로 보내는 사용자 정보:', userResponse);
    console.log('응답의 선호 역할:', userResponse.preferredRoles);
    console.log('응답의 선호 영웅:', userResponse.favoriteHeroes);
    
    res.json({
      isAuthenticated: true,
      user: userResponse
    });
  } else {
    res.json({
      isAuthenticated: false,
      user: null
    });
  }
});

// 프로필 설정 API
app.post('/api/profile/setup', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: '인증이 필요합니다' });
  }
  
  try {
    const { nickname, preferredRoles, favoriteHeroes } = req.body;
    console.log('프로필 설정 요청 받음:', {
      userId: req.user._id,
      bnetId: req.user.bnetId,
      battletag: req.user.battletag,
      nickname,
      preferredRoles,
      favoriteHeroes
    });
    
    let updatedUser;
    
    if (global.useNeDB) {
      // NeDB 사용자 모델 업데이트
      console.log('NeDB를 사용하여 사용자 프로필 업데이트 시작');
      const user = await UserModel.findById(req.user._id);
      if (!user) {
        console.error('NeDB에서 사용자를 찾을 수 없음:', req.user._id);
        throw new Error('사용자를 찾을 수 없습니다');
      }
      
      console.log('NeDB에서 찾은 사용자:', {
        _id: user._id,
        battletag: user.battletag,
        현재_선호역할: user.preferredRoles,
        현재_선호영웅: user.favoriteHeroes
      });
      
      // NeDB 사용자 업데이트
      updatedUser = await UserModel.update(user._id, {
        nickname: nickname || user.nickname,
        preferredRoles: preferredRoles || user.preferredRoles,
        favoriteHeroes: favoriteHeroes || user.favoriteHeroes,
        isProfileComplete: true
      });
      
      console.log('NeDB 사용자 업데이트 완료');
    } else {
      // 메모리에서 사용자 찾기 및 업데이트
      console.log('메모리 저장소를 사용하여 사용자 프로필 업데이트 시작');
      const user = memoryUsers.get(req.user.bnetId);
      if (!user) {
        console.error('메모리에서 사용자를 찾을 수 없음:', req.user.bnetId);
        throw new Error('사용자를 찾을 수 없습니다');
      }
      
      console.log('메모리에서 찾은 사용자:', {
        _id: user._id,
        battletag: user.battletag,
        현재_선호역할: user.preferredRoles,
        현재_선호영웅: user.favoriteHeroes
      });
      
      user.nickname = nickname || user.nickname;
      user.preferredRoles = preferredRoles || user.preferredRoles;
      user.favoriteHeroes = favoriteHeroes || user.favoriteHeroes;
      user.isProfileComplete = true;
      
      // 변경된 사용자 정보 저장
      memoryUsers.set(req.user.bnetId, user);
      updatedUser = user;
      console.log('메모리 사용자 업데이트 완료');
    }
    
    console.log('사용자 프로필 업데이트 완료:', {
      battletag: updatedUser.battletag,
      preferredRoles: updatedUser.preferredRoles,
      favoriteHeroes: updatedUser.favoriteHeroes
    });
    
    // 업데이트된 사용자 정보를 세션에 반영
    req.user.preferredRoles = updatedUser.preferredRoles;
    req.user.favoriteHeroes = updatedUser.favoriteHeroes;
    req.user.isProfileComplete = true;
    
    // 응답 객체 생성
    const responseUser = {
      _id: req.user._id,
      battletag: req.user.battletag,
      nickname: nickname || req.user.nickname,
      preferredRoles: preferredRoles || [],
      favoriteHeroes: favoriteHeroes || [],
      isProfileComplete: true
    };
    
    console.log('클라이언트에 보내는 응답:', responseUser);
    
    res.json({
      success: true,
      message: '프로필이 성공적으로 업데이트되었습니다.',
      user: responseUser
    });
  } catch (error) {
    console.error('프로필 업데이트 오류:', error);
    res.status(500).json({ 
      success: false,
      message: '프로필 업데이트 중 오류가 발생했습니다',
      error: error.message
    });
  }
});

// 사용자 탈퇴 API
app.post('/api/user/delete', async (req, res) => {
  if (!req.isAuthenticated()) {
    console.log('탈퇴 요청 실패: 인증되지 않은 사용자');
    return res.status(401).json({ 
      success: false,
      message: '인증이 필요합니다' 
    });
  }
  
  console.log('탈퇴 요청 헤더:', req.headers);
  console.log('탈퇴 요청 바디:', req.body);
  
  try {
    const { battletag } = req.body;
    
    // 배틀태그 값 확인
    if (!battletag) {
      console.log('탈퇴 요청 실패: 배틀태그가 제공되지 않음');
      return res.status(400).json({ 
        success: false,
        message: '배틀태그를 입력해주세요.'
      });
    }
    
    // 배틀태그 확인
    if (battletag !== req.user.battletag) {
      console.log(`탈퇴 요청 실패: 배틀태그 불일치 (입력: ${battletag}, 실제: ${req.user.battletag})`);
      return res.status(400).json({ 
        success: false,
        message: '배틀태그가 일치하지 않습니다. 정확한 배틀태그를 입력해주세요.'
      });
    }
    
    console.log(`사용자 탈퇴 요청: ${req.user.battletag} (ID: ${req.user.bnetId})`);
    
    // 데이터베이스에서 사용자 삭제
    if (global.useNeDB) {
      // NeDB 사용자 모델에서 삭제
      await UserModel.delete(req.user._id);
      console.log(`NeDB에서 사용자 삭제 완료: ${req.user._id}`);
    } else {
      // 메모리에서 사용자 삭제
      const deleteResult = memoryUsers.delete(req.user.bnetId);
      console.log(`메모리에서 사용자 삭제 ${deleteResult ? '성공' : '실패'}: ${req.user.bnetId}`);
    }
    
    // 세션 종료 (로그아웃)
    req.logout(function(err) {
      if (err) {
        console.error('로그아웃 에러:', err);
        return res.status(500).json({ 
          success: false,
          message: '계정 탈퇴 중 오류가 발생했습니다. 다시 시도해주세요.'
        });
      }
      
      console.log(`사용자 탈퇴 완료: ${battletag}`);
      
      // 명시적으로 헤더 설정 추가
      res.set('Content-Type', 'application/json');
      
      // 명시적으로 success 필드 포함
      res.status(200).json({
        success: true,
        message: '계정이 성공적으로 삭제되었습니다.'
      });
    });
  } catch (error) {
    console.error('계정 탈퇴 오류:', error);
    res.status(500).json({ 
      success: false,
      message: '계정 탈퇴 중 오류가 발생했습니다',
      error: error.message
    });
  }
});

// 데이터베이스 연결 (NeDB)
global.useNeDB = true; // 기본값을 true로 변경
console.log('NeDB를 사용하여 데이터를 저장하고 있습니다.');

if (process.env.NODE_ENV === 'test') {
  console.log('테스트 모드: 메모리 저장소를 사용합니다.');
  global.useNeDB = false;
}

// 소켓 설정
setupSocketIO(httpServer);

// 라우트 설정
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/matchmaking', matchmakingRoutes);
app.use('/api/admin', adminRoutes);

// 기본 라우트
app.get('/', (req, res) => {
  res.json({ message: 'HOTS Tinder API 서버' });
});

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: '서버 오류가 발생했습니다',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 서버 시작
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`서버가 ${PORT} 포트에서 실행 중입니다`);
  if (global.useNeDB) {
    console.log('NeDB를 사용하여 데이터를 저장하고 있습니다.');
  } else {
    console.log('메모리 기반 임시 저장소를 사용 중입니다. 서버 재시작 시 데이터가 초기화됩니다.');
  }
}); 