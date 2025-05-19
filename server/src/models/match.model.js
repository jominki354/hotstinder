const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const matchSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  gameMode: {
    type: String,
    enum: ['Standard', 'ARAM', 'Custom'],
    default: 'Standard'
  },
  maxPlayers: {
    type: Number,
    default: 10
  },
  map: {
    type: String,
    default: 'Random'
  },
  status: {
    type: String,
    enum: ['open', 'full', 'in_progress', 'completed', 'canceled'],
    default: 'open'
  },
  password: {
    type: String,
    default: null
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  isDummy: {
    type: Boolean,
    default: false
  },
  teams: {
    blue: [{
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      hero: {
        type: String,
        default: null
      },
      role: {
        type: String,
        enum: ['tank', 'bruiser', 'healer', 'ranged_assassin', 'melee_assassin', 'support', 'any'],
        default: 'any'
      }
    }],
    red: [{
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      hero: {
        type: String,
        default: null
      },
      role: {
        type: String,
        enum: ['tank', 'bruiser', 'healer', 'ranged_assassin', 'melee_assassin', 'support', 'any'],
        default: 'any'
      }
    }]
  },
  balanceType: {
    type: String,
    enum: ['manual', 'mmr', 'random'],
    default: 'mmr'
  },
  spectators: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  chat: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    message: {
      type: String
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  result: {
    winner: {
      type: String,
      enum: ['blue', 'red', 'draw', null],
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
  scheduledTime: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 진행 중인 매치 검색 인덱스
matchSchema.index({ status: 1, scheduledTime: 1 });

// 매치의 현재 플레이어 수 계산
matchSchema.methods.getPlayerCount = function() {
  return this.teams.blue.length + this.teams.red.length;
};

// 매치가 가득 찼는지 확인
matchSchema.methods.isFull = function() {
  return this.getPlayerCount() >= this.maxPlayers;
};

// 플레이어 참가
matchSchema.methods.addPlayer = function(userId, team = null) {
  // 팀이 지정되지 않았으면 인원수가 적은 팀에 배정
  if (!team) {
    team = this.teams.blue.length <= this.teams.red.length ? 'blue' : 'red';
  }
  
  // 이미 참가된 플레이어인지 확인
  const isAlreadyInBlue = this.teams.blue.some(player => player.user.toString() === userId.toString());
  const isAlreadyInRed = this.teams.red.some(player => player.user.toString() === userId.toString());
  
  if (isAlreadyInBlue || isAlreadyInRed) {
    return false;
  }
  
  // 팀에 플레이어 추가
  this.teams[team].push({ user: userId });
  
  // 매치가 가득 찼으면 상태 업데이트
  if (this.isFull()) {
    this.status = 'full';
  }
  
  return true;
};

module.exports = mongoose.model('Match', matchSchema); 