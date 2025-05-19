// 인증 미들웨어
const authenticateToken = (req, res, next) => {
  // 세션 기반 인증 확인
  if (req.isAuthenticated()) {
    return next();
  }
  
  // 요청에 인증 정보가 없는 경우
  return res.status(401).json({
    success: false,
    message: '인증이 필요합니다.'
  });
};

module.exports = {
  authenticateToken
}; 