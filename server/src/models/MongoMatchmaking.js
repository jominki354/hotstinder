const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const logger = require('../utils/logger');

// 매치메이킹 큐 스키마 정의
const matchmakingSchema = new Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  bnetId: {
    type: String,
    required: true
  },
  battletag: {
    type: String,
    required: true
  },
  nickname: {
    type: String,
    required: true
  },
  mmr: {
    type: Number,
    default: 1500
  },
  preferredRoles: {
    type: [String],
    enum: ['탱커', '투사', '브루저', '원거리 암살자', '근접 암살자', '지원가', '힐러', '서포터', '전체'],
    default: ['전체']
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['searching', 'matched', 'canceled'],
    default: 'searching'
  },
  matchId: {
    type: String,
    default: null
  },
  isDummy: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// 매치메이킹 모델 클래스
class MatchmakingModel {
  // 큐에 플레이어 추가
  static async enqueue(playerData) {
    try {
      // 이미 큐에 있는지 확인
      const existing = await this.model.findOne({
        userId: playerData.userId,
        status: 'searching'
      });

      if (existing) {
        logger.info(`플레이어가 이미 큐에 있습니다: ${playerData.nickname}`);
        return existing;
      }

      // 새 큐 항목 생성
      const queueItem = new this.model({
        userId: playerData.userId,
        bnetId: playerData.bnetId,
        battletag: playerData.battletag,
        nickname: playerData.nickname,
        mmr: playerData.mmr || 1500,
        preferredRoles: playerData.preferredRoles || ['전체'],
        joinedAt: new Date(),
        isDummy: playerData.isDummy || false
      });

      await queueItem.save();
      logger.info(`플레이어가 큐에 추가됨: ${playerData.nickname}`);
      return queueItem;
    } catch (error) {
      logger.error('큐 추가 중 오류:', error);
      throw error;
    }
  }

  // 큐에서 플레이어 제거
  static async dequeue(userId) {
    try {
      const result = await this.model.findOneAndUpdate(
        { userId, status: 'searching' },
        { status: 'canceled' },
        { new: true }
      );

      if (result) {
        logger.info(`플레이어가 큐에서 제거됨: ${result.nickname}`);
      }

      return result;
    } catch (error) {
      logger.error('큐 제거 중 오류:', error);
      throw error;
    }
  }

  // 큐에 있는 모든 플레이어 조회
  static async getQueue() {
    try {
      return await this.model.find({ status: 'searching' })
        .sort({ joinedAt: 1 }) // 먼저 추가된 순서대로 정렬
        .lean()
        .exec();
    } catch (error) {
      logger.error('큐 조회 중 오류:', error);
      throw error;
    }
  }

  // 특정 플레이어가 큐에 있는지 확인
  static async isInQueue(userId) {
    try {
      const count = await this.model.countDocuments({
        userId,
        status: 'searching'
      });

      return count > 0;
    } catch (error) {
      logger.error('큐 상태 확인 중 오류:', error);
      throw error;
    }
  }

  // 매치가 이루어진 플레이어들 상태 업데이트
  static async updateMatchedPlayers(playerIds, matchId) {
    try {
      const result = await this.model.updateMany(
        { userId: { $in: playerIds }, status: 'searching' },
        { status: 'matched', matchId, matchedAt: new Date() }
      );

      logger.info(`${result.modifiedCount}명의 플레이어가 매치되었습니다.`);
      return result.modifiedCount;
    } catch (error) {
      logger.error('매치 상태 업데이트 중 오류:', error);
      throw error;
    }
  }

  // 큐 통계 조회
  static async getQueueStats() {
    try {
      const totalInQueue = await this.model.countDocuments({ status: 'searching' });
      const byRole = await this.model.aggregate([
        { $match: { status: 'searching' } },
        { $unwind: '$preferredRoles' },
        { $group: { _id: '$preferredRoles', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]);

      // MMR 구간별 통계
      const mmrRanges = [
        { min: 0, max: 1400, name: '브론즈' },
        { min: 1400, max: 1600, name: '실버' },
        { min: 1600, max: 1800, name: '골드' },
        { min: 1800, max: 2000, name: '플래티넘' },
        { min: 2000, max: 2200, name: '다이아몬드' },
        { min: 2200, max: 10000, name: '마스터' },
      ];

      const byMmr = [];
      for (const range of mmrRanges) {
        const count = await this.model.countDocuments({
          status: 'searching',
          mmr: { $gte: range.min, $lt: range.max }
        });

        byMmr.push({
          tier: range.name,
          count
        });
      }

      return {
        totalInQueue,
        byRole,
        byMmr,
        updatedAt: new Date()
      };
    } catch (error) {
      logger.error('큐 통계 조회 중 오류:', error);
      throw error;
    }
  }

  // 큐 초기화 (관리자용)
  static async clearQueue() {
    try {
      const result = await this.model.updateMany(
        { status: 'searching' },
        { status: 'canceled', updatedAt: new Date() }
      );

      logger.info(`큐가 초기화되었습니다. ${result.modifiedCount}명의 플레이어가 제거되었습니다.`);
      return result.modifiedCount;
    } catch (error) {
      logger.error('큐 초기화 중 오류:', error);
      throw error;
    }
  }

  // 더미 플레이어 추가 (테스트용)
  static async addDummyPlayers(count = 5) {
    try {
      const roles = ['탱커', '투사', '원거리 암살자', '근접 암살자', '서포터', '힐러'];
      const dummyPlayers = [];

      for (let i = 0; i < count; i++) {
        const mmr = 1400 + Math.floor(Math.random() * 800); // 1400-2200 사이의 MMR
        const roleIndex = Math.floor(Math.random() * roles.length);
        const dummyId = `dummy-queue-${Date.now()}-${i}`;

        dummyPlayers.push({
          userId: dummyId,
          bnetId: dummyId,
          battletag: `Dummy${i}#${1000 + i}`,
          nickname: `더미플레이어${i}`,
          mmr,
          preferredRoles: [roles[roleIndex]],
          isDummy: true
        });
      }

      const results = [];
      for (const dummy of dummyPlayers) {
        const result = await this.enqueue(dummy);
        results.push(result);
      }

      logger.info(`${results.length}명의 더미 플레이어가 큐에 추가되었습니다.`);
      return results;
    } catch (error) {
      logger.error('더미 플레이어 추가 중 오류:', error);
      throw error;
    }
  }
}

// 모델 생성 및 스태틱 메서드 설정
matchmakingSchema.loadClass(MatchmakingModel);
const Matchmaking = mongoose.model('Matchmaking', matchmakingSchema);
MatchmakingModel.model = Matchmaking;

module.exports = MatchmakingModel;