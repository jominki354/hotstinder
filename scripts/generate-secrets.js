#!/usr/bin/env node

/**
 * Railway 배포용 보안 키 생성 스크립트
 * 사용법: node scripts/generate-secrets.js
 */

const crypto = require('crypto');

function generateSecureKey(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

function generateSecrets() {
  const jwtSecret = generateSecureKey(32);
  const sessionSecret = generateSecureKey(32);
  
  console.log('🔐 Railway 배포용 보안 키 생성 완료!\n');
  console.log('다음 환경 변수들을 Railway 대시보드에 설정하세요:\n');
  
  console.log('JWT_SECRET=' + jwtSecret);
  console.log('SESSION_SECRET=' + sessionSecret);
  
  console.log('\n📋 복사용 환경 변수:');
  console.log('NODE_ENV=production');
  console.log('PORT=5000');
  console.log('USE_MONGODB=true');
  console.log('MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hotstinder?retryWrites=true&w=majority');
  console.log('JWT_SECRET=' + jwtSecret);
  console.log('SESSION_SECRET=' + sessionSecret);
  console.log('FRONTEND_URL=https://your-app-name.up.railway.app');
  console.log('MAX_FILE_SIZE=50MB');
  console.log('UPLOAD_PATH=./uploads');
  console.log('LOG_LEVEL=info');
  
  console.log('\n⚠️  주의사항:');
  console.log('1. MONGODB_URI의 username, password, cluster 정보를 실제 값으로 변경하세요');
  console.log('2. FRONTEND_URL을 실제 Railway 배포 URL로 변경하세요');
  console.log('3. 이 키들은 안전한 곳에 보관하세요');
}

if (require.main === module) {
  generateSecrets();
}

module.exports = { generateSecureKey, generateSecrets }; 