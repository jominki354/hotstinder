const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const logger = require('../utils/logger');

// 사용자 로그 스키마 정의
const userLogSchema = new Schema({
  userId: {
    type: String,
    index: true
  },
  bnetId: {
    type: String,
    index: true
  },
  action: {
    type: String,
    required: true
  },
  details: {
    type: Schema.Types.Mixed
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { updatedAt: false } // 업데이트 시간은 필요 없음
});

// 모델 생성
const UserLog = mongoose.model('UserLog', userLogSchema);

const UserLogModel = {
  // 로그 생성
  create: async (logData) => {
    try {
      // 타임스탬프 추가
      const now = new Date();
      const logWithTimestamp = {
        ...logData,
        timestamp: now,
        createdAt: now
      };

      const log = new UserLog(logWithTimestamp);
      const savedLog = await log.save();
      logger.debug(`MongoUserLog: 로그 생성됨 - ${savedLog._id}`);
      return savedLog;
    } catch (err) {
      logger.error('MongoUserLog: 로그 생성 오류', err);
      throw err;
    }
  },

  // 사용자 ID로 로그 조회
  findByUserId: async (userId, limit = 50) => {
    try {
      const logs = await UserLog.find({ userId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();
      return logs;
    } catch (err) {
      logger.error(`MongoUserLog: 사용자 ID로 로그 조회 오류 (${userId})`, err);
      throw err;
    }
  },

  // BattleNet ID로 로그 조회
  findByBnetId: async (bnetId, limit = 50) => {
    try {
      const logs = await UserLog.find({ bnetId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();
      return logs;
    } catch (err) {
      logger.error(`MongoUserLog: BattleNet ID로 로그 조회 오류 (${bnetId})`, err);
      throw err;
    }
  },

  // 모든 로그 조회
  findAll: async (limit = 100) => {
    try {
      const logs = await UserLog.find({})
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();
      return logs;
    } catch (err) {
      logger.error('MongoUserLog: 모든 로그 조회 오류', err);
      throw err;
    }
  },

  // 로그 삭제
  delete: async (id) => {
    try {
      const result = await UserLog.deleteOne({ _id: id });
      return result.deletedCount > 0;
    } catch (err) {
      logger.error(`MongoUserLog: 로그 삭제 오류 (${id})`, err);
      throw err;
    }
  },

  // 사용자 관련 로그 모두 삭제
  deleteByUserId: async (userId) => {
    try {
      const result = await UserLog.deleteMany({ userId });
      return result.deletedCount;
    } catch (err) {
      logger.error(`MongoUserLog: 사용자 관련 로그 삭제 오류 (${userId})`, err);
      throw err;
    }
  },

  // 오래된 로그 삭제 (날짜 기준)
  deleteOlderThan: async (date) => {
    try {
      const result = await UserLog.deleteMany({ timestamp: { $lt: date } });
      return result.deletedCount;
    } catch (err) {
      logger.error('MongoUserLog: 오래된 로그 삭제 오류', err);
      throw err;
    }
  }
};

module.exports = UserLogModel;