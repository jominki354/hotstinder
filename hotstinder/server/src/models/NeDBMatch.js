const Datastore = require('nedb');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

// 데이터 디렉토리 생성
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  try {
    fs.mkdirSync(dataDir, { recursive: true });
    logger.info(`NeDBMatch: 데이터 디렉토리 생성됨 - ${dataDir}`);
  } catch (err) {
    logger.error(`NeDBMatch: 데이터 디렉토리 생성 실패 - ${dataDir}`, err);
  }
}

// 파일 권한 확인 및 수정
const matchesDbPath = path.join(dataDir, 'matches.db');
try {
  // 파일이 없으면 빈 파일 생성
  if (!fs.existsSync(matchesDbPath)) {
    fs.writeFileSync(matchesDbPath, '', { encoding: 'utf8' });
    logger.info(`NeDBMatch: 빈 데이터베이스 파일 생성됨 - ${matchesDbPath}`);
  }
  
  // 읽기/쓰기 권한 확인
  fs.accessSync(matchesDbPath, fs.constants.R_OK | fs.constants.W_OK);
} catch (err) {
  logger.error(`NeDBMatch: 데이터베이스 파일 접근 오류 - ${matchesDbPath}`, err);
  try {
    // 권한 수정 시도
    fs.chmodSync(matchesDbPath, 0o666);
    logger.info(`NeDBMatch: 데이터베이스 파일 권한 수정됨 - ${matchesDbPath}`);
  } catch (chmodErr) {
    logger.error(`NeDBMatch: 데이터베이스 파일 권한 수정 실패 - ${matchesDbPath}`, chmodErr);
  }
}

// 임시 파일 정리
try {
  const tempFile = `${matchesDbPath}~`;
  if (fs.existsSync(tempFile)) {
    fs.unlinkSync(tempFile);
    logger.info(`NeDBMatch: 임시 파일 삭제됨 - ${tempFile}`);
  }
} catch (err) {
  logger.warn(`NeDBMatch: 임시 파일 삭제 실패`, err);
}

// 매치 데이터베이스 생성
const db = new Datastore({
  filename: matchesDbPath,
  autoload: true,
  // 오류 감지 임계값 조정
  corruptAlertThreshold: 1,
  // 자동 압축 옵션
  autocompactInterval: 30000 // 30초마다 자동 압축
});

// 데이터베이스 로드
db.loadDatabase(err => {
  if (err) {
    logger.error('NeDBMatch: 데이터베이스 로드 오류', err);
  } else {
    logger.info('NeDBMatch: 데이터베이스 로드 성공');
  }
});

// 인덱스 생성
db.ensureIndex({ fieldName: 'status' }, err => {
  if (err) logger.warn('NeDBMatch: 인덱스 생성 오류 (status)', err);
});

db.ensureIndex({ fieldName: 'createdAt' }, err => {
  if (err) logger.warn('NeDBMatch: 인덱스 생성 오류 (createdAt)', err);
});

db.ensureIndex({ fieldName: 'isDummy' }, err => {
  if (err) logger.warn('NeDBMatch: 인덱스 생성 오류 (isDummy)', err);
});

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
        if (err) {
          logger.error('NeDBMatch: 매치 생성 오류', err);
          return reject(err);
        }
        
        // 데이터베이스 변경 후 저장 강제화
        db.persistence.compactDatafile();
        
        logger.debug(`NeDBMatch: 매치 생성됨 - ${newDoc._id}`);
        resolve(newDoc);
      });
    });
  },

  // ID로 매치 조회
  findById: (id) => {
    return new Promise((resolve, reject) => {
      db.findOne({ _id: id }, (err, doc) => {
        if (err) {
          logger.error(`NeDBMatch: ID로 매치 조회 오류 (${id})`, err);
          return reject(err);
        }
        resolve(doc);
      });
    });
  },

  // 모든 매치 조회
  findAll: () => {
    return new Promise((resolve, reject) => {
      db.find({}, (err, docs) => {
        if (err) {
          logger.error('NeDBMatch: 모든 매치 조회 오류', err);
          return reject(err);
        }
        resolve(docs);
      });
    });
  },

  // 상태별 매치 조회
  findByStatus: (status) => {
    return new Promise((resolve, reject) => {
      db.find({ status }, (err, docs) => {
        if (err) {
          logger.error(`NeDBMatch: 상태별 매치 조회 오류 (${status})`, err);
          return reject(err);
        }
        resolve(docs);
      });
    });
  },

  // 플레이어가 참여한 매치 조회
  findByPlayer: (userId) => {
    return new Promise((resolve, reject) => {
      // NeDB에서는 복잡한 쿼리를 지원하지 않으므로 모든 매치를 가져와서 필터링
      db.find({}, (err, docs) => {
        if (err) {
          logger.error(`NeDBMatch: 플레이어별 매치 조회 오류 (${userId})`, err);
          return reject(err);
        }
        
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
        if (err) {
          logger.error(`NeDBMatch: 매치 업데이트 오류 (${id})`, err);
          return reject(err);
        }
        
        if (numReplaced === 0) {
          logger.warn(`NeDBMatch: 업데이트할 매치 없음 (${id})`);
          return resolve(null);
        }
        
        // 데이터베이스 변경 후 저장 강제화
        db.persistence.compactDatafile();
        
        // 업데이트된 문서 반환
        db.findOne({ _id: id }, (err, doc) => {
          if (err) {
            logger.error(`NeDBMatch: 업데이트 후 매치 조회 오류 (${id})`, err);
            return reject(err);
          }
          logger.debug(`NeDBMatch: 매치 업데이트됨 - ${id}`);
          resolve(doc);
        });
      });
    });
  },

  // 매치 삭제
  delete: (id) => {
    return new Promise((resolve, reject) => {
      db.remove({ _id: id }, {}, (err, numRemoved) => {
        if (err) {
          logger.error(`NeDBMatch: 매치 삭제 오류 (${id})`, err);
          return reject(err);
        }
        
        // 데이터베이스 변경 후 저장 강제화
        db.persistence.compactDatafile();
        
        logger.debug(`NeDBMatch: 매치 삭제됨 - ${id} (${numRemoved}개)`);
        resolve(numRemoved > 0);
      });
    });
  },

  // 더미 매치 조회
  findByDummy: (isDummy) => {
    return new Promise((resolve, reject) => {
      db.find({ isDummy }, (err, docs) => {
        if (err) {
          logger.error('NeDBMatch: 더미 매치 조회 오류', err);
          return reject(err);
        }
        resolve(docs);
      });
    });
  },

  // 더미 매치 모두 삭제
  deleteAllDummy: () => {
    return new Promise((resolve, reject) => {
      db.remove({ isDummy: true }, { multi: true }, (err, numRemoved) => {
        if (err) {
          logger.error('NeDBMatch: 더미 매치 삭제 오류', err);
          return reject(err);
        }
        
        // 데이터베이스 변경 후 저장 강제화
        db.persistence.compactDatafile();
        
        logger.debug(`NeDBMatch: 모든 더미 매치 삭제됨 (${numRemoved}개)`);
        resolve(numRemoved);
      });
    });
  },
  
  // 다중 매치 삭제 (관리자 도구용)
  deleteMany: (query) => {
    return new Promise((resolve, reject) => {
      db.remove(query, { multi: true }, (err, numRemoved) => {
        if (err) {
          logger.error('NeDBMatch: 다중 매치 삭제 오류', err);
          return reject(err);
        }
        
        // 데이터베이스 변경 후 저장 강제화
        db.persistence.compactDatafile();
        
        logger.debug(`NeDBMatch: 다중 매치 삭제됨 (${numRemoved}개)`);
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
        logger.info('NeDBMatch: 데이터베이스 압축 완료');
        resolve(true);
      }, 500);
    });
  },

  // 최근 매치 조회 (제한 수와 함께)
  findRecent: (limit = 10) => {
    return new Promise((resolve, reject) => {
      db.find({}).sort({ createdAt: -1 }).limit(limit).exec((err, docs) => {
        if (err) {
          logger.error(`NeDBMatch: 최근 매치 조회 오류 (limit: ${limit})`, err);
          return reject(err);
        }
        resolve(docs);
      });
    });
  },

  // 특정 기간 이후의 매치 수 계산
  countSince: (date) => {
    return new Promise((resolve, reject) => {
      db.count({ createdAt: { $gte: date } }, (err, count) => {
        if (err) {
          logger.error(`NeDBMatch: 매치 수 계산 오류 (since: ${date})`, err);
          return reject(err);
        }
        resolve(count);
      });
    });
  }
};

module.exports = MatchModel; 