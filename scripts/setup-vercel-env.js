#!/usr/bin/env node

/**
 * Vercel 환경 변수 설정 스크립트
 * 사용법: node scripts/setup-vercel-env.js
 */

const crypto = require('crypto');

function generateSecureKey(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

function generateVercelEnvCommands() {
  const jwtSecret = generateSecureKey(32);
  const sessionSecret = generateSecureKey(32);
  
  console.log('🔑 Vercel 환경 변수 설정 명령어 생성 완료!\n');
  console.log('📋 다음 명령어들을 하나씩 실행하세요:\n');
  console.log('# Vercel CLI 설치 (아직 설치하지 않았다면)');
  console.log('npm install -g vercel\n');
  
  console.log('# 프로젝트 디렉토리에서 Vercel 로그인');
  console.log('vercel login\n');
  
  console.log('# 환경 변수 설정');
  console.log('vercel env add NODE_ENV production');
  console.log('vercel env add USE_MONGODB true');
  console.log('vercel env add MONGODB_URI "mongodb+srv://kooingh354:실제비밀번호@hotstinder.gvbw5hv.mongodb.net/hotstinder?retryWrites=true&w=majority"');
  console.log(`vercel env add JWT_SECRET "${jwtSecret}"`);
  console.log(`vercel env add SESSION_SECRET "${sessionSecret}"`);
  console.log('vercel env add FRONTEND_URL "https://hotstinder.vercel.app"');
  console.log('vercel env add MAX_FILE_SIZE "50MB"');
  console.log('vercel env add UPLOAD_PATH "./uploads"');
  console.log('vercel env add LOG_LEVEL "info"');
  
  console.log('\n⚠️  주의사항:');
  console.log('1. MONGODB_URI의 "실제비밀번호" 부분을 MongoDB Atlas 비밀번호로 변경하세요');
  console.log('2. 각 명령어 실행 시 "Production" 환경을 선택하세요');
  console.log('3. 설정 완료 후 "vercel --prod"로 재배포하세요');
  
  console.log('\n🎯 또는 Vercel 대시보드에서 직접 설정:');
  console.log('1. https://vercel.com/dashboard 접속');
  console.log('2. hotstinder 프로젝트 → Settings → Environment Variables');
  console.log('3. 위의 환경 변수들을 하나씩 추가');
}

if (require.main === module) {
  generateVercelEnvCommands();
}

module.exports = { generateVercelEnvCommands }; 