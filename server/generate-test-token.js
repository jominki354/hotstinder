const jwt = require('jsonwebtoken');

// JWT 시크릿 (환경변수 또는 기본값)
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

// 관리자 토큰 생성
const adminToken = jwt.sign(
  {
    id: 'admin-test',
    role: 'admin',
    battleTag: 'TestAdmin#1234'
  },
  JWT_SECRET,
  { expiresIn: '24h' }
);

console.log('🔑 생성된 관리자 토큰:');
console.log(adminToken);
console.log('\n📋 토큰 정보:');
console.log('- 사용자 ID: admin-test');
console.log('- 역할: admin');
console.log('- 배틀태그: TestAdmin#1234');
console.log('- 만료 시간: 24시간');
console.log('\n💡 이 토큰을 테스트 스크립트에 복사해서 사용하세요.');
