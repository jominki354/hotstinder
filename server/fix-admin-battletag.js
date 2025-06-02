require('dotenv').config();
const { connectPostgreSQL } = require('./src/db/postgresql');
const { initializeModels } = require('./src/models');

async function fixAdminBattleTag() {
  try {
    console.log('🔧 관리자 계정 battleTag 수정 중...');
    const sequelize = await connectPostgreSQL();
    const models = initializeModels();
    global.db = { ...models, sequelize };
    
    // 기존 관리자 계정 찾기
    const adminUser = await global.db.User.findOne({
      where: { role: 'admin' }
    });
    
    if (!adminUser) {
      console.log('❌ 관리자 계정을 찾을 수 없습니다.');
      process.exit(1);
    }
    
    console.log('📋 현재 관리자 계정 정보:');
    console.log('   - ID:', adminUser.id);
    console.log('   - 현재 battleTag:', adminUser.battleTag);
    console.log('   - 이메일:', adminUser.email);
    console.log('   - 역할:', adminUser.role);
    
    // battleTag를 admin으로 변경
    await adminUser.update({
      battleTag: 'admin',
      nickname: 'admin'
    });
    
    console.log('✅ 관리자 계정 battleTag 수정 완료!');
    console.log('   - 새 battleTag: admin');
    console.log('   - 새 nickname: admin');
    
    console.log('\n📋 관리자 로그인 정보:');
    console.log('   - 사용자명: admin');
    console.log('   - 비밀번호: 1231');
    console.log('   - 로그인 URL: http://localhost:3000/admin-login');
    
    await sequelize.close();
    console.log('\n✅ 관리자 계정 수정 완료!');
    process.exit(0);
  } catch (error) {
    console.error('❌ 관리자 계정 수정 오류:', error);
    process.exit(1);
  }
}

fixAdminBattleTag(); 