const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  bnetId: {
    type: Number,
    required: true,
    unique: true
  },
  battletag: {
    type: String,
    required: true
  },
  email: {
    type: String,
    sparse: true
  },
  nickname: {
    type: String
  },
  isProfileComplete: {
    type: Boolean,
    default: false
  },
  refreshToken: {
    type: String
  },
  accessToken: {
    type: String
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
  matches: [{
    type: Schema.Types.ObjectId,
    ref: 'Match'
  }],
  preferredRoles: {
    type: [String],
    default: []
  },
  favoriteHeroes: {
    type: [String],
    default: []
  },
  lastLoginAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 승률 계산 가상 필드
UserSchema.virtual('winRate').get(function() {
  const totalGames = this.wins + this.losses;
  return totalGames > 0 ? Math.round((this.wins / totalGames) * 100) : 0;
});

// 배틀태그에서 닉네임 추출
UserSchema.pre('save', function(next) {
  if (this.isNew && this.battletag && !this.nickname) {
    this.nickname = this.battletag.split('#')[0];
  }
  next();
});

// 인덱스 생성
UserSchema.index({ bnetId: 1 }, { unique: true });
UserSchema.index({ battletag: 1 });

// 이미 모델이 존재하는지 확인하고, 존재하면 그것을 사용
module.exports = mongoose.models.User || mongoose.model('User', UserSchema); 