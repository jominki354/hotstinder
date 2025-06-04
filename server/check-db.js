const { getSequelize } = require('./src/db/postgresql');

async function checkMatchesTable() {
    const sequelize = getSequelize();

    try {
        console.log('=== matches 테이블 구조 확인 ===');

        // 테이블 컬럼 정보 조회
        const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'matches' 
      ORDER BY ordinal_position;
    `);

        console.log('실제 데이터베이스 컬럼들:');
        columns.forEach(col => {
            console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });

        console.log('\n=== 샘플 데이터 확인 ===');
        const [matches] = await sequelize.query('SELECT * FROM matches LIMIT 3;');
        console.log(`총 ${matches.length}개의 샘플 매치 데이터:`);
        matches.forEach((match, index) => {
            console.log(`\n매치 ${index + 1}:`, Object.keys(match));
        });

    } catch (error) {
        console.error('데이터베이스 확인 오류:', error.message);
    } finally {
        await sequelize.close();
    }
}

checkMatchesTable(); 