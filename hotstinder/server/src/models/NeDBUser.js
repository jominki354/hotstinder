const Datastore = require('nedb');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

// 데이터 디렉토리 생성
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  try {
    fs.mkdirSync(dataDir, { recursive: true });
    logger.info(`NeDBUser: 데이터 디렉토리 생성됨 - ${dataDir}`);
  } catch (err) {
    logger.error(`NeDBUser: 데이터 디렉토리 생성 실패 - ${dataDir}`, err);
  }
}

// 파일 권한 확인 및 수정
const usersDbPath = path.join(dataDir, 'users.db');
try {
  // 파일이 없으면 빈 파일 생성
  if (!fs.existsSync(usersDbPath)) {
    fs.writeFileSync(usersDbPath, '', { encoding: 'utf8' });
    logger.info(`NeDBUser: 빈 데이터베이스 파일 생성됨 - ${usersDbPath}`);
  }
  
  // 읽기/쓰기 권한 확인
  fs.accessSync(usersDbPath, fs.constants.R_OK | fs.constants.W_OK);
} catch (err) {
  logger.error(`NeDBUser: 데이터베이스 파일 접근 오류 - ${usersDbPath}`, err);
  try {
    // 권한 수정 시도
    fs.chmodSync(usersDbPath, 0o666);
    logger.info(`NeDBUser: 데이터베이스 파일 권한 수정됨 - ${usersDbPath}`);
  } catch (chmodErr) {
    logger.error(`NeDBUser: 데이터베이스 파일 권한 수정 실패 - ${usersDbPath}`, chmodErr);
  }
}

// 임시 파일 정리
try {
  const tempFile = `${usersDbPath}~`;
  if (fs.existsSync(tempFile)) {
    fs.unlinkSync(tempFile);
    logger.info(`NeDBUser: 임시 파일 삭제됨 - ${tempFile}`);
  }
} catch (err) {
  logger.warn(`NeDBUser: 임시 파일 삭제 실패`, err);
}

// 사용자 데이터베이스 생성
const db = new Datastore({
  filename: usersDbPath,
  autoload: true,
  // 오류 감지 임계값 조정
  corruptAlertThreshold: 1,
  // 자동 압축 옵션
  autocompactInterval: 30000 // 30초마다 자동 압축
});

// 데이터베이스 로드
db.loadDatabase(err => {
  if (err) {
    logger.error('NeDBUser: 데이터베이스 로드 오류', err);
  } else {
    logger.info('NeDBUser: 데이터베이스 로드 성공');
  }
});

// 인덱스 생성
db.ensureIndex({ fieldName: 'bnetId', unique: true }, err => {
  if (err) logger.warn('NeDBUser: 인덱스 생성 오류 (bnetId)', err);
});

db.ensureIndex({ fieldName: 'battletag' }, err => {
  if (err) logger.warn('NeDBUser: 인덱스 생성 오류 (battletag)', err);
});

db.ensureIndex({ fieldName: 'adminUsername', sparse: true }, err => {
  if (err) logger.warn('NeDBUser: 인덱스 생성 오류 (adminUsername)', err);
});

db.ensureIndex({ fieldName: 'isDummy' }, err => {
  if (err) logger.warn('NeDBUser: 인덱스 생성 오류 (isDummy)', err);
});

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
        lastLoginAt: now,
        previousTier: userData.previousTier || 'placement'
      };
      
      // 배틀태그에서 닉네임 추출
      if (!userWithTimestamps.nickname && userWithTimestamps.battletag) {
        userWithTimestamps.nickname = userWithTimestamps.battletag.split('#')[0];
      }

      db.insert(userWithTimestamps, (err, newDoc) => {
        if (err) {
          logger.error('NeDBUser: 사용자 생성 오류', err);
          return reject(err);
        }
        
        // 데이터베이스 변경 후 저장 강제화
        db.persistence.compactDatafile();
        
        logger.debug(`NeDBUser: 사용자 생성됨 - ${newDoc._id}`);
        resolve(newDoc);
      });
    });
  },

  // ID로 사용자 조회
  findById: (id) => {
    return new Promise((resolve, reject) => {
      db.findOne({ _id: id }, (err, doc) => {
        if (err) {
          logger.error(`NeDBUser: ID로 사용자 조회 오류 (${id})`, err);
          return reject(err);
        }
        resolve(doc);
      });
    });
  },

  // battleNet ID로 사용자 조회
  findByBnetId: (bnetId) => {
    return new Promise((resolve, reject) => {
      db.findOne({ bnetId }, (err, doc) => {
        if (err) {
          logger.error(`NeDBUser: BnetID로 사용자 조회 오류 (${bnetId})`, err);
          return reject(err);
        }
        resolve(doc);
      });
    });
  },

  // 관리자 이름으로 사용자 조회
  findByAdminUsername: (adminUsername) => {
    return new Promise((resolve, reject) => {
      db.findOne({ adminUsername, isAdmin: true }, (err, doc) => {
        if (err) {
          logger.error(`NeDBUser: 관리자 이름으로 사용자 조회 오류 (${adminUsername})`, err);
          return reject(err);
        }
        resolve(doc);
      });
    });
  },

  // 모든 사용자 조회
  findAll: () => {
    return new Promise((resolve, reject) => {
      db.find({}, (err, docs) => {
        if (err) {
          logger.error('NeDBUser: 모든 사용자 조회 오류', err);
          return reject(err);
        }
        resolve(docs);
      });
    });
  },

  // 관리자 사용자 조회
  findAdmins: () => {
    return new Promise((resolve, reject) => {
      db.find({ isAdmin: true }, (err, docs) => {
        if (err) {
          logger.error('NeDBUser: 관리자 조회 오류', err);
          return reject(err);
        }
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
        if (err) {
          logger.error(`NeDBUser: 사용자 업데이트 오류 (${id})`, err);
          return reject(err);
        }
        
        if (numReplaced === 0) {
          logger.warn(`NeDBUser: 업데이트할 사용자 없음 (${id})`);
          return resolve(null);
        }
        
        // 데이터베이스 변경 후 저장 강제화
        db.persistence.compactDatafile();
        
        // 업데이트된 문서 반환
        db.findOne({ _id: id }, (err, doc) => {
          if (err) {
            logger.error(`NeDBUser: 업데이트 후 사용자 조회 오류 (${id})`, err);
            return reject(err);
          }
          logger.debug(`NeDBUser: 사용자 업데이트됨 - ${id}`);
          resolve(doc);
        });
      });
    });
  },

  // 사용자 삭제
  delete: (id) => {
    return new Promise((resolve, reject) => {
      db.remove({ _id: id }, {}, (err, numRemoved) => {
        if (err) {
          logger.error(`NeDBUser: 사용자 삭제 오류 (${id})`, err);
          return reject(err);
        }
        
        // 데이터베이스 변경 후 저장 강제화
        db.persistence.compactDatafile();
        
        logger.debug(`NeDBUser: 사용자 삭제됨 - ${id} (${numRemoved}개)`);
        resolve(numRemoved > 0);
      });
    });
  },

  // battleNet ID로 사용자 삭제
  deleteByBnetId: (bnetId) => {
    return new Promise((resolve, reject) => {
      db.remove({ bnetId }, {}, (err, numRemoved) => {
        if (err) {
          logger.error(`NeDBUser: BnetID로 사용자 삭제 오류 (${bnetId})`, err);
          return reject(err);
        }
        
        // 데이터베이스 변경 후 저장 강제화
        db.persistence.compactDatafile();
        
        logger.debug(`NeDBUser: BnetID로 사용자 삭제됨 - ${bnetId} (${numRemoved}개)`);
        resolve(numRemoved > 0);
      });
    });
  },

  // 더미 사용자 조회
  findByDummy: (isDummy) => {
    return new Promise((resolve, reject) => {
      db.find({ isDummy }, (err, docs) => {
        if (err) {
          logger.error('NeDBUser: 더미 사용자 조회 오류', err);
          return reject(err);
        }
        resolve(docs);
      });
    });
  },

  // 더미 사용자 모두 삭제
  deleteAllDummy: () => {
    return new Promise((resolve, reject) => {
      db.remove({ isDummy: true }, { multi: true }, (err, numRemoved) => {
        if (err) {
          logger.error('NeDBUser: 더미 사용자 삭제 오류', err);
          return reject(err);
        }
        
        // 데이터베이스 변경 후 저장 강제화
        db.persistence.compactDatafile();
        
        logger.debug(`NeDBUser: 모든 더미 사용자 삭제됨 (${numRemoved}개)`);
        resolve(numRemoved);
      });
    });
  },
  
  // 다중 사용자 삭제 (관리자 도구용)
  deleteMany: (query) => {
    return new Promise((resolve, reject) => {
      db.remove(query, { multi: true }, (err, numRemoved) => {
        if (err) {
          logger.error('NeDBUser: 다중 사용자 삭제 오류', err);
          return reject(err);
        }
        
        // 데이터베이스 변경 후 저장 강제화
        db.persistence.compactDatafile();
        
        logger.debug(`NeDBUser: 다중 사용자 삭제됨 (${numRemoved}개)`);
        resolve(numRemoved);
      });
    });
  },
  
  // 데이터베이스 동기화
  compactDatabase: () => {
    return new Promise((resolve, reject) => {
      db.persistence.compactDatafile();
      
      // 비동기 작업이므로 약간의 지연 후 성공 반환
      setTimeout(() => {
        logger.info('NeDBUser: 데이터베이스 압축 완료');
        resolve(true);
      }, 500);
    });
  },

  // JWT 토큰 생성 메서드
  generateAuthToken: function(user) {
    return jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'your-jwt-secret', {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
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