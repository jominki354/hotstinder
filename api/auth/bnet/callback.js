require('dotenv').config();
const passport = require('passport');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const jwt = require('jsonwebtoken');
const axios = require('axios');
const mongoose = require('mongoose');

// Passport 설정 (bnet.js와 동일)
passport.use('bnet', new (require('passport-bnet').Strategy)({
  clientID: process.env.BNET_CLIENT_ID,
  clientSecret: process.env.BNET_CLIENT_SECRET,
  callbackURL: process.env.BNET_CALLBACK_URL || 'https://hotstinder.vercel.app/api/auth/bnet/callback',
  region: process.env.BNET_REGION || 'kr'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const user = {
      bnetId: profile.id,
      battleTag: profile.battletag,
      accessToken: accessToken,
      generateAuthToken: function() {
        return jwt.sign(
          {
            id: this.bnetId,
            battleTag: this.battleTag
          },
          process.env.JWT_SECRET || 'your-jwt-secret',
          { expiresIn: '24h' }
        );
      }
    };
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// MongoDB 연결
let isConnected = false;

const connectMongoDB = async () => {
  if (isConnected) return;

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    isConnected = true;
    console.log('MongoDB 연결 성공');
  } catch (error) {
    console.error('MongoDB 연결 실패:', error);
    throw error;
  }
};

// User 모델 정의
const userSchema = new mongoose.Schema({
  bnetId: { type: String, required: true, unique: true },
  battletag: { type: String, required: true },
  email: String,
  accessToken: String,
  refreshToken: String,
  isProfileComplete: { type: Boolean, default: false },
  mmr: { type: Number, default: 1500 },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  preferredRoles: [String],
  favoriteHeroes: [String],
  createdAt: { type: Date, default: Date.now },
  lastLoginAt: { type: Date, default: Date.now }
});

// JWT 토큰 생성 메서드
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    {
      id: this._id,
      bnetId: this.bnetId,
      battletag: this.battletag,
      isAdmin: false
    },
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: '7d' }
  );
};

const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = async function handler(req, res) {
  const startTime = Date.now();

  try {
    console.log('=== Vercel Battle.net 콜백 처리 시작 ===');
    console.log('요청 시간:', new Date().toISOString());
    console.log('요청 메서드:', req.method);
    console.log('요청 URL:', req.url);
    console.log('Query params:', JSON.stringify(req.query, null, 2));
    console.log('Headers:', JSON.stringify({
      'user-agent': req.headers['user-agent'],
      'referer': req.headers['referer'],
      'x-forwarded-for': req.headers['x-forwarded-for'],
      'x-vercel-id': req.headers['x-vercel-id']
    }, null, 2));

    // 환경 변수 확인
    const envCheck = {
      BNET_CLIENT_ID: !!process.env.BNET_CLIENT_ID,
      BNET_CLIENT_SECRET: !!process.env.BNET_CLIENT_SECRET,
      BNET_CALLBACK_URL: process.env.BNET_CALLBACK_URL,
      JWT_SECRET: !!process.env.JWT_SECRET,
      MONGODB_URI: !!process.env.MONGODB_URI,
      FRONTEND_URL: process.env.FRONTEND_URL
    };
    console.log('환경 변수 상태:', envCheck);

    const { code, state, error } = req.query;

    // 오류 체크
    if (error) {
      console.error('Battle.net OAuth 오류:', error);
      const errorUrl = `${process.env.FRONTEND_URL || 'https://hotstinder.vercel.app'}/login?error=oauth_error&details=${encodeURIComponent(error)}`;
      console.log('오류 리다이렉트:', errorUrl);
      return res.redirect(errorUrl);
    }

    // state 검증 (JWT 기반)
    if (!state) {
      console.error('State 파라미터 없음');
      const errorUrl = `${process.env.FRONTEND_URL || 'https://hotstinder.vercel.app'}/login?error=invalid_state&details=no_state`;
      console.log('State 오류 리다이렉트:', errorUrl);
      return res.redirect(errorUrl);
    }

    try {
      const stateData = jwt.verify(state, process.env.JWT_SECRET || 'fallback-secret');
      console.log('State 검증 성공:', stateData);
    } catch (stateError) {
      console.error('State 검증 실패:', stateError.message);
      const errorUrl = `${process.env.FRONTEND_URL || 'https://hotstinder.vercel.app'}/login?error=invalid_state&details=${encodeURIComponent(stateError.message)}`;
      console.log('State 검증 실패 리다이렉트:', errorUrl);
      return res.redirect(errorUrl);
    }

    // 인증 코드로 액세스 토큰 교환
    if (!code) {
      console.error('인증 코드 없음');
      const errorUrl = `${process.env.FRONTEND_URL || 'https://hotstinder.vercel.app'}/login?error=no_code`;
      console.log('코드 없음 리다이렉트:', errorUrl);
      return res.redirect(errorUrl);
    }

    console.log('액세스 토큰 요청 중...');
    console.log('토큰 요청 URL:', 'https://kr.battle.net/oauth/token');
    console.log('클라이언트 ID:', process.env.BNET_CLIENT_ID ? `${process.env.BNET_CLIENT_ID.substring(0, 8)}...` : '없음');
    console.log('콜백 URL:', process.env.BNET_CALLBACK_URL);

    // Battle.net 토큰 요청 (더 상세한 에러 처리)
    let tokenResponse;
    try {
      const tokenRequestData = {
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.BNET_CALLBACK_URL || 'https://hotstinder.vercel.app/api/auth/bnet/callback',
        client_id: process.env.BNET_CLIENT_ID,
        client_secret: process.env.BNET_CLIENT_SECRET
      };

      console.log('토큰 요청 데이터:', {
        ...tokenRequestData,
        client_secret: '***',
        code: `${code.substring(0, 10)}...`
      });

      tokenResponse = await axios.post('https://kr.battle.net/oauth/token', tokenRequestData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'HotsTinder/1.0'
        },
        timeout: 10000 // 10초 타임아웃
      });

      console.log('토큰 응답 상태:', tokenResponse.status);
      console.log('토큰 응답 헤더:', tokenResponse.headers);

    } catch (tokenError) {
      console.error('토큰 요청 실패:', {
        message: tokenError.message,
        status: tokenError.response?.status,
        statusText: tokenError.response?.statusText,
        data: tokenError.response?.data,
        headers: tokenError.response?.headers
      });

      const errorUrl = `${process.env.FRONTEND_URL || 'https://hotstinder.vercel.app'}/login?error=token_request_failed&details=${encodeURIComponent(tokenError.message)}`;
      console.log('토큰 요청 실패 리다이렉트:', errorUrl);
      return res.redirect(errorUrl);
    }

    const { access_token } = tokenResponse.data;
    if (!access_token) {
      console.error('액세스 토큰이 응답에 없음:', tokenResponse.data);
      const errorUrl = `${process.env.FRONTEND_URL || 'https://hotstinder.vercel.app'}/login?error=no_access_token`;
      return res.redirect(errorUrl);
    }

    console.log('액세스 토큰 획득 성공:', `${access_token.substring(0, 10)}...`);

    // 사용자 정보 요청
    let userResponse;
    try {
      console.log('사용자 정보 요청 중...');
      userResponse = await axios.get('https://kr.battle.net/oauth/userinfo', {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'User-Agent': 'HotsTinder/1.0'
        },
        timeout: 10000
      });

      console.log('사용자 정보 응답 상태:', userResponse.status);

    } catch (userError) {
      console.error('사용자 정보 요청 실패:', {
        message: userError.message,
        status: userError.response?.status,
        data: userError.response?.data
      });

      const errorUrl = `${process.env.FRONTEND_URL || 'https://hotstinder.vercel.app'}/login?error=user_info_failed&details=${encodeURIComponent(userError.message)}`;
      return res.redirect(errorUrl);
    }

    const profile = userResponse.data;
    console.log('사용자 정보 획득:', { id: profile.id, battletag: profile.battletag });

    // MongoDB 연결
    console.log('MongoDB 연결 시도...');
    await connectMongoDB();
    console.log('MongoDB 연결 완료');

    // 사용자 찾기 또는 생성
    let user = await User.findOne({ bnetId: profile.id });
    let isNewUser = false;

    if (!user) {
      // 새 사용자 생성
      user = new User({
        bnetId: profile.id,
        battletag: profile.battletag,
        email: profile.email || '',
        accessToken: access_token,
        isProfileComplete: false,
        mmr: 1500,
        wins: 0,
        losses: 0,
        preferredRoles: [],
        favoriteHeroes: []
      });
      await user.save();
      isNewUser = true;
      console.log('새 사용자 생성:', { battletag: user.battletag, id: user._id });
    } else {
      // 기존 사용자 업데이트
      user.accessToken = access_token;
      user.lastLoginAt = new Date();
      await user.save();
      console.log('기존 사용자 로그인:', { battletag: user.battletag, id: user._id });
    }

    // JWT 토큰 생성
    const token = user.generateAuthToken();
    console.log('JWT 토큰 생성 성공:', { tokenLength: token.length, userId: user._id });

    // 성공 리디렉션
    const redirectUrl = `${process.env.FRONTEND_URL || 'https://hotstinder.vercel.app'}/auth/success?token=${token}`;
    console.log('성공 리디렉션:', redirectUrl);

    const processingTime = Date.now() - startTime;
    console.log(`=== 콜백 처리 완료 (${processingTime}ms) ===`);

    res.redirect(redirectUrl);

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('=== Battle.net 콜백 처리 오류 ===');
    console.error('오류 메시지:', error.message);
    console.error('오류 스택:', error.stack);
    console.error('처리 시간:', `${processingTime}ms`);
    console.error('=== 오류 처리 완료 ===');

    const errorUrl = `${process.env.FRONTEND_URL || 'https://hotstinder.vercel.app'}/login?error=callback_error&details=${encodeURIComponent(error.message)}`;
    console.log('최종 오류 리다이렉트:', errorUrl);
    res.redirect(errorUrl);
  }
};
