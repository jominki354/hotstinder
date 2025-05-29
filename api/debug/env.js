module.exports = function handler(req, res) {
  try {
    console.log('환경 변수 디버깅 요청');

    // 환경 변수 확인 (민감한 정보는 마스킹)
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      BNET_CLIENT_ID: process.env.BNET_CLIENT_ID ? `${process.env.BNET_CLIENT_ID.substring(0, 8)}...` : '❌ 없음',
      BNET_CLIENT_SECRET: process.env.BNET_CLIENT_SECRET ? '✅ 설정됨' : '❌ 없음',
      BNET_CALLBACK_URL: process.env.BNET_CALLBACK_URL || '❌ 없음',
      BNET_REGION: process.env.BNET_REGION || '❌ 없음',
      FRONTEND_URL: process.env.FRONTEND_URL || '❌ 없음',
      JWT_SECRET: process.env.JWT_SECRET ? '✅ 설정됨' : '❌ 없음',
      MONGODB_URI: process.env.MONGODB_URI ? '✅ 설정됨' : '❌ 없음',
      timestamp: new Date().toISOString(),
      vercelRegion: process.env.VERCEL_REGION || 'unknown',
      vercelUrl: process.env.VERCEL_URL || 'unknown'
    };

    console.log('환경 변수 상태:', envCheck);

    res.status(200).json({
      success: true,
      environment: envCheck,
      message: '환경 변수 확인 완료'
    });

  } catch (error) {
    console.error('환경 변수 디버깅 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
