#!/usr/bin/env node

/**
 * NeDB 데이터베이스 파일 권한 수정 및 복구 도구
 * 
 * 이 스크립트는 NeDB 데이터베이스 파일의 권한 문제를 해결하고,
 * 손상된 파일을 정리하며, 정상적인 작동을 위한 환경을 설정합니다.
 */

const fs = require('fs');
const path = require('path');

// 로깅 유틸리티
const log = {
  info: (message) => console.log(`[INFO] ${message}`),
  warn: (message) => console.log(`[WARN] ${message}`),
  error: (message) => console.log(`[ERROR] ${message}`),
  success: (message) => console.log(`[SUCCESS] ${message}`)
};

// 데이터 디렉토리 경로
const dataDir = path.join(__dirname, 'data');
log.info(`데이터 디렉토리 경로: ${dataDir}`);

// 사용할 데이터베이스 파일 목록
const DB_FILES = ['users.db', 'matches.db', 'matchmaking.db'];

// 디렉토리 생성 및 권한 설정
function setupDirectory() {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true, mode: 0o777 });
      log.success(`데이터 디렉토리 생성됨: ${dataDir}`);
    } else {
      // 디렉토리 권한 수정
      fs.chmodSync(dataDir, 0o777);
      log.success(`데이터 디렉토리 권한 수정됨: ${dataDir}`);
    }
    return true;
  } catch (err) {
    log.error(`디렉토리 설정 오류: ${err.message}`);
    return false;
  }
}

// 임시 파일 정리
function cleanupTempFiles() {
  try {
    const files = fs.readdirSync(dataDir);
    let tempFilesRemoved = 0;
    
    for (const file of files) {
      if (file.endsWith('~')) {
        const tempFilePath = path.join(dataDir, file);
        try {
          fs.unlinkSync(tempFilePath);
          tempFilesRemoved++;
          log.info(`임시 파일 제거됨: ${file}`);
        } catch (unlinkErr) {
          log.warn(`임시 파일 제거 실패: ${file} (${unlinkErr.message})`);
        }
      }
    }
    
    if (tempFilesRemoved > 0) {
      log.success(`${tempFilesRemoved}개의 임시 파일을 제거했습니다.`);
    } else {
      log.info('제거할 임시 파일이 없습니다.');
    }
    return true;
  } catch (err) {
    log.error(`임시 파일 정리 오류: ${err.message}`);
    return false;
  }
}

// 데이터베이스 파일 생성 및 권한 설정
function setupDatabaseFiles() {
  let success = true;
  
  DB_FILES.forEach(file => {
    const filePath = path.join(dataDir, file);
    
    try {
      // 파일이 있는지 확인
      if (!fs.existsSync(filePath)) {
        // 빈 데이터베이스 파일 생성
        fs.writeFileSync(filePath, '', { encoding: 'utf8' });
        log.success(`데이터베이스 파일 생성: ${file}`);
      }
      
      // 파일 권한 수정
      fs.chmodSync(filePath, 0o666);
      log.success(`데이터베이스 파일 권한 수정: ${file}`);
      
      // 파일 상태 확인
      const stats = fs.statSync(filePath);
      log.info(`${file}: 크기=${stats.size}바이트, 권한=${stats.mode.toString(8)}`);
      
    } catch (err) {
      log.error(`파일 설정 오류 (${file}): ${err.message}`);
      success = false;
    }
  });
  
  return success;
}

// 백업 생성
function createBackups() {
  let backupsCreated = 0;
  
  DB_FILES.forEach(file => {
    const filePath = path.join(dataDir, file);
    if (fs.existsSync(filePath)) {
      try {
        const stats = fs.statSync(filePath);
        if (stats.size > 0) {
          const backupPath = `${filePath}.backup`;
          fs.copyFileSync(filePath, backupPath);
          backupsCreated++;
          log.success(`백업 파일 생성: ${file} -> ${file}.backup`);
        }
      } catch (err) {
        log.warn(`백업 생성 실패 (${file}): ${err.message}`);
      }
    }
  });
  
  if (backupsCreated === 0) {
    log.info('백업 가능한 파일이 없습니다.');
  }
  
  return backupsCreated;
}

// 메인 실행 함수
async function main() {
  console.log('======= NeDB 파일 권한 수정 및 복구 도구 =======');
  
  // 1. 디렉토리 설정
  if (!setupDirectory()) {
    log.error('디렉토리 설정에 실패했습니다. 관리자 권한으로 다시 시도해보세요.');
    process.exit(1);
  }
  
  // 2. 임시 파일 정리
  cleanupTempFiles();
  
  // 3. 백업 생성
  createBackups();
  
  // 4. 데이터베이스 파일 설정
  if (!setupDatabaseFiles()) {
    log.warn('일부 파일 설정에 실패했습니다. 데이터베이스 초기화 시 문제가 발생할 수 있습니다.');
  }
  
  console.log('\n======= 작업 완료 =======');
  console.log('서버를 시작하여 데이터베이스 연결을 테스트하세요.');
}

// 스크립트 실행
main().catch(err => {
  log.error(`실행 중 오류가 발생했습니다: ${err.message}`);
  process.exit(1);
}); 