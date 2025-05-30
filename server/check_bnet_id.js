const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

async function checkBnetIdType() {
  try {
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'bnet_id'
    `);

    console.log('bnet_id 컬럼 정보:', results[0]);

    // 샘플 데이터 확인
    const [users] = await sequelize.query(`
      SELECT id, bnet_id, battle_tag
      FROM users
      LIMIT 3
    `);

    console.log('샘플 사용자 데이터:');
    users.forEach(user => {
      console.log(`  ID: ${user.id}, bnet_id: ${user.bnet_id} (타입: ${typeof user.bnet_id}), battle_tag: ${user.battle_tag}`);
    });

    await sequelize.close();
  } catch (error) {
    console.error('오류:', error);
    process.exit(1);
  }
}

checkBnetIdType();
