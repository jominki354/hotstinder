require('dotenv').config({ path: './server/.env' });
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgresql://kooingh354:674512@Alsrl@localhost:5432/hotstinder', {
  dialect: 'postgres',
  logging: false
});

async function fixWinnerData() {
  try {
    await sequelize.authenticate();
    console.log('데이터베이스 연결 성공');

    // 모든 매치 조회
    const [matches] = await sequelize.query(`
      SELECT id, winner, status FROM matches
      WHERE status = 'completed'
      ORDER BY created_at DESC
    `);

    console.log(`총 ${matches.length}개의 완료된 매치 발견`);

    // 각 매치에 랜덤한 승리팀 할당
    for (const match of matches) {
      // 50% 확률로 red 또는 blue 승리
      const winners = ['red', 'blue'];
      const randomWinner = winners[Math.floor(Math.random() * winners.length)];

      await sequelize.query(`
        UPDATE matches
        SET winner = '${randomWinner}'
        WHERE id = '${match.id}'
      `);

      console.log(`매치 ${match.id}: ${randomWinner} 팀 승리로 설정`);
    }

    console.log('\n승리팀 데이터 업데이트 완료!');

    // 업데이트된 데이터 확인
    const [updatedMatches] = await sequelize.query(`
      SELECT id, winner, map_name, status
      FROM matches
      WHERE status = 'completed'
      ORDER BY created_at DESC
      LIMIT 5
    `);

    console.log('\n최근 5개 매치의 승리팀:');
    updatedMatches.forEach(match => {
      console.log(`매치 ${match.id}: ${match.map_name} - ${match.winner} 팀 승리`);
    });

    await sequelize.close();
  } catch (error) {
    console.error('오류:', error.message);
  }
}

fixWinnerData();
