const { getSequelize } = require('../db/postgresql');

// 모델 정의 함수들
const defineUser = require('./User');
const defineMatch = require('./Match');
const defineMatchParticipant = require('./MatchParticipant');
const defineReplay = require('./Replay');
const defineMatchmakingQueue = require('./MatchmakingQueue');
const defineUserLog = require('./UserLog');

let models = {};

const initializeModels = () => {
  const sequelize = getSequelize();

  // 모델 정의
  models.User = defineUser(sequelize);
  models.Match = defineMatch(sequelize);
  models.MatchParticipant = defineMatchParticipant(sequelize);
  models.Replay = defineReplay(sequelize);
  models.MatchmakingQueue = defineMatchmakingQueue(sequelize);
  models.UserLog = defineUserLog(sequelize);

  // 관계 설정
  setupAssociations();

  return models;
};

const setupAssociations = () => {
  const { User, Match, MatchParticipant, Replay, MatchmakingQueue, UserLog } = models;

  // User 관계 (createdBy 관계 제거)
  User.hasMany(MatchParticipant, { foreignKey: 'userId', as: 'participations' });
  User.hasMany(Replay, { foreignKey: 'uploaderId', as: 'uploadedReplays' });
  User.hasOne(MatchmakingQueue, { foreignKey: 'userId', as: 'queueEntry' });
  User.hasMany(UserLog, { foreignKey: 'userId', as: 'logs' });

  // Match 관계 (creator 관계 제거)
  Match.hasMany(MatchParticipant, { foreignKey: 'matchId', as: 'participants' });
  Match.hasMany(Replay, { foreignKey: 'matchId', as: 'replays' });

  // MatchParticipant 관계
  MatchParticipant.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  MatchParticipant.belongsTo(Match, { foreignKey: 'matchId', as: 'match' });

  // Replay 관계
  Replay.belongsTo(User, { foreignKey: 'uploaderId', as: 'uploader' });
  Replay.belongsTo(Match, { foreignKey: 'matchId', as: 'match' });

  // MatchmakingQueue 관계
  MatchmakingQueue.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  // UserLog 관계
  UserLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });
};

const getModels = () => {
  if (Object.keys(models).length === 0) {
    throw new Error('모델이 초기화되지 않았습니다. initializeModels()을 먼저 호출하세요.');
  }
  return models;
};

module.exports = {
  initializeModels,
  getModels
};
