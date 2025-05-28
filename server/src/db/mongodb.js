const mongoose = require('mongoose');
const logger = require('../utils/logger');

// MongoDB 연결 설정
const connectMongoDB = async () => {
  try {
    logger.info('MongoDB를 사용하도록 설정되어 있습니다. 연결을 시도합니다...');

    // deprecated 옵션 제거
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotstinder');

    logger.info(`MongoDB 데이터베이스 연결 성공: ${mongoose.connection.host}`);

    // 연결 이벤트 리스너
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB 연결 오류:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB 연결이 끊어졌습니다.');
    });

    return mongoose.connection;
  } catch (error) {
    logger.error('MongoDB 연결 실패:', error);
    throw error;
  }
};

// 더미 데이터 추가 함수
const addDummyData = async (UserModel) => {
  try {
    // 기존 사용자 수 확인
    const count = await mongoose.model('User').countDocuments();

    // 사용자가 없을 경우에만 더미 데이터 추가
    if (count === 0) {
      logger.info('MongoDB: 사용자 데이터가 없습니다. 더미 데이터를 추가합니다.');

      // 더미 데이터 추가
      const dummyUsers = [
        {
          bnetId: 'dummy1',
          battletag: '호덤이#3518',
          nickname: '호덤이',
          mmr: 2000,
          wins: 10,
          losses: 5,
          preferredRoles: ['원거리 암살자'],
          isDummy: true,
          createdAt: new Date()
        },
        {
          bnetId: 'dummy2',
          battletag: '리슈#1234',
          nickname: '리슈',
          mmr: 1800,
          wins: 8,
          losses: 7,
          preferredRoles: ['서포터'],
          isDummy: true,
          createdAt: new Date()
        },
        {
          bnetId: 'dummy3',
          battletag: '아기호랑이#5678',
          nickname: '아기호랑이',
          mmr: 2200,
          wins: 15,
          losses: 3,
          preferredRoles: ['탱커'],
          isDummy: true,
          createdAt: new Date()
        }
      ];

      // 개별적으로 삽입하여 오류 처리 개선
      for (const user of dummyUsers) {
        try {
          await UserModel.create(user);
          logger.info(`MongoDB: 더미 사용자 추가됨: ${user.nickname}`);
        } catch (err) {
          logger.error(`MongoDB: 더미 사용자 추가 실패 (${user.nickname}):`, err);
        }
      }
    } else {
      logger.info(`MongoDB: 기존 사용자 데이터 ${count}개가 로드되었습니다.`);
    }
  } catch (err) {
    logger.error('MongoDB: 더미 데이터 추가 중 오류:', err);
  }
};

module.exports = {
  connectMongoDB,
  addDummyData
};