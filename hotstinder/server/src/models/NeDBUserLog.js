const Datastore = require('nedb');
const path = require('path');
const fs = require('fs');

// 데이터 디렉토리 생성
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 사용자 로그 데이터베이스 생성
const db = new Datastore({
  filename: path.join(dataDir, 'user_logs.db'),
  autoload: true
});

// 인덱스 생성
db.ensureIndex({ fieldName: 'userId' });
db.ensureIndex({ fieldName: 'bnetId' });
db.ensureIndex({ fieldName: 'timestamp' });

const UserLogModel = {
  // 로그 생성
  create: (logData) => {
    return new Promise((resolve, reject) => {
      // 타임스탬프 추가
      const now = new Date();
      const logWithTimestamp = {
        ...logData,
        timestamp: now,
        createdAt: now
      };
      
      db.insert(logWithTimestamp, (err, newDoc) => {
        if (err) return reject(err);
        resolve(newDoc);
      });
    });
  },

  // 사용자 ID로 로그 조회
  findByUserId: (userId, limit = 50) => {
    return new Promise((resolve, reject) => {
      db.find({ userId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .exec((err, docs) => {
          if (err) return reject(err);
          resolve(docs);
        });
    });
  },

  // BattleNet ID로 로그 조회
  findByBnetId: (bnetId, limit = 50) => {
    return new Promise((resolve, reject) => {
      db.find({ bnetId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .exec((err, docs) => {
          if (err) return reject(err);
          resolve(docs);
        });
    });
  },

  // 모든 로그 조회
  findAll: (limit = 100) => {
    return new Promise((resolve, reject) => {
      db.find({})
        .sort({ timestamp: -1 })
        .limit(limit)
        .exec((err, docs) => {
          if (err) return reject(err);
          resolve(docs);
        });
    });
  },

  // 로그 삭제
  delete: (id) => {
    return new Promise((resolve, reject) => {
      db.remove({ _id: id }, {}, (err, numRemoved) => {
        if (err) return reject(err);
        resolve(numRemoved > 0);
      });
    });
  },

  // 사용자 관련 로그 모두 삭제
  deleteByUserId: (userId) => {
    return new Promise((resolve, reject) => {
      db.remove({ userId }, { multi: true }, (err, numRemoved) => {
        if (err) return reject(err);
        resolve(numRemoved);
      });
    });
  },

  // 오래된 로그 삭제 (날짜 기준)
  deleteOlderThan: (date) => {
    return new Promise((resolve, reject) => {
      db.remove({ timestamp: { $lt: date } }, { multi: true }, (err, numRemoved) => {
        if (err) return reject(err);
        resolve(numRemoved);
      });
    });
  }
};

module.exports = UserLogModel; 