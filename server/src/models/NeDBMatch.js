const Datastore = require('nedb');
const path = require('path');
const fs = require('fs');

// 데이터 디렉토리 생성
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 매치 데이터베이스 생성
const db = new Datastore({
  filename: path.join(dataDir, 'matches.db'),
  autoload: true
});

// 인덱스 생성
db.ensureIndex({ fieldName: 'status' });
db.ensureIndex({ fieldName: 'createdAt' });
db.ensureIndex({ fieldName: 'isDummy' }); // 더미 데이터 인덱스

const MatchModel = {
  // 매치 생성
  create: (matchData) => {
    return new Promise((resolve, reject) => {
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

      db.insert(matchWithTimestamps, (err, newDoc) => {
        if (err) return reject(err);
        resolve(newDoc);
      });
    });
  },

  // ID로 매치 조회
  findById: (id) => {
    return new Promise((resolve, reject) => {
      db.findOne({ _id: id }, (err, doc) => {
        if (err) return reject(err);
        resolve(doc);
      });
    });
  },

  // 모든 매치 조회
  findAll: () => {
    return new Promise((resolve, reject) => {
      db.find({}, (err, docs) => {
        if (err) return reject(err);
        resolve(docs);
      });
    });
  },

  // 상태별 매치 조회
  findByStatus: (status) => {
    return new Promise((resolve, reject) => {
      db.find({ status }, (err, docs) => {
        if (err) return reject(err);
        resolve(docs);
      });
    });
  },

  // 플레이어가 참여한 매치 조회
  findByPlayer: (userId) => {
    return new Promise((resolve, reject) => {
      // NeDB에서는 복잡한 쿼리를 지원하지 않으므로 모든 매치를 가져와서 필터링
      db.find({}, (err, docs) => {
        if (err) return reject(err);
        
        // 플레이어가 포함된 매치 필터링
        const matches = docs.filter(match => {
          const blueTeam = match.teams?.blue || [];
          const redTeam = match.teams?.red || [];
          
          // blue 또는 red 팀에 유저가 있는지 확인
          const inBlue = blueTeam.some(player => 
            player.user && player.user.toString() === userId.toString());
          const inRed = redTeam.some(player => 
            player.user && player.user.toString() === userId.toString());
            
          return inBlue || inRed;
        });
        
        resolve(matches);
      });
    });
  },

  // 매치 업데이트
  update: (id, updateData) => {
    return new Promise((resolve, reject) => {
      // 업데이트 시간 추가
      const updateWithTimestamp = {
        ...updateData,
        updatedAt: new Date()
      };
      
      db.update({ _id: id }, { $set: updateWithTimestamp }, {}, (err, numReplaced) => {
        if (err) return reject(err);
        
        if (numReplaced === 0) {
          return resolve(null);
        }
        
        // 업데이트된 문서 반환
        db.findOne({ _id: id }, (err, doc) => {
          if (err) return reject(err);
          resolve(doc);
        });
      });
    });
  },

  // 매치 삭제
  delete: (id) => {
    return new Promise((resolve, reject) => {
      db.remove({ _id: id }, {}, (err, numRemoved) => {
        if (err) return reject(err);
        resolve(numRemoved > 0);
      });
    });
  },

  // 더미 매치 조회
  findByDummy: (isDummy) => {
    return new Promise((resolve, reject) => {
      db.find({ isDummy }, (err, docs) => {
        if (err) return reject(err);
        resolve(docs);
      });
    });
  },

  // 더미 매치 모두 삭제
  deleteAllDummy: () => {
    return new Promise((resolve, reject) => {
      db.remove({ isDummy: true }, { multi: true }, (err, numRemoved) => {
        if (err) return reject(err);
        resolve(numRemoved);
      });
    });
  },

  // 최근 매치 조회 (제한 수와 함께)
  findRecent: (limit = 10) => {
    return new Promise((resolve, reject) => {
      db.find({}).sort({ createdAt: -1 }).limit(limit).exec((err, docs) => {
        if (err) return reject(err);
        resolve(docs);
      });
    });
  },

  // 특정 기간 이후의 매치 수 계산
  countSince: (date) => {
    return new Promise((resolve, reject) => {
      db.count({ createdAt: { $gte: date } }, (err, count) => {
        if (err) return reject(err);
        resolve(count);
      });
    });
  }
};

module.exports = MatchModel; 