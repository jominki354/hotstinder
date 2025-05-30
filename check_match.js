const { Sequelize } = require('sequelize');
require('dotenv').config({ path: './server/.env' });

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: console.log
});

async function checkMatch() {
  try {
    const [results] = await sequelize.query(`
      SELECT id, winner, status, map_name, game_duration, created_at
      FROM matches
      WHERE id = '4223fae8-cedf-409f-92ee-18920a35c867'
    `);

    console.log('매치 정보:', results[0]);

    const [participants] = await sequelize.query(`
      SELECT user_id, team, hero, kills, deaths, assists
      FROM match_participants
      WHERE match_id = '4223fae8-cedf-409f-92ee-18920a35c867'
      ORDER BY team, user_id
    `);

    console.log('참가자 정보:', participants);

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('오류:', error);
    process.exit(1);
  }
}

checkMatch();
