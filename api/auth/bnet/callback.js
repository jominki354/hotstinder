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
  try {
    console.log('Vercel Battle.net 콜백 처리 시작');
    console.log('Query params:', req.query);

    const { code, state, error } = req.query;

    // 오류 체크
    if (error) {
      console.error('Battle.net OAuth 오류:', error);
      return res.redirect(`${process.env.FRONTEND_URL || 'https://hotstinder.vercel.app'}/login?error=oauth_error`);
    }

    // state 검증 (JWT 기반)
    if (!state) {
      console.error('State 파라미터 없음');
      return res.redirect(`${process.env.FRONTEND_URL || 'https://hotstinder.vercel.app'}/login?error=invalid_state`);
    }

    try {
      const stateData = jwt.verify(state, process.env.JWT_SECRET || 'fallback-secret');
      console.log('State 검증 성공:', stateData);
    } catch (stateError) {
      console.error('State 검증 실패:', stateError);
      return res.redirect(`${process.env.FRONTEND_URL || 'https://hotstinder.vercel.app'}/login?error=invalid_state`);
    }

    // 인증 코드로 액세스 토큰 교환
    if (!code) {
      console.error('인증 코드 없음');
      return res.redirect(`${process.env.FRONTEND_URL || 'https://hotstinder.vercel.app'}/login?error=no_code`);
    }

    console.log('액세스 토큰 요청 중...');

    // Battle.net 토큰 요청
    const tokenResponse = await axios.post('https://kr.battle.net/oauth/token', {
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: process.env.BNET_CALLBACK_URL || 'https://hotstinder.vercel.app/api/auth/bnet/callback',
      client_id: process.env.BNET_CLIENT_ID,
      client_secret: process.env.BNET_CLIENT_SECRET
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token } = tokenResponse.data;
    console.log('액세스 토큰 획득 성공');

    // 사용자 정보 요청
    const userResponse = await axios.get('https://kr.battle.net/oauth/userinfo', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    const profile = userResponse.data;
    console.log('사용자 정보 획득:', { id: profile.id, battletag: profile.battletag });

    // MongoDB 연결
    await connectMongoDB();

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
      console.log('새 사용자 생성:', { battletag: user.battletag });
    } else {
      // 기존 사용자 업데이트
      user.accessToken = access_token;
      user.lastLoginAt = new Date();
      await user.save();
      console.log('기존 사용자 로그인:', { battletag: user.battletag });
    }

    // JWT 토큰 생성
    const token = user.generateAuthToken();
    console.log('JWT 토큰 생성 성공:', { tokenLength: token.length });

    // 성공 리디렉션
    const redirectUrl = `${process.env.FRONTEND_URL || 'https://hotstinder.vercel.app'}/auth/success?token=${token}`;
    console.log('리디렉션:', redirectUrl);

    res.redirect(redirectUrl);

  } catch (error) {
    console.error('Battle.net 콜백 처리 오류:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'https://hotstinder.vercel.app'}/login?error=callback_error`);
  }
};
