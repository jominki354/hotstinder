/**
 * 개발 환경에서 모델 사용을 자동 검증하는 미들웨어
 */

const { validateQueryOptions, printCommonMistakes } = require('../utils/modelValidator');
const logger = require('../utils/logger');

/**
 * Sequelize 모델 메서드를 래핑하여 자동 검증 추가
 */
const wrapSequelizeModel = (model, modelName) => {
  if (process.env.NODE_ENV !== 'development') {
    return model; // 프로덕션에서는 래핑하지 않음
  }

  const originalMethods = {};
  const methodsToWrap = ['findAll', 'findOne', 'findByPk', 'findAndCountAll', 'create', 'update', 'destroy'];

  methodsToWrap.forEach(methodName => {
    if (typeof model[methodName] === 'function') {
      originalMethods[methodName] = model[methodName].bind(model);

      model[methodName] = function(options = {}) {
        try {
          // 쿼리 옵션 검증
          const validatedOptions = validateQueryOptions(modelName, options);

          // 원본 메서드 호출
          return originalMethods[methodName](validatedOptions);
        } catch (error) {
          logger.error(`❌ 모델 검증 실패: ${modelName}.${methodName}`, {
            error: error.message,
            options: options
          });

          // 개발 환경에서는 에러를 던지지 않고 경고만 출력
          logger.warn('⚠️ 검증 실패했지만 계속 진행합니다...');
          return originalMethods[methodName](options);
        }
      };
    }
  });

  return model;
};

/**
 * 전역 데이터베이스 객체에 모델 검증 래핑 적용
 */
const applyModelValidation = (db) => {
  if (process.env.NODE_ENV !== 'development') {
    return db; // 프로덕션에서는 적용하지 않음
  }

  logger.info('🔍 개발 모드: 모델 검증 활성화');

  // 일반적인 실수들 출력
  printCommonMistakes();

  // 각 모델에 검증 래핑 적용
  Object.keys(db).forEach(modelName => {
    if (db[modelName] && typeof db[modelName] === 'object' && db[modelName].findAll) {
      db[modelName] = wrapSequelizeModel(db[modelName], modelName);
      logger.debug(`✅ 모델 검증 래핑 적용: ${modelName}`);
    }
  });

  return db;
};

/**
 * Express 미들웨어: 요청별 모델 사용 추적
 */
const trackModelUsage = (req, res, next) => {
  if (process.env.NODE_ENV !== 'development') {
    return next(); // 프로덕션에서는 추적하지 않음
  }

  // 요청 시작 시간 기록
  req.modelUsageStart = Date.now();
  req.modelUsageLog = [];

  // 응답 완료 시 로그 출력
  res.on('finish', () => {
    const duration = Date.now() - req.modelUsageStart;

    if (req.modelUsageLog.length > 0) {
      logger.debug('📊 요청별 모델 사용 통계:', {
        method: req.method,
        url: req.url,
        duration: `${duration}ms`,
        modelsUsed: req.modelUsageLog
      });
    }
  });

  next();
};

/**
 * 모델 사용 로그 추가 헬퍼
 */
const logModelUsage = (req, modelName, operation, details = {}) => {
  if (process.env.NODE_ENV !== 'development' || !req.modelUsageLog) {
    return;
  }

  req.modelUsageLog.push({
    model: modelName,
    operation: operation,
    timestamp: Date.now(),
    details: details
  });
};

/**
 * 일반적인 실수 패턴 감지 및 경고
 */
const detectCommonMistakes = (code) => {
  const mistakes = [];

  // MatchPlayer 사용 감지
  if (code.includes('MatchPlayer')) {
    mistakes.push({
      type: 'wrong_model_name',
      found: 'MatchPlayer',
      correct: 'MatchParticipant',
      message: 'MatchPlayer 모델은 존재하지 않습니다. MatchParticipant를 사용하세요.'
    });
  }

  // match.map 사용 감지
  if (code.includes('match.map') && !code.includes('match.mapName')) {
    mistakes.push({
      type: 'wrong_field_name',
      found: 'match.map',
      correct: 'match.mapName',
      message: 'match.map 필드는 존재하지 않습니다. match.mapName을 사용하세요.'
    });
  }

  // as: 'players' 사용 감지
  if (code.includes("as: 'players'") || code.includes('as: "players"')) {
    mistakes.push({
      type: 'wrong_association_alias',
      found: "as: 'players'",
      correct: "as: 'participants'",
      message: 'Match 모델에서는 participants 별칭을 사용하세요.'
    });
  }

  return mistakes;
};

module.exports = {
  wrapSequelizeModel,
  applyModelValidation,
  trackModelUsage,
  logModelUsage,
  detectCommonMistakes
};
