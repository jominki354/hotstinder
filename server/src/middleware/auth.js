// 인증 미들웨어
const jwt = require('jsonwebtoken');
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

        // PostgreSQL에서 사용자 조회
        if (global.db && global.db.User) {
          logger.debug('PostgreSQL에서 사용자 조회 시도', { id: decoded.id });

          try {
            user = await global.db.User.findByPk(decoded.id);
          } catch (dbErr) {
            logger.error('PostgreSQL 사용자 조회 오류:', dbErr);
          }
        } else {
          logger.error('데이터베이스가 초기화되지 않았습니다');
        }

        // 사용자를 찾았는지 확인
        if (user) {
          // 요청 객체에 사용자 정보 추가
          req.user = user;
          logger.debug('JWT 인증 성공', {
            userId: user.id,
            battleTag: user.battleTag
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
