module.exports = function handler(req, res) {
  res.status(200).json({
    message: 'Vercel API 라우트 테스트 성공!',
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
}; 