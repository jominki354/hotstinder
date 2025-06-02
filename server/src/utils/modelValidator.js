/**
 * 모델과 필드명 일관성 검증 유틸리티
 * 개발 중 모델 참조 오류를 방지하기 위한 헬퍼 함수들
 */

const logger = require('./logger');

/**
 * 사용 가능한 모델 목록
 */
const AVAILABLE_MODELS = {
  User: 'User',
  Match: 'Match',
  MatchParticipant: 'MatchParticipant', // MatchPlayer 아님!
  Replay: 'Replay',
  MatchmakingQueue: 'MatchmakingQueue',
  UserLog: 'UserLog'
};

/**
 * 모델별 올바른 필드명 매핑
 */
const MODEL_FIELDS = {
  Match: {
    // 올바른 필드명들
    correct: {
      id: 'id',
      mapName: 'mapName', // map 아님!
      gameMode: 'gameMode',
      winner: 'winner',
      status: 'status',
      gameDuration: 'gameDuration',
      createdBy: 'createdBy',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt'
    },
    // 자주 실수하는 잘못된 필드명들
    incorrect: {
      map: 'mapName', // map -> mapName
      duration: 'gameDuration', // duration -> gameDuration
      creator: 'createdBy' // creator -> createdBy
    }
  },
  MatchParticipant: {
    correct: {
      id: 'id',
      matchId: 'matchId',
      userId: 'userId',
      team: 'team',
      role: 'role',
      hero: 'hero',
      kills: 'kills',
      deaths: 'deaths',
      assists: 'assists',
      heroDamage: 'heroDamage',
      siegeDamage: 'siegeDamage',
      healing: 'healing',
      experience: 'experience',
      mmrBefore: 'mmrBefore',
      mmrAfter: 'mmrAfter',
      mmrChange: 'mmrChange'
    }
  },
  User: {
    correct: {
      id: 'id',
      battleTag: 'battleTag',
      bnetId: 'bnetId',
      nickname: 'nickname',
      email: 'email',
      role: 'role',
      mmr: 'mmr',
      wins: 'wins',
      losses: 'losses',
      isProfileComplete: 'isProfileComplete',
      preferredRoles: 'preferredRoles',
      previousTier: 'previousTier',
      lastLoginAt: 'lastLoginAt'
    }
  }
};

/**
 * 모델별 올바른 관계 별칭
 */
const MODEL_ASSOCIATIONS = {
  Match: {
    participants: 'participants', // players 아님!
    creator: 'creator',
    replays: 'replays'
  },
  User: {
    createdMatches: 'createdMatches',
    participations: 'participations',
    uploadedReplays: 'uploadedReplays',
    queueEntry: 'queueEntry',
    logs: 'logs'
  },
  MatchParticipant: {
    user: 'user',
    match: 'match'
  }
};

/**
 * 모델명 검증
 */
const validateModelName = (modelName) => {
  if (!AVAILABLE_MODELS[modelName]) {
    const suggestion = getSimilarModelName(modelName);
    logger.error(`❌ 잘못된 모델명: ${modelName}`, {
      availableModels: Object.keys(AVAILABLE_MODELS),
      suggestion: suggestion ? `혹시 '${suggestion}'을 의도하셨나요?` : null
    });
    return false;
  }
  return true;
};

/**
 * 필드명 검증
 */
const validateFieldName = (modelName, fieldName) => {
  const modelFields = MODEL_FIELDS[modelName];
  if (!modelFields) {
    logger.warn(`⚠️ 모델 ${modelName}의 필드 정의가 없습니다`);
    return true; // 정의되지 않은 모델은 통과
  }

  // 올바른 필드명인지 확인
  if (modelFields.correct[fieldName]) {
    return true;
  }

  // 자주 실수하는 잘못된 필드명인지 확인
  if (modelFields.incorrect && modelFields.incorrect[fieldName]) {
    const correctField = modelFields.incorrect[fieldName];
    logger.error(`❌ 잘못된 필드명: ${modelName}.${fieldName}`, {
      correctField: `${modelName}.${correctField}를 사용하세요`,
      example: `match.${fieldName} → match.${correctField}`
    });
    return false;
  }

  // 알 수 없는 필드명
  logger.warn(`⚠️ 알 수 없는 필드명: ${modelName}.${fieldName}`, {
    availableFields: Object.keys(modelFields.correct)
  });
  return true; // 경고만 하고 통과
};

/**
 * 관계 별칭 검증
 */
const validateAssociationAlias = (modelName, alias) => {
  const modelAssociations = MODEL_ASSOCIATIONS[modelName];
  if (!modelAssociations) {
    return true; // 정의되지 않은 모델은 통과
  }

  if (!modelAssociations[alias]) {
    logger.error(`❌ 잘못된 관계 별칭: ${modelName}.${alias}`, {
      availableAliases: Object.keys(modelAssociations),
      commonMistakes: {
        'players': 'participants를 사용하세요 (Match 모델)',
        'player': 'user를 사용하세요 (MatchParticipant 모델)'
      }
    });
    return false;
  }
  return true;
};

/**
 * 유사한 모델명 찾기
 */
const getSimilarModelName = (inputName) => {
  const modelNames = Object.keys(AVAILABLE_MODELS);

  // 정확히 일치하는 것 찾기 (대소문자 무시)
  const exactMatch = modelNames.find(name =>
    name.toLowerCase() === inputName.toLowerCase()
  );
  if (exactMatch) return exactMatch;

  // 부분 일치하는 것 찾기
  const partialMatch = modelNames.find(name =>
    name.toLowerCase().includes(inputName.toLowerCase()) ||
    inputName.toLowerCase().includes(name.toLowerCase())
  );
  if (partialMatch) return partialMatch;

  // 특별한 경우들
  const specialCases = {
    'MatchPlayer': 'MatchParticipant',
    'Player': 'MatchParticipant',
    'matchplayer': 'MatchParticipant',
    'player': 'MatchParticipant'
  };

  return specialCases[inputName] || null;
};

/**
 * 개발 모드에서 모델 사용 검증
 */
const validateModelUsage = (modelName, operation = 'access') => {
  if (process.env.NODE_ENV !== 'development') {
    return true; // 프로덕션에서는 검증 스킵
  }

  if (!validateModelName(modelName)) {
    throw new Error(`잘못된 모델명: ${modelName}`);
  }

  logger.debug(`✅ 모델 사용 검증 통과: ${modelName} (${operation})`);
  return true;
};

/**
 * Sequelize 쿼리 옵션 검증
 */
const validateQueryOptions = (modelName, options = {}) => {
  if (process.env.NODE_ENV !== 'development') {
    return options; // 프로덕션에서는 검증 스킵
  }

  // include 옵션 검증
  if (options.include) {
    const includes = Array.isArray(options.include) ? options.include : [options.include];

    includes.forEach(include => {
      if (include.as) {
        validateAssociationAlias(modelName, include.as);
      }
      if (include.model && include.model.name) {
        validateModelName(include.model.name);
      }
    });
  }

  // attributes 옵션 검증
  if (options.attributes && Array.isArray(options.attributes)) {
    options.attributes.forEach(attr => {
      if (typeof attr === 'string') {
        validateFieldName(modelName, attr);
      }
    });
  }

  return options;
};

/**
 * 일반적인 실수들에 대한 도움말 출력
 */
const printCommonMistakes = () => {
  logger.info('🔍 일반적인 모델 사용 실수들:', {
    modelNames: {
      '❌ MatchPlayer': '✅ MatchParticipant',
      '❌ Player': '✅ MatchParticipant'
    },
    fieldNames: {
      '❌ match.map': '✅ match.mapName',
      '❌ match.duration': '✅ match.gameDuration'
    },
    associations: {
      '❌ as: "players"': '✅ as: "participants"',
      '❌ match.players': '✅ match.participants'
    }
  });
};

module.exports = {
  validateModelName,
  validateFieldName,
  validateAssociationAlias,
  validateModelUsage,
  validateQueryOptions,
  printCommonMistakes,
  AVAILABLE_MODELS,
  MODEL_FIELDS,
  MODEL_ASSOCIATIONS
};
