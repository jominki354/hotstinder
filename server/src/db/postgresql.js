const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

let sequelize = null;

// Prisma Accelerate URL을 일반 PostgreSQL URL로 변환
const convertPrismaUrl = (url) => {
  if (url && url.startsWith('prisma+postgres://')) {
    // Prisma Accelerate URL에서 실제 PostgreSQL URL 추출
    const urlObj = new URL(url);
    const apiKey = urlObj.searchParams.get('api_key');

    if (apiKey) {
      // API 키에서 실제 데이터베이스 정보 추출 (JWT 디코딩)
      try {
        const payload = JSON.parse(Buffer.from(apiKey.split('.')[1], 'base64').toString());
        logger.info('Prisma Accelerate 연결 감지됨');

        // Prisma Accelerate는 직접 PostgreSQL 연결을 지원하지 않으므로
        // 환경 변수에서 직접 PostgreSQL URL을 찾아야 합니다
        return process.env.POSTGRES_URL_NON_POOLING || process.env.DIRECT_URL;
      } catch (error) {
        logger.warn('Prisma URL 파싱 실패, 원본 URL 사용:', error.message);
      }
    }
  }
  return url;
};

const connectPostgreSQL = async () => {
  try {
    // Vercel PostgreSQL 환경 변수 우선 사용
    let databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;

    // Prisma Accelerate URL 처리
    if (databaseUrl && databaseUrl.startsWith('prisma+postgres://')) {
      logger.info('Prisma Accelerate URL 감지됨, 직접 연결 URL로 변환 시도');
      databaseUrl = convertPrismaUrl(databaseUrl) || process.env.POSTGRES_URL_NON_POOLING;
    }

    if (!databaseUrl) {
      throw new Error('POSTGRES_URL, POSTGRES_URL_NON_POOLING 또는 DATABASE_URL 환경 변수가 설정되지 않았습니다.');
    }

    logger.info('PostgreSQL 연결 시도:', {
      url: databaseUrl.replace(/:[^:@]*@/, ':***@'), // 비밀번호 마스킹
      environment: process.env.NODE_ENV,
      isPrismaUrl: databaseUrl.includes('prisma')
    });

    sequelize = new Sequelize(databaseUrl, {
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
      pool: {
        max: process.env.NODE_ENV === 'production' ? 5 : 10, // Vercel 제한 고려
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      define: {
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
      },
      dialectOptions: {
        ssl: process.env.NODE_ENV === 'production' ? {
          require: true,
          rejectUnauthorized: false
        } : false
      }
    });

    // 연결 테스트
    await sequelize.authenticate();
    logger.info('✅ PostgreSQL 데이터베이스에 성공적으로 연결되었습니다.');

    // 모델 동기화 (개발 환경에서만)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      logger.info('✅ 데이터베이스 모델이 동기화되었습니다.');
    } else {
      // 프로덕션에서는 테이블 존재 여부만 확인
      await sequelize.sync({ alter: false });
      logger.info('✅ 프로덕션 데이터베이스 연결 확인 완료');
    }

    return sequelize;
  } catch (error) {
    logger.error('❌ PostgreSQL 연결 실패:', {
      error: error.message,
      stack: error.stack
    });
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
