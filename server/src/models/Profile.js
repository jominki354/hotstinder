const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProfileSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  nickname: {
    type: String,
    required: true
  },
  bio: {
    type: String,
    default: ''
  },
  preferredRoles: [{
    type: String,
    enum: ['탱커', '투사', '브루저', '원거리 암살자', '근접 암살자', '지원가', '힐러', '서포터', '전체']
  }],
  previousTier: {
    type: String,
    enum: ['placement', 'bronze', 'silver', 'gold', 'platinum', 'diamond', 'master', 'grandmaster'],
    default: 'placement'
  },
  favoriteHeroes: [String],
  playTimes: [{
    day: {
      type: String,
      enum: ['월', '화', '수', '목', '금', '토', '일']
    },
    startTime: String,
    endTime: String
  }],
  socialLinks: {
    discord: String,
    twitter: String,
    twitch: String
  },
  region: {
    type: String,
    default: 'kr'
  },
  avatar: {
    type: String,
    default: '/default-avatar.png'
  }
}, {
  timestamps: true
});

// 이미 모델이 존재하는지 확인하고, 존재하면 그것을 사용
module.exports = mongoose.models.Profile || mongoose.model('Profile', ProfileSchema);