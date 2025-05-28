const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

// 사용자 스키마 정의
const userSchema = new mongoose.Schema({
  bnetId: {
    type: String,
    required: true,
    unique: true
  },
  battletag: {
    type: String,
    required: true
  },
  nickname: {
    type: String
  },
  email: {
    type: String,
    sparse: true
  },
  profileComplete: {
    type: Boolean,
    default: false
  },
  preferredRoles: [{
    type: String,
    enum: ['탱커', '전사', '투사', '브루저', '원거리 암살자', '근접 암살자', '지원가', '힐러', '서포터', '특수병', '전체']
  }],
  previousTier: {
    type: String,
    enum: ['placement', 'bronze', 'silver', 'gold', 'platinum', 'diamond', 'master', 'grandmaster'],
    default: 'placement'
  },
  mmr: {
    type: Number,
    default: 1500
  },
  wins: {
    type: Number,
    default: 0
  },
  losses: {
    type: Number,
    default: 0
  },
  adminUsername: {
    type: String,
    sparse: true
  },
  adminPassword: {
    type: String
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isDummy: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastLoginAt: {
    type: Date,
    default: Date.now
  }
});

// 인덱스 생성
userSchema.index({ battletag: 1 });
userSchema.index({ nickname: 1 });
userSchema.index({ adminUsername: 1 }, { sparse: true });
userSchema.index({ isDummy: 1 });

// 사용자 모델 생성
const User = mongoose.model('User', userSchema);

// Mongoose 버전의 User Model
const UserModel = {
  // 사용자 생성
  create: async (userData) => {
    try {
      // 생성 시간 추가
      const now = new Date();
      const userWithTimestamps = {
        ...userData,
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now
      };

      // 배틀태그에서 닉네임 추출
      if (!userWithTimestamps.nickname && userWithTimestamps.battletag) {
        userWithTimestamps.nickname = userWithTimestamps.battletag.split('#')[0];
      }

      const user = new User(userWithTimestamps);
      const savedUser = await user.save();
      logger.debug(`MongoUser: 사용자 생성됨 - ${savedUser._id}`);
      return savedUser;
    } catch (err) {
      logger.error('MongoUser: 사용자 생성 오류', err);
      throw err;
    }
  },

  // ID로 사용자 조회
  findById: async (id) => {
    try {
      const user = await User.findById(id);
      return user;
    } catch (err) {
      logger.error(`MongoUser: ID로 사용자 조회 오류 (${id})`, err);
      throw err;
    }
  },

  // battleNet ID로 사용자 조회
  findByBnetId: async (bnetId) => {
    try {
      const user = await User.findOne({ bnetId });
      return user;
    } catch (err) {
      logger.error(`MongoUser: BnetID로 사용자 조회 오류 (${bnetId})`, err);
      throw err;
    }
  },

  // 관리자 이름으로 사용자 조회
  findByAdminUsername: async (adminUsername) => {
    try {
      const user = await User.findOne({ adminUsername, isAdmin: true });
      return user;
    } catch (err) {
      logger.error(`MongoUser: 관리자 이름으로 사용자 조회 오류 (${adminUsername})`, err);
      throw err;
    }
  },

  // 모든 사용자 조회
  findAll: async () => {
    try {
      const users = await User.find({});
      return users;
    } catch (err) {
      logger.error('MongoUser: 모든 사용자 조회 오류', err);
      throw err;
    }
  },

  // 관리자 사용자 조회
  findAdmins: async () => {
    try {
      const admins = await User.find({ isAdmin: true });
      return admins;
    } catch (err) {
      logger.error('MongoUser: 관리자 조회 오류', err);
      throw err;
    }
  },

  // 사용자 업데이트
  update: async (id, updateData) => {
    try {
      // 업데이트 시간 추가
      const updateWithTimestamp = {
        ...updateData,
        updatedAt: new Date()
      };

      const updatedUser = await User.findByIdAndUpdate(
        id,
        { $set: updateWithTimestamp },
        { new: true }
      );

      if (!updatedUser) {
        logger.warn(`MongoUser: 업데이트할 사용자 없음 (${id})`);
        return null;
      }

      logger.debug(`MongoUser: 사용자 업데이트됨 - ${id}`);
      return updatedUser;
    } catch (err) {
      logger.error(`MongoUser: 사용자 업데이트 오류 (${id})`, err);
      throw err;
    }
  },

  // 사용자 삭제
  delete: async (id) => {
    try {
      const result = await User.findByIdAndDelete(id);
      logger.debug(`MongoUser: 사용자 삭제됨 - ${id}`);
      return !!result; // true if deleted, false if not found
    } catch (err) {
      logger.error(`MongoUser: 사용자 삭제 오류 (${id})`, err);
      throw err;
    }
  },

  // battleNet ID로 사용자 삭제
  deleteByBnetId: async (bnetId) => {
    try {
      const result = await User.deleteOne({ bnetId });
      logger.debug(`MongoUser: BnetID로 사용자 삭제됨 - ${bnetId} (${result.deletedCount}개)`);
      return result.deletedCount > 0;
    } catch (err) {
      logger.error(`MongoUser: BnetID로 사용자 삭제 오류 (${bnetId})`, err);
      throw err;
    }
  },

  // 더미 사용자 조회
  findByDummy: async (isDummy) => {
    try {
      const dummyUsers = await User.find({ isDummy });
      return dummyUsers;
    } catch (err) {
      logger.error('MongoUser: 더미 사용자 조회 오류', err);
      throw err;
    }
  },

  // 더미 사용자 모두 삭제
  deleteAllDummy: async () => {
    try {
      const result = await User.deleteMany({ isDummy: true });
      logger.debug(`MongoUser: 모든 더미 사용자 삭제됨 (${result.deletedCount}개)`);
      return result.deletedCount;
    } catch (err) {
      logger.error('MongoUser: 더미 사용자 삭제 오류', err);
      throw err;
    }
  },

  // 다중 사용자 삭제 (관리자 도구용)
  deleteMany: async (query) => {
    try {
      const result = await User.deleteMany(query);
      logger.debug(`MongoUser: 다중 사용자 삭제됨 (${result.deletedCount}개)`);
      return result.deletedCount;
    } catch (err) {
      logger.error('MongoUser: 다중 사용자 삭제 오류', err);
      throw err;
    }
  },

  // JWT 토큰 생성 메서드
  generateAuthToken: function (user) {
    return jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'your-jwt-secret', {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
  },

  // 승률 계산 메서드
  getWinRate: function (user) {
    const totalGames = (user.wins || 0) + (user.losses || 0);
    if (totalGames === 0) return 0;
    return Math.round((user.wins / totalGames) * 100);
  }
};

module.exports = UserModel;