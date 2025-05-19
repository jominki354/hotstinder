const BnetStrategy = require('passport-bnet').Strategy;
const User = require('../models/user.model');

module.exports = (passport) => {
  // 사용자 세션 직렬화
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // 사용자 세션 역직렬화
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });

  // 배틀넷 전략 설정
  passport.use(new BnetStrategy({
    clientID: process.env.BNET_CLIENT_ID,
    clientSecret: process.env.BNET_CLIENT_SECRET,
    callbackURL: process.env.BNET_CALLBACK_URL,
    region: process.env.BNET_REGION || 'kr'
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // 기존 사용자 확인
      let user = await User.findOne({ battleNetId: profile.id });

      // 사용자가 없으면 새로 생성
      if (!user) {
        user = new User({
          battleNetId: profile.id,
          battleTag: profile.battletag,
          email: profile.email || '',
          accessToken,
          refreshToken
        });
        await user.save();
      } else {
        // 액세스 토큰 업데이트
        user.accessToken = accessToken;
        user.refreshToken = refreshToken;
        await user.save();
      }

      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }));
}; 