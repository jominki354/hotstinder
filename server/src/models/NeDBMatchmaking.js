const Datastore = require('nedb');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

// 데이터 디렉토리 생성
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  try {
    fs.mkdirSync(dataDir, { recursive: true });
    logger.info(`NeDBMatchmaking: 데이터 디렉토리 생성됨 - ${dataDir}`);
  } catch (err) {
    logger.error(`NeDBMatchmaking: 데이터 디렉토리 생성 실패 - ${dataDir}`, err);
  }
}

// 파일 권한 확인 및 수정
const matchmakingDbPath = path.join(dataDir, 'matchmaking.db');
try {
  // 파일이 없으면 빈 파일 생성
  if (!fs.existsSync(matchmakingDbPath)) {
    fs.writeFileSync(matchmakingDbPath, '', { encoding: 'utf8' });
    logger.info(`NeDBMatchmaking: 빈 데이터베이스 파일 생성됨 - ${matchmakingDbPath}`);
  }
  
  // 읽기/쓰기 권한 확인
  fs.accessSync(matchmakingDbPath, fs.constants.R_OK | fs.constants.W_OK);
} catch (err) {
  logger.error(`NeDBMatchmaking: 데이터베이스 파일 접근 오류 - ${matchmakingDbPath}`, err);
  try {
    // 권한 수정 시도
    fs.chmodSync(matchmakingDbPath, 0o666);
    logger.info(`NeDBMatchmaking: 데이터베이스 파일 권한 수정됨 - ${matchmakingDbPath}`);
  } catch (chmodErr) {
    logger.error(`NeDBMatchmaking: 데이터베이스 파일 권한 수정 실패 - ${matchmakingDbPath}`, chmodErr);
  }
}

// 임시 파일 정리
try {
  const tempFile = `${matchmakingDbPath}~`;
  if (fs.existsSync(tempFile)) {
    fs.unlinkSync(tempFile);
    logger.info(`NeDBMatchmaking: 임시 파일 삭제됨 - ${tempFile}`);
  }
} catch (err) {
  logger.warn(`NeDBMatchmaking: 임시 파일 삭제 실패`, err);
}

// 매치메이킹 데이터베이스 생성
const db = new Datastore({
  filename: matchmakingDbPath,
  autoload: true,
  // 오류 감지 임계값 조정
  corruptAlertThreshold: 1,
  // 자동 압축 옵션
  autocompactInterval: 30000 // 30초마다 자동 압축
});

// 데이터베이스 로드
db.loadDatabase(err => {
  if (err) {
    logger.error('NeDBMatchmaking: 데이터베이스 로드 오류', err);
  } else {
    logger.info('NeDBMatchmaking: 데이터베이스 로드 성공');
  }
});

// 인덱스 생성
db.ensureIndex({ fieldName: 'userId' }, err => {
  if (err) logger.warn('NeDBMatchmaking: 인덱스 생성 오류 (userId)', err);
});

db.ensureIndex({ fieldName: 'status' }, err => {
  if (err) logger.warn('NeDBMatchmaking: 인덱스 생성 오류 (status)', err);
});

db.ensureIndex({ fieldName: 'joinedAt' }, err => {
  if (err) logger.warn('NeDBMatchmaking: 인덱스 생성 오류 (joinedAt)', err);
});

// NeDB 매치메이킹 모델
const MatchmakingModel = {
  // 큐에 플레이어 추가
  enqueue: (playerData) => {
    return new Promise((resolve, reject) => {
      // 이미 큐에 있는지 확인
      db.findOne({ 
        userId: playerData.userId,
        status: 'searching'
      }, (err, existing) => {
        if (err) {
          logger.error('NeDBMatchmaking: 큐 검색 오류', err);
          return reject(err);
        }
        
        if (existing) {
          logger.info(`플레이어가 이미 큐에 있습니다: ${playerData.nickname}`);
          return resolve(existing);
        }
        
        // 새 큐 항목 생성
        const queueItem = {
          userId: playerData.userId,
          bnetId: playerData.bnetId,
          battletag: playerData.battletag,
          nickname: playerData.nickname,
          mmr: playerData.mmr || 1500,
          preferredRoles: playerData.preferredRoles || ['전체'],
          joinedAt: new Date(),
          status: 'searching',
          matchId: null,
          isDummy: playerData.isDummy || false,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        db.insert(queueItem, (err, newDoc) => {
          if (err) {
            logger.error('NeDBMatchmaking: 큐 추가 오류', err);
            return reject(err);
          }
          
          // 데이터베이스 변경 후 저장 강제화
          db.persistence.compactDatafile();
          
          logger.info(`플레이어가 큐에 추가됨: ${playerData.nickname}`);
          resolve(newDoc);
        });
      });
    });
  },
  
  // 큐에서 플레이어 제거
  dequeue: (userId) => {
    return new Promise((resolve, reject) => {
      db.findOne({ userId, status: 'searching' }, (err, doc) => {
        if (err) {
          logger.error('NeDBMatchmaking: 큐 검색 오류', err);
          return reject(err);
        }
        
        if (!doc) {
          return resolve(null);
        }
        
        // 상태 업데이트
        db.update(
          { _id: doc._id },
          { $set: { status: 'canceled', updatedAt: new Date() } },
          {},
          (err, numUpdated) => {
            if (err) {
              logger.error('NeDBMatchmaking: 큐 상태 업데이트 오류', err);
              return reject(err);
            }
            
            // 업데이트된 문서 반환
            db.findOne({ _id: doc._id }, (err, updatedDoc) => {
              if (err) {
                logger.error('NeDBMatchmaking: 업데이트된 문서 조회 오류', err);
                return reject(err);
              }
              
              logger.info(`플레이어가 큐에서 제거됨: ${doc.nickname}`);
              resolve(updatedDoc);
            });
          }
        );
      });
    });
  },
  
  // 큐에 있는 모든 플레이어 조회
  getQueue: () => {
    return new Promise((resolve, reject) => {
      db.find({ status: 'searching' })
        .sort({ joinedAt: 1 }) // 먼저 추가된 순서대로 정렬
        .exec((err, docs) => {
          if (err) {
            logger.error('NeDBMatchmaking: 큐 조회 오류', err);
            return reject(err);
          }
          resolve(docs);
        });
    });
  },
  
  // 특정 플레이어가 큐에 있는지 확인
  isInQueue: (userId) => {
    return new Promise((resolve, reject) => {
      db.count({ userId, status: 'searching' }, (err, count) => {
        if (err) {
          logger.error('NeDBMatchmaking: 큐 상태 확인 오류', err);
          return reject(err);
        }
        resolve(count > 0);
      });
    });
  },
  
  // 매치가 이루어진 플레이어들 상태 업데이트
  updateMatchedPlayers: (playerIds, matchId) => {
    return new Promise((resolve, reject) => {
      db.update(
        { userId: { $in: playerIds }, status: 'searching' },
        { $set: { status: 'matched', matchId, matchedAt: new Date(), updatedAt: new Date() } },
        { multi: true },
        (err, numUpdated) => {
          if (err) {
            logger.error('NeDBMatchmaking: 매치 상태 업데이트 오류', err);
            return reject(err);
          }
          
          logger.info(`${numUpdated}명의 플레이어가 매치되었습니다.`);
          resolve(numUpdated);
        }
      );
    });
  },
  
  // 큐 통계 조회
  getQueueStats: () => {
    return new Promise((resolve, reject) => {
      // 검색 중인 총 플레이어 수
      db.count({ status: 'searching' }, (err, totalInQueue) => {
        if (err) {
          logger.error('NeDBMatchmaking: 큐 통계 조회 오류', err);
          return reject(err);
        }
        
        // 역할별 통계 - 이 부분은 NeDB에서는 복잡하므로 직접 계산
        db.find({ status: 'searching' }, (err, docs) => {
          if (err) {
            logger.error('NeDBMatchmaking: 큐 통계 조회 오류', err);
            return reject(err);
          }
          
          // 역할별 통계 계산
          const roleCounts = {};
          for (const doc of docs) {
            if (doc.preferredRoles && Array.isArray(doc.preferredRoles)) {
              for (const role of doc.preferredRoles) {
                roleCounts[role] = (roleCounts[role] || 0) + 1;
              }
            }
          }
          
          const byRole = Object.entries(roleCounts).map(([role, count]) => ({
            _id: role,
            count
          })).sort((a, b) => a._id.localeCompare(b._id));
          
          // MMR 구간별 통계
          const mmrRanges = [
            { min: 0, max: 1400, name: '브론즈' },
            { min: 1400, max: 1600, name: '실버' },
            { min: 1600, max: 1800, name: '골드' },
            { min: 1800, max: 2000, name: '플래티넘' },
            { min: 2000, max: 2200, name: '다이아몬드' },
            { min: 2200, max: 10000, name: '마스터' },
          ];
          
          // MMR 구간별 통계 계산
          const mmrCounts = {};
          for (const doc of docs) {
            const mmr = doc.mmr || 1500;
            for (const range of mmrRanges) {
              if (mmr >= range.min && mmr < range.max) {
                mmrCounts[range.name] = (mmrCounts[range.name] || 0) + 1;
                break;
              }
            }
          }
          
          const byMmr = mmrRanges.map(range => ({
            tier: range.name,
            count: mmrCounts[range.name] || 0
          }));
          
          resolve({
            totalInQueue,
            byRole,
            byMmr,
            updatedAt: new Date()
          });
        });
      });
    });
  },
  
  // 큐 초기화
  clearQueue: () => {
    return new Promise((resolve, reject) => {
      db.update(
        { status: 'searching' },
        { $set: { status: 'canceled', updatedAt: new Date() } },
        { multi: true },
        (err, numUpdated) => {
          if (err) {
            logger.error('NeDBMatchmaking: 큐 초기화 오류', err);
            return reject(err);
          }
          
          logger.info(`${numUpdated}명의 플레이어가 큐에서 제거되었습니다.`);
          resolve(numUpdated);
        }
      );
    });
  },
  
  // 더미 플레이어 추가
  addDummyPlayers: (count = 5) => {
    return new Promise((resolve, reject) => {
      // 더미 플레이어 생성
      const dummies = [];
      const roles = ['탱커', '투사', '원거리 암살자', '근접 암살자', '지원가', '힐러'];
      const tiers = ['브론즈', '실버', '골드', '플래티넘', '다이아몬드', '마스터'];
      
      for (let i = 0; i < count; i++) {
        const tier = tiers[Math.floor(Math.random() * tiers.length)];
        const mmr = 1000 + Math.floor(Math.random() * 1500); // 랜덤 MMR
        const preferredRoles = [roles[Math.floor(Math.random() * roles.length)]];
        if (Math.random() > 0.7) {
          preferredRoles.push(roles[Math.floor(Math.random() * roles.length)]);
        }
        
        dummies.push({
          userId: `dummy-${Date.now()}-${i}`,
          bnetId: `dummy-bnet-${Date.now()}-${i}`,
          battletag: `DummyPlayer#${1000 + i}`,
          nickname: `더미플레이어${i+1}`,
          mmr,
          preferredRoles,
          joinedAt: new Date(),
          status: 'searching',
          matchId: null,
          isDummy: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      // 더미 플레이어 일괄 추가
      db.insert(dummies, (err, newDocs) => {
        if (err) {
          logger.error('NeDBMatchmaking: 더미 플레이어 추가 오류', err);
          return reject(err);
        }
        
        // 데이터베이스 변경 후 저장 강제화
        db.persistence.compactDatafile();
        
        logger.info(`${newDocs.length}명의 더미 플레이어가 큐에 추가되었습니다.`);
        resolve(newDocs);
      });
    });
  }
};

module.exports = MatchmakingModel; 