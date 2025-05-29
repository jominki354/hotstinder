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
    console.log('=== Vercel Battle.net 인증 시작 ===');
    console.log('요청 시간:', new Date().toISOString());
    console.log('요청 메서드:', req.method);
    console.log('요청 URL:', req.url);
    console.log('User-Agent:', req.headers['user-agent']);
    console.log('Referer:', req.headers['referer']);

    // 환경 변수 확인
    const envCheck = {
      BNET_CLIENT_ID: process.env.BNET_CLIENT_ID ? `${process.env.BNET_CLIENT_ID.substring(0, 8)}...` : '❌ 없음',
      BNET_CLIENT_SECRET: !!process.env.BNET_CLIENT_SECRET,
      BNET_CALLBACK_URL: process.env.BNET_CALLBACK_URL,
      JWT_SECRET: !!process.env.JWT_SECRET,
      FRONTEND_URL: process.env.FRONTEND_URL
    };
    console.log('환경 변수 상태:', envCheck);

    // 필수 환경 변수 확인
    if (!process.env.BNET_CLIENT_ID) {
      console.error('BNET_CLIENT_ID 환경 변수가 설정되지 않음');
      return res.redirect(`${process.env.FRONTEND_URL || 'https://hotstinder.vercel.app'}/login?error=config_error&details=missing_client_id`);
    }

    if (!process.env.BNET_CLIENT_SECRET) {
      console.error('BNET_CLIENT_SECRET 환경 변수가 설정되지 않음');
      return res.redirect(`${process.env.FRONTEND_URL || 'https://hotstinder.vercel.app'}/login?error=config_error&details=missing_client_secret`);
    }

    // state를 JWT로 생성 (세션 대신)
    const stateData = {
      timestamp: Date.now(),
      random: Math.random().toString(36).substring(2, 15),
      userAgent: req.headers['user-agent'] || 'unknown'
    };

    const state = jwt.sign(stateData, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '10m' });

    console.log('State 생성:', {
      stateLength: state.length,
      timestamp: stateData.timestamp,
      random: stateData.random
    });

    // Battle.net OAuth URL 직접 생성
    const callbackUrl = process.env.BNET_CALLBACK_URL || 'https://hotstinder.vercel.app/api/auth/bnet/callback';
    const authUrl = `https://kr.battle.net/oauth/authorize?` +
      `response_type=code&` +
      `client_id=${encodeURIComponent(process.env.BNET_CLIENT_ID)}&` +
      `redirect_uri=${encodeURIComponent(callbackUrl)}&` +
      `state=${encodeURIComponent(state)}&` +
      `scope=openid`;

    console.log('Battle.net OAuth URL 구성 요소:');
    console.log('- 클라이언트 ID:', process.env.BNET_CLIENT_ID);
    console.log('- 콜백 URL:', callbackUrl);
    console.log('- State 길이:', state.length);
    console.log('- 최종 URL 길이:', authUrl.length);
    console.log('- 최종 URL:', authUrl);

    // Battle.net으로 리다이렉트
    console.log('Battle.net으로 리다이렉트 실행');
    res.redirect(authUrl);

  } catch (error) {
    console.error('=== Battle.net 인증 시작 오류 ===');
    console.error('오류 메시지:', error.message);
    console.error('오류 스택:', error.stack);
    console.error('=== 오류 처리 완료 ===');

    const errorUrl = `${process.env.FRONTEND_URL || 'https://hotstinder.vercel.app'}/login?error=auth_start_failed&details=${encodeURIComponent(error.message)}`;
    console.log('오류 리다이렉트:', errorUrl);
    res.redirect(errorUrl);
  }
};
