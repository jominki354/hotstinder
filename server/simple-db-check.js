require('dotenv').config();
const { Sequelize } = require('sequelize');

async function simpleCheck() {
    console.log('환경 변수 확인:');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? '설정됨' : '없음');

    if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL 환경 변수가 설정되지 않았습니다.');
        return;
    }

    const sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        logging: false,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
    });

    try {
        await sequelize.authenticate();
        console.log('✅ 데이터베이스 연결 성공');

        // matches 테이블 구조 확인
        const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'matches' 
      ORDER BY ordinal_position;
    `);

        console.log('\n=== matches 테이블 컬럼 ===');
        columns.forEach(col => {
            console.log(`${col.column_name}: ${col.data_type}`);
        });

        // 샘플 데이터 확인
        const [matches] = await sequelize.query('SELECT id, status, winner, created_at FROM matches LIMIT 2;');
        console.log('\n=== 샘플 매치 데이터 ===');
        console.log('매치 개수:', matches.length);
        if (matches.length > 0) {
            console.log('첫 번째 매치:', matches[0]);
        }

    } catch (error) {
        console.error('❌ 오류:', error.message);
    } finally {
        await sequelize.close();
    }
}

simpleCheck(); 