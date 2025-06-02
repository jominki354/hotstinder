require('dotenv').config();
const { connectPostgreSQL } = require('./src/db/postgresql');
const { initializeModels } = require('./src/models');
const bcrypt = require('bcryptjs');

async function checkAdminAccount() {
  try {
    console.log('🔍 관리자 계정 확인 중...');
    const sequelize = await connectPostgreSQL();
    const models = initializeModels();
    global.db = { ...models, sequelize };
    
    // 기존 관리자 계정 확인
    const existingAdmin = await global.db.User.findOne({
      where: { role: 'admin' }
    });
    
    if (existingAdmin) {
      console.log('✅ 기존 관리자 계정 발견:');
      console.log('   - ID:', existingAdmin.id);
      console.log('   - 배틀태그:', existingAdmin.battleTag);
      console.log('   - 이메일:', existingAdmin.email);
      console.log('   - 역할:', existingAdmin.role);
      
      // 비밀번호 확인
      const passwordMatch = await bcrypt.compare('1231', existingAdmin.password);
      console.log('   - 비밀번호 (1231) 일치:', passwordMatch ? '✅' : '❌');
      
      if (!passwordMatch) {
        console.log('🔧 비밀번호 업데이트 중...');
        const hashedPassword = await bcrypt.hash('1231', 10);
        await existingAdmin.update({ password: hashedPassword });
        console.log('✅ 비밀번호가 1231로 업데이트되었습니다.');
      }
    } else {
      console.log('❌ 관리자 계정이 없습니다. 새로 생성합니다...');
      
      const hashedPassword = await bcrypt.hash('1231', 10);
      const newAdmin = await global.db.User.create({
        battleTag: 'Admin#0000',
        nickname: 'Admin',
        email: 'admin@hotstinder.com',
        password: hashedPassword,
        role: 'admin',
        isProfileComplete: true,
        mmr: 2000,
        wins: 0,
        losses: 0
      });
      
      console.log('✅ 새 관리자 계정 생성 완료:');
      console.log('   - ID:', newAdmin.id);
      console.log('   - 배틀태그:', newAdmin.battleTag);
      console.log('   - 이메일:', newAdmin.email);
      console.log('   - 역할:', newAdmin.role);
    }
    
    console.log('\n📋 관리자 로그인 정보:');
    console.log('   - 사용자명: admin');
    console.log('   - 비밀번호: 1231');
    console.log('   - 로그인 URL: http://localhost:3000/admin-login');
    
    await sequelize.close();
    console.log('\n✅ 관리자 계정 확인 완료!');
    process.exit(0);
  } catch (error) {
    console.error('❌ 관리자 계정 확인 오류:', error);
    process.exit(1);
  }
}

checkAdminAccount(); 