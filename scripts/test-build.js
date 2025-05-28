#!/usr/bin/env node

/**
 * Railway 빌드 과정 로컬 테스트 스크립트
 * 사용법: node scripts/test-build.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Railway 빌드 과정 테스트 시작...\n');

function runCommand(command, description) {
  console.log(`📋 ${description}`);
  console.log(`💻 실행: ${command}`);
  
  try {
    const output = execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log(`✅ ${description} 완료\n`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} 실패:`);
    console.error(error.message);
    return false;
  }
}

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${description}: ${filePath}`);
    return true;
  } else {
    console.log(`❌ ${description} 없음: ${filePath}`);
    return false;
  }
}

async function testBuild() {
  console.log('🔍 파일 구조 확인...');
  
  // 필수 파일 확인
  const requiredFiles = [
    { path: 'package.json', desc: '루트 package.json' },
    { path: 'server/package.json', desc: '서버 package.json' },
    { path: 'client/package.json', desc: '클라이언트 package.json' },
    { path: 'server/src/index.js', desc: '서버 엔트리 포인트' },
    { path: 'nixpacks.toml', desc: 'Nixpacks 설정' },
    { path: 'railway.json', desc: 'Railway 설정' }
  ];
  
  let allFilesExist = true;
  for (const file of requiredFiles) {
    if (!checkFile(file.path, file.desc)) {
      allFilesExist = false;
    }
  }
  
  if (!allFilesExist) {
    console.log('\n❌ 필수 파일이 누락되었습니다.');
    return false;
  }
  
  console.log('\n🔧 의존성 설치 테스트...');
  
  // 1. 루트 의존성 설치
  if (!runCommand('npm install', '루트 의존성 설치')) return false;
  
  // 2. 서버 의존성 설치
  if (!runCommand('cd server && npm install', '서버 의존성 설치')) return false;
  
  // 3. 클라이언트 의존성 설치
  if (!runCommand('cd client && npm install', '클라이언트 의존성 설치')) return false;
  
  console.log('🏗️ 빌드 테스트...');
  
  // 4. 클라이언트 빌드
  if (!runCommand('cd client && npm run build', '클라이언트 빌드')) return false;
  
  // 5. 빌드 결과 확인
  if (!checkFile('client/build/index.html', '클라이언트 빌드 결과')) return false;
  
  console.log('🎉 모든 테스트 통과!');
  console.log('\n📋 다음 단계:');
  console.log('1. git add . && git commit -m "빌드 설정 수정"');
  console.log('2. git push origin main');
  console.log('3. Railway에서 재배포 확인');
  
  return true;
}

if (require.main === module) {
  testBuild().catch(console.error);
}

module.exports = { testBuild }; 