#!/usr/bin/env node

/**
 * Vercel 환경 변수 설정 스크립트
 * Vercel Postgres 생성 후 실행하여 필요한 환경 변수들을 설정합니다.
 */

const { execSync } = require('child_process');

console.log('🚀 Vercel 환경 변수 설정 시작...\n');

// 설정할 환경 변수들
const envVars = [
  {
    key: 'NODE_ENV',
    value: 'production',
    description: '프로덕션 환경 설정'
  },
  {
    key: 'BNET_CLIENT_ID',
    value: '2555749aa63d40d79055409e12a9b191',
    description: 'Battle.net OAuth 클라이언트 ID'
  },
  {
    key: 'BNET_CLIENT_SECRET',
    value: '3c7ddrNaG7p5mUHK1XziVskdxGoHA21R',
    description: 'Battle.net OAuth 클라이언트 시크릿'
  },
  {
    key: 'BNET_CALLBACK_URL',
    value: 'https://hotstinder.vercel.app/api/auth/bnet/callback',
    description: 'Battle.net OAuth 콜백 URL'
  },
  {
    key: 'BNET_REGION',
    value: 'kr',
    description: 'Battle.net 리전'
  },
  {
    key: 'JWT_SECRET',
    value: 'hotstinder_production_jwt_secret_2024_' + Math.random().toString(36).substring(2),
    description: 'JWT 토큰 시크릿'
  },
  {
    key: 'SESSION_SECRET',
    value: 'hotstinder_production_session_secret_2024_' + Math.random().toString(36).substring(2),
    description: '세션 시크릿'
  },
  {
    key: 'JWT_EXPIRES_IN',
    value: '7d',
    description: 'JWT 토큰 만료 시간'
  },
  {
    key: 'ADMIN_USERNAME',
    value: 'admin',
    description: '관리자 사용자명'
  },
  {
    key: 'ADMIN_PASSWORD',
    value: 'admin123',
    description: '관리자 비밀번호'
  },
  {
    key: 'ADMIN_EMAIL',
    value: 'admin@hotstinder.com',
    description: '관리자 이메일'
  },
  {
    key: 'FRONTEND_URL',
    value: 'https://hotstinder.vercel.app',
    description: '프론트엔드 URL'
  },
  {
    key: 'MAX_FILE_SIZE',
    value: '50MB',
    description: '최대 파일 크기'
  },
  {
    key: 'LOG_LEVEL',
    value: 'info',
    description: '로그 레벨'
  }
];

// 환경 변수 설정 함수
function setEnvVar(key, value, description) {
  try {
    console.log(`📝 설정 중: ${key} - ${description}`);
    
    // Production 환경에 설정
    execSync(`vercel env add ${key} production`, {
      input: value,
      stdio: ['pipe', 'pipe', 'pipe'],
      encoding: 'utf8'
    });
    
    console.log(`✅ ${key} 설정 완료\n`);
  } catch (error) {
    console.log(`⚠️  ${key} 설정 실패 (이미 존재할 수 있음): ${error.message}\n`);
  }
}

// 모든 환경 변수 설정
async function setupAllEnvVars() {
  console.log('📋 설정할 환경 변수 목록:');
  envVars.forEach((env, index) => {
    console.log(`${index + 1}. ${env.key} - ${env.description}`);
  });
  console.log('\n');

  for (const env of envVars) {
    setEnvVar(env.key, env.value, env.description);
    // 각 설정 사이에 잠시 대기
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// 현재 환경 변수 확인
function checkCurrentEnvVars() {
  try {
    console.log('🔍 현재 설정된 환경 변수 확인...\n');
    const result = execSync('vercel env ls', { encoding: 'utf8' });
    console.log(result);
  } catch (error) {
    console.log('❌ 환경 변수 확인 실패:', error.message);
  }
}

// 메인 실행 함수
async function main() {
  try {
    console.log('🎯 Vercel 프로젝트: hotstinder');
    console.log('🌍 환경: Production\n');

    // 현재 환경 변수 확인
    checkCurrentEnvVars();

    console.log('⚠️  주의사항:');
    console.log('1. Vercel Postgres 데이터베이스가 먼저 생성되어야 합니다.');
    console.log('2. DATABASE_URL은 Vercel Postgres 생성 시 자동으로 설정됩니다.');
    console.log('3. 이미 존재하는 환경 변수는 덮어쓰지 않습니다.\n');

    console.log('계속 진행하시겠습니까? (y/N)');
    
    // 사용자 입력 대기 (실제로는 자동 실행)
    console.log('자동으로 환경 변수 설정을 시작합니다...\n');
    
    await setupAllEnvVars();

    console.log('🎉 환경 변수 설정 완료!');
    console.log('\n📋 다음 단계:');
    console.log('1. Vercel 대시보드에서 Postgres 데이터베이스 생성');
    console.log('2. DATABASE_URL 환경 변수 자동 설정 확인');
    console.log('3. vercel --prod 명령으로 배포');
    console.log('\n🔗 Vercel 대시보드: https://vercel.com/dashboard');

  } catch (error) {
    console.error('❌ 설정 중 오류 발생:', error.message);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  main();
}

module.exports = { setEnvVar, envVars }; 