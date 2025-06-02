require('dotenv').config();
const { connectPostgreSQL } = require('./src/db/postgresql');
const { initializeModels } = require('./src/models');
const logger = require('./src/utils/logger');

async function initializeDatabase() {
  try {
    console.log('🔄 데이터베이스 연결 중...');
    const sequelize = await connectPostgreSQL();
    
    console.log('🔄 모델 초기화 중...');
    const models = initializeModels();
    
    console.log('🔄 테이블 동기화 중...');
    await sequelize.sync({ force: false, alter: true });
    
    console.log('✅ 데이터베이스 테이블 생성 완료!');
    console.log('📋 생성된 모델:', Object.keys(models));
    
    // 관리자 계정 생성
    const adminUser = await models.User.findOne({
      where: { role: 'admin' }
    });
    
    if (!adminUser) {
      console.log('🔄 관리자 계정 생성 중...');
      await models.User.create({
        battleTag: 'Admin#0000',
        nickname: 'Admin',
        email: process.env.ADMIN_EMAIL || 'admin@hotstinder.com',
        password: process.env.ADMIN_PASSWORD || 'admin123',
        role: 'admin',
        isProfileComplete: true,
        mmr: 2000
      });
      console.log('✅ 관리자 계정 생성 완료!');
    } else {
      console.log('ℹ️ 관리자 계정이 이미 존재합니다.');
    }
    
    await sequelize.close();
    console.log('✅ 데이터베이스 초기화 완료!');
    process.exit(0);
  } catch (error) {
    console.error('❌ 데이터베이스 초기화 오류:', error);
    process.exit(1);
  }
}

initializeDatabase(); 