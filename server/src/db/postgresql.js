const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

let sequelize = null;

const connectPostgreSQL = async () => {
  try {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL 환경 변수가 설정되지 않았습니다.');
    }

    sequelize = new Sequelize(databaseUrl, {
      dialect: 'postgres',
      logging: (msg) => logger.debug(msg),
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      define: {
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
      }
    });

    // 연결 테스트
    await sequelize.authenticate();
    logger.info('PostgreSQL 데이터베이스에 성공적으로 연결되었습니다.');

    // 모델 동기화 (개발 환경에서만)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      logger.info('데이터베이스 모델이 동기화되었습니다.');
    }

    return sequelize;
  } catch (error) {
    logger.error('PostgreSQL 연결 실패:', error);
    throw error;
  }
};

const getSequelize = () => {
  if (!sequelize) {
    throw new Error('PostgreSQL이 초기화되지 않았습니다. connectPostgreSQL()을 먼저 호출하세요.');
  }
  return sequelize;
};

const closeConnection = async () => {
  if (sequelize) {
    await sequelize.close();
    logger.info('PostgreSQL 연결이 종료되었습니다.');
  }
};

module.exports = {
  connectPostgreSQL,
  getSequelize,
  closeConnection
};
