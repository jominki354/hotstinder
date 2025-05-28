const mongoose = require('mongoose');
const logger = require('../utils/logger');

// 매치 스키마 정의
const matchSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'completed', 'cancelled'],
    default: 'open'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  teams: {
    blue: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      role: String
    }],
    red: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      role: String
    }]
  },
  result: {
    winner: {
      type: String,
      enum: ['blue', 'red', null],
      default: null
    },
    blueScore: {
      type: Number,
      default: 0
    },
    redScore: {
      type: Number,
      default: 0
    },
    duration: {
      type: Number,
      default: 0
    }
  },
  map: {
    type: String
  },
  scheduledTime: {
    type: Date,
    default: Date.now
  },
  isDummy: {
    type: Boolean,
    default: false
  },
  originalMatchId: {
    type: String,
    index: true
  },
  replayData: {
    type: mongoose.Schema.Types.Mixed, // 리플레이 분석 결과 데이터
    default: null
  },
  playerStats: {
    type: [{
      userId: String,
      battletag: String,
      team: {
        type: String,
        enum: ['blue', 'red']
      },
      hero: String,
      kills: {
        type: Number,
        default: 0
      },
      deaths: {
        type: Number,
        default: 0
      },
      assists: {
        type: Number,
        default: 0
      },
      heroDamage: {
        type: Number,
        default: 0
      },
      siegeDamage: {
        type: Number,
        default: 0
      },
      healing: {
        type: Number,
        default: 0
      },
      experienceContribution: {
        type: Number,
        default: 0
      }
    }],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  mmrChanges: {
    type: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      before: Number,
      after: Number,
      change: Number,
      battletag: String
    }],
    default: []
  },
  eventLog: {
    type: [{
      type: {
        type: String,
        enum: ['매치_생성', '매치_시작', '매치_종료', '플레이어_참가', '플레이어_퇴장', '메시지']
      },
      description: String,
      timestamp: {
        type: Date,
        default: Date.now
      },
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }],
    default: []
  }
});

// 인덱스 생성
matchSchema.index({ status: 1 });
matchSchema.index({ createdAt: 1 });
matchSchema.index({ isDummy: 1 });
matchSchema.index({ scheduledTime: 1 });

// 매치 모델 생성
const Match = mongoose.model('Match', matchSchema);

// Mongoose 버전의 Match Model
const MatchModel = {
  // 매치 생성
  create: async (matchData) => {
    try {
      // 생성 시간 추가
      const now = new Date();
      const matchWithTimestamps = {
        ...matchData,
        createdAt: now,
        updatedAt: now,
        scheduledTime: matchData.scheduledTime || now
      };

      // 기본 상태 설정
      if (!matchWithTimestamps.status) {
        matchWithTimestamps.status = 'open';
      }

      // 팀 구조 초기화
      if (!matchWithTimestamps.teams) {
        matchWithTimestamps.teams = {
          blue: [],
          red: []
        };
      }

      // 결과 초기화
      if (!matchWithTimestamps.result) {
        matchWithTimestamps.result = {
          winner: null,
          blueScore: 0,
          redScore: 0,
          duration: 0
        };
      }

      // mmrChanges 및 eventLog 배열 초기화
      if (!matchWithTimestamps.mmrChanges) {
        matchWithTimestamps.mmrChanges = [];
      }

      if (!matchWithTimestamps.eventLog) {
        matchWithTimestamps.eventLog = [];
      }

      const match = new Match(matchWithTimestamps);
      const savedMatch = await match.save();
      logger.debug(`MongoMatch: 매치 생성됨 - ${savedMatch._id}`);
      return savedMatch;
    } catch (err) {
      logger.error('MongoMatch: 매치 생성 오류', err);
      throw err;
    }
  },

  // ID로 매치 조회
  findById: async (id) => {
    try {
      const match = await Match.findById(id);
      return match;
    } catch (err) {
      logger.error(`MongoMatch: ID로 매치 조회 오류 (${id})`, err);
      throw err;
    }
  },

  // 모든 매치 조회
  findAll: async () => {
    try {
      const matches = await Match.find({});
      return matches;
    } catch (err) {
      logger.error('MongoMatch: 모든 매치 조회 오류', err);
      throw err;
    }
  },

  // 조건에 따른 매치 조회
  find: async (query = {}) => {
    try {
      const matches = await Match.find(query);
      return matches;
    } catch (err) {
      logger.error('MongoMatch: 조건부 매치 조회 오류', err);
      throw err;
    }
  },

  // 조건에 따른 단일 매치 조회
  findOne: async (query = {}) => {
    try {
      const match = await Match.findOne(query);
      return match;
    } catch (err) {
      logger.error('MongoMatch: 단일 매치 조회 오류', err);
      throw err;
    }
  },

  // 상태별 매치 조회
  findByStatus: async (status) => {
    try {
      const matches = await Match.find({ status });
      return matches;
    } catch (err) {
      logger.error(`MongoMatch: 상태별 매치 조회 오류 (${status})`, err);
      throw err;
    }
  },

  // 플레이어가 참여한 매치 조회
  findByPlayer: async (userId) => {
    try {
      const matches = await Match.find({
        $or: [
          { 'teams.blue.user': userId },
          { 'teams.red.user': userId }
        ]
      });
      return matches;
    } catch (err) {
      logger.error(`MongoMatch: 플레이어별 매치 조회 오류 (${userId})`, err);
      throw err;
    }
  },

  // 매치 업데이트
  update: async (id, updateData) => {
    try {
      // 업데이트 시간 추가
      const updateWithTimestamp = {
        ...updateData,
        updatedAt: new Date()
      };

      const updatedMatch = await Match.findByIdAndUpdate(
        id,
        { $set: updateWithTimestamp },
        { new: true }
      );

      if (!updatedMatch) {
        logger.warn(`MongoMatch: 업데이트할 매치 없음 (${id})`);
        return null;
      }

      logger.debug(`MongoMatch: 매치 업데이트됨 - ${id}`);
      return updatedMatch;
    } catch (err) {
      logger.error(`MongoMatch: 매치 업데이트 오류 (${id})`, err);
      throw err;
    }
  },

  // ID로 매치 업데이트 (별칭)
  updateById: async (id, updateData) => {
    return MatchModel.update(id, updateData);
  },

  // 매치 삭제
  delete: async (id) => {
    try {
      const result = await Match.findByIdAndDelete(id);
      logger.debug(`MongoMatch: 매치 삭제됨 - ${id}`);
      return !!result; // true if deleted, false if not found
    } catch (err) {
      logger.error(`MongoMatch: 매치 삭제 오류 (${id})`, err);
      throw err;
    }
  },

  // 더미 매치 조회
  findByDummy: async (isDummy) => {
    try {
      const dummyMatches = await Match.find({ isDummy });
      return dummyMatches;
    } catch (err) {
      logger.error('MongoMatch: 더미 매치 조회 오류', err);
      throw err;
    }
  },

  // 더미 매치 모두 삭제
  deleteAllDummy: async () => {
    try {
      const result = await Match.deleteMany({ isDummy: true });
      logger.debug(`MongoMatch: 모든 더미 매치 삭제됨 (${result.deletedCount}개)`);
      return result.deletedCount;
    } catch (err) {
      logger.error('MongoMatch: 더미 매치 삭제 오류', err);
      throw err;
    }
  },

  // 다중 매치 삭제 (관리자 도구용)
  deleteMany: async (query) => {
    try {
      const result = await Match.deleteMany(query);
      logger.debug(`MongoMatch: 다중 매치 삭제됨 (${result.deletedCount}개)`);
      return result.deletedCount;
    } catch (err) {
      logger.error('MongoMatch: 다중 매치 삭제 오류', err);
      throw err;
    }
  },

  // 최근 매치 조회 (제한 수와 함께)
  findRecent: async (limit = 10) => {
    try {
      const recentMatches = await Match.find({})
        .sort({ createdAt: -1 })
        .limit(limit);
      return recentMatches;
    } catch (err) {
      logger.error(`MongoMatch: 최근 매치 조회 오류 (limit: ${limit})`, err);
      throw err;
    }
  },

  // 특정 기간 이후의 매치 수 계산
  countSince: async (date) => {
    try {
      const count = await Match.countDocuments({ createdAt: { $gte: date } });
      return count;
    } catch (err) {
      logger.error(`MongoMatch: 매치 수 계산 오류 (since: ${date})`, err);
      throw err;
    }
  }
};

module.exports = MatchModel;