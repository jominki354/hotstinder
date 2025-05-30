require('dotenv').config({ path: './server/.env' });
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

async function fixSpecificMatch() {
  try {
    const matchId = '4223fae8-cedf-409f-92ee-18920a35c867';

    // 현재 매치 정보 확인
    const [results] = await sequelize.query(`
      SELECT id, winner, status, map_name, game_duration, created_at
      FROM matches
      WHERE id = '${matchId}'
    `);

    if (results.length === 0) {
      console.log('매치를 찾을 수 없습니다.');
      return;
    }

    const match = results[0];
    console.log('현재 매치 정보:', match);

    // 참가자 정보 확인
    const [participants] = await sequelize.query(`
      SELECT user_id, team, hero, kills, deaths, assists
      FROM match_participants
      WHERE match_id = '${matchId}'
      ORDER BY team, user_id
    `);

    console.log('참가자 정보:');
    participants.forEach(p => {
      console.log(`  팀 ${p.team}: ${p.hero} (K/D/A: ${p.kills}/${p.deaths}/${p.assists})`);
    });

    // winner가 'blue'가 아닌 경우 수정
    if (match.winner !== 'blue') {
      console.log(`\nwinner 값을 '${match.winner}'에서 'blue'로 수정합니다...`);

      await sequelize.query(`
        UPDATE matches
        SET winner = 'blue'
        WHERE id = '${matchId}'
      `);

      console.log('✅ 매치 승리팀이 blue로 수정되었습니다.');
    } else {
      console.log('✅ 매치 승리팀이 이미 blue로 설정되어 있습니다.');
    }

    await sequelize.close();

  } catch (error) {
    console.error('오류:', error);
    process.exit(1);
  }
}

fixSpecificMatch();
