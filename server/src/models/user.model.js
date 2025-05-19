const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  battleNetId: {
    type: String,
    required: true,
    unique: true
  },
  battleTag: {
    type: String,
    required: true
  },
  email: {
    type: String,
    default: ''
  },
  nickname: {
    type: String,
    default: ''
  },
  profilePicture: {
    type: String,
    default: 'default-profile.png'
  },
  preferredHeroes: [{
    type: String
  }],
  playerStats: {
    totalGames: {
      type: Number,
      default: 0
    },
    wins: {
      type: Number,
      default: 0
    },
    losses: {
      type: Number,
      default: 0
    },
    mmr: {
      type: Number,
      default: 1500
    }
  },
  accessToken: {
    type: String,
    required: true
  },
  refreshToken: {
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
  // 관리자 계정 정보
  adminUsername: {
    type: String,
    sparse: true,
    unique: true
  },
  adminPassword: {
    type: String
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 사용자 검색 인덱스
userSchema.index({ battleTag: 'text', nickname: 'text' });
userSchema.index({ adminUsername: 1 }, { sparse: true });

// 메서드: 토큰 생성
userSchema.methods.generateAuthToken = function() {
  const jwt = require('jsonwebtoken');
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// 메서드: 승률 계산
userSchema.methods.getWinRate = function() {
  const { totalGames, wins } = this.playerStats;
  if (totalGames === 0) return 0;
  return Math.round((wins / totalGames) * 100);
};

module.exports = mongoose.model('User', userSchema); 