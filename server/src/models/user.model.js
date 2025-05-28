const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Schema } = mongoose;

// 사용자 스키마 정의
const userSchema = new Schema({
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
    type: String,
    required: false,
    default: function () {
      // 배틀태그에서 닉네임 추출 (# 이전 부분)
      return this.battletag ? this.battletag.split('#')[0] : '';
    }
  },
  email: {
    type: String,
    required: false
  },
  profileComplete: {
    type: Boolean,
    default: false
  },
  preferredRoles: {
    type: [String],
    enum: ['탱커', '투사', '원거리 암살자', '근접 암살자', '지원가', '힐러', '서포터', '브루저', '전체'],
    default: ['전체']
  },
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
    type: String
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
}, {
  timestamps: true
});

// 스태틱 메서드: 사용자 생성
userSchema.statics.create = async function (userData) {
  try {
    // 닉네임이 없으면 배틀태그에서 추출
    if (!userData.nickname && userData.battletag) {
      userData.nickname = userData.battletag.split('#')[0];
    }

    // 타임스탬프 추가
    userData.createdAt = new Date();
    userData.lastLoginAt = new Date();

    // 새 사용자 생성 및 저장
    const newUser = new this(userData);
    return await newUser.save();
  } catch (error) {
    console.error('사용자 생성 오류:', error);
    throw error;
  }
};

// JWT 토큰 생성
userSchema.methods.generateAuthToken = function () {
  const payload = {
    id: this._id,
    bnetId: this.bnetId,
    battletag: this.battletag,
    isAdmin: this.isAdmin
  };

  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'dev_jwt_secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// 승률 계산
userSchema.methods.getWinRate = function () {
  const total = this.wins + this.losses;
  if (total === 0) return 0;
  return Math.round((this.wins / total) * 100 * 10) / 10; // 소수점 한 자리까지
};

// 기존 모델이 존재하면 재사용, 없으면 새로 생성
let User;
try {
  User = mongoose.model('User');
} catch (e) {
  User = mongoose.model('User', userSchema);
}

module.exports = User;