// 인증 미들웨어
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const NeDBUser = require('../models/NeDBUser');
const logger = require('../utils/logger');

const authenticateToken = async (req, res, next) => {
  try {
    // 1. 세션 기반 인증 확인
  if (req.isAuthenticated()) {
      logger.debug('세션 기반 인증 성공');
    return next();
  }
  
    // 2. JWT 토큰 확인
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      
      try {
        // 토큰 검증
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        logger.debug('JWT 토큰 검증 성공', { id: decoded.id });
        
        // 사용자 찾기
        let user;
        
        // MongoDB 또는 NeDB에서 사용자 조회
        if (global.useNeDB) {
          // NeDB에서 사용자 조회
          logger.debug('NeDB에서 사용자 조회 시도', { id: decoded.id });
          
          try {
            if (decoded.id) {
              user = await NeDBUser.findById(decoded.id);
            }
          } catch (nedbErr) {
            logger.error('NeDB 사용자 조회 오류:', nedbErr);
          }
        } else {
          // MongoDB에서 사용자 조회
          logger.debug('MongoDB에서 사용자 조회 시도', { id: decoded.id });
          
          try {
            // bnetId로 사용자 조회 시도
            if (decoded.id) {
              user = await User.findOne({ bnetId: decoded.id });
              
              // bnetId로 찾지 못한 경우 _id로 조회
              if (!user && decoded.id) {
                user = await User.findById(decoded.id);
              }
            }
          } catch (mongoErr) {
            logger.error('MongoDB 사용자 조회 오류:', mongoErr);
          }
        }
        
        // 사용자를 찾았는지 확인
        if (user) {
          // 요청 객체에 사용자 정보 추가
          req.user = user;
          logger.debug('JWT 인증 성공', { 
            userId: user._id, 
            battletag: user.battletag || user.battleTag 
          });
          return next();
        } else {
          logger.warn('JWT 인증 - 사용자를 찾을 수 없음', { id: decoded.id });
        }
      } catch (jwtErr) {
        logger.error('JWT 토큰 검증 실패:', jwtErr);
      }
    }
    
    // 인증 실패 처리
    logger.warn('인증 실패: 유효한 세션 또는 JWT 토큰 없음');
  return res.status(401).json({
    success: false,
    message: '인증이 필요합니다.'
  });
  } catch (err) {
    logger.error('인증 미들웨어 오류:', err);
    return res.status(500).json({
      success: false,
      message: '인증 처리 중 오류가 발생했습니다.'
    });
  }
};

module.exports = {
  authenticateToken
}; 