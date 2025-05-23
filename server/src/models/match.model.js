const mongoose = require('mongoose');
const { Schema } = mongoose;

// 매치 스키마 정의
const matchSchema = new Schema({
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
      role: String,
      hero: String,
      stats: {
        kills: Number,
        deaths: Number,
        assists: Number,
        heroicDamage: Number,
        siegeDamage: Number,
        healing: Number
      }
    }],
    red: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      role: String,
      hero: String,
      stats: {
        kills: Number,
        deaths: Number,
        assists: Number,
        heroicDamage: Number,
        siegeDamage: Number,
        healing: Number
      }
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
        type: Schema.Types.ObjectId,
        ref: 'User'
      }
    }],
    default: []
  },
  mmrChanges: {
    type: [{
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      before: Number,
      after: Number,
      change: Number,
      battletag: String
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
  }
}, {
  timestamps: true,
  strictPopulate: false
});

// 인덱스 설정
matchSchema.index({ status: 1 });
matchSchema.index({ createdAt: -1 });
matchSchema.index({ scheduledTime: 1 });
matchSchema.index({ isDummy: 1 });

// 기존 모델이 존재하면 재사용, 없으면 새로 생성
let Match;
try {
  Match = mongoose.model('Match');
} catch (e) {
  Match = mongoose.model('Match', matchSchema);
}

module.exports = Match; 