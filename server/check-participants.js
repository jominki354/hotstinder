require('dotenv').config();
const { Sequelize } = require('sequelize');

async function checkParticipantsTable() {
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

        // match_participants 테이블 구조 확인
        const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'match_participants' 
      ORDER BY ordinal_position;
    `);

        console.log('\n=== match_participants 테이블 컬럼 ===');
        columns.forEach(col => {
            console.log(`${col.column_name}: ${col.data_type}`);
        });

        // 샘플 데이터 확인
        const [participants] = await sequelize.query('SELECT id, match_id, user_id, team FROM match_participants LIMIT 3;');
        console.log('\n=== 샘플 참가자 데이터 ===');
        console.log('참가자 개수:', participants.length);
        if (participants.length > 0) {
            console.log('첫 번째 참가자:', participants[0]);
        }

    } catch (error) {
        console.error('❌ 오류:', error.message);
    } finally {
        await sequelize.close();
    }
}

checkParticipantsTable(); 