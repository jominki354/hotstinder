const Datastore = require('nedb');
const path = require('path');
const fs = require('fs');

// 데이터 디렉토리 생성
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 사용자 데이터베이스 생성
const db = new Datastore({
  filename: path.join(dataDir, 'users.db'),
  autoload: true
});

// 인덱스 생성
db.ensureIndex({ fieldName: 'bnetId', unique: true });
db.ensureIndex({ fieldName: 'battletag' });
db.ensureIndex({ fieldName: 'adminUsername', sparse: true });
db.ensureIndex({ fieldName: 'isDummy' }); // 더미 데이터 인덱스

const UserModel = {
  // 사용자 생성
  create: (userData) => {
    return new Promise((resolve, reject) => {
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

      db.insert(userWithTimestamps, (err, newDoc) => {
        if (err) return reject(err);
        resolve(newDoc);
      });
    });
  },

  // ID로 사용자 조회
  findById: (id) => {
    return new Promise((resolve, reject) => {
      db.findOne({ _id: id }, (err, doc) => {
        if (err) return reject(err);
        resolve(doc);
      });
    });
  },

  // battleNet ID로 사용자 조회
  findByBnetId: (bnetId) => {
    return new Promise((resolve, reject) => {
      db.findOne({ bnetId }, (err, doc) => {
        if (err) return reject(err);
        resolve(doc);
      });
    });
  },

  // 관리자 이름으로 사용자 조회
  findByAdminUsername: (adminUsername) => {
    return new Promise((resolve, reject) => {
      db.findOne({ adminUsername, isAdmin: true }, (err, doc) => {
        if (err) return reject(err);
        resolve(doc);
      });
    });
  },

  // 모든 사용자 조회
  findAll: () => {
    return new Promise((resolve, reject) => {
      db.find({}, (err, docs) => {
        if (err) return reject(err);
        resolve(docs);
      });
    });
  },

  // 관리자 사용자 조회
  findAdmins: () => {
    return new Promise((resolve, reject) => {
      db.find({ isAdmin: true }, (err, docs) => {
        if (err) return reject(err);
        resolve(docs);
      });
    });
  },

  // 사용자 업데이트
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

  // 사용자 삭제
  delete: (id) => {
    return new Promise((resolve, reject) => {
      db.remove({ _id: id }, {}, (err, numRemoved) => {
        if (err) return reject(err);
        resolve(numRemoved > 0);
      });
    });
  },

  // battleNet ID로 사용자 삭제
  deleteByBnetId: (bnetId) => {
    return new Promise((resolve, reject) => {
      db.remove({ bnetId }, {}, (err, numRemoved) => {
        if (err) return reject(err);
        resolve(numRemoved > 0);
      });
    });
  },

  // 더미 사용자 조회
  findByDummy: (isDummy) => {
    return new Promise((resolve, reject) => {
      db.find({ isDummy }, (err, docs) => {
        if (err) return reject(err);
        resolve(docs);
      });
    });
  },

  // 더미 사용자 모두 삭제
  deleteAllDummy: () => {
    return new Promise((resolve, reject) => {
      db.remove({ isDummy: true }, { multi: true }, (err, numRemoved) => {
        if (err) return reject(err);
        resolve(numRemoved);
      });
    });
  },

  // JWT 토큰 생성 메서드
  generateAuthToken: function(user) {
    const jwt = require('jsonwebtoken');
    return jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN
    });
  },

  // 승률 계산 메서드
  getWinRate: function(user) {
    const totalGames = user.playerStats?.totalGames || 0;
    const wins = user.playerStats?.wins || 0;
    if (totalGames === 0) return 0;
    return Math.round((wins / totalGames) * 100);
  }
};

module.exports = UserModel; 