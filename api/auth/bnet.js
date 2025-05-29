require('dotenv').config();
const passport = require('passport');
const jwt = require('jsonwebtoken');

// Passport 설정
passport.use('bnet', new (require('passport-bnet').Strategy)({
  clientID: process.env.BNET_CLIENT_ID,
  clientSecret: process.env.BNET_CLIENT_SECRET,
  callbackURL: process.env.BNET_CALLBACK_URL || 'https://hotstinder.vercel.app/api/auth/bnet/callback',
  region: process.env.BNET_REGION || 'kr'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // 간단한 사용자 객체 반환
    const user = {
      bnetId: profile.id,
      battleTag: profile.battletag,
      accessToken: accessToken
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

module.exports = function handler(req, res) {
  try {
    console.log('Vercel Battle.net 인증 시작');

    // state를 JWT로 생성 (세션 대신)
    const stateData = {
      timestamp: Date.now(),
      random: Math.random().toString(36).substring(2, 15)
    };

    const state = jwt.sign(stateData, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '10m' });

    console.log('State 생성:', { stateLength: state.length });

    // Battle.net OAuth URL 직접 생성
    const authUrl = `https://kr.battle.net/oauth/authorize?` +
      `response_type=code&` +
      `client_id=${process.env.BNET_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(process.env.BNET_CALLBACK_URL || 'https://hotstinder.vercel.app/api/auth/bnet/callback')}&` +
      `state=${encodeURIComponent(state)}`;

    console.log('Battle.net 리다이렉트 URL:', authUrl);

    // Battle.net으로 리다이렉트
    res.redirect(authUrl);

  } catch (error) {
    console.error('Battle.net 인증 시작 오류:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'https://hotstinder.vercel.app'}/login?error=auth_start_failed`);
  }
};
