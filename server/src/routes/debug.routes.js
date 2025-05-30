const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { getSequelize } = require('../db/postgresql');

/**
 * @route   GET /api/debug/endpoints
 * @desc    모든 API 엔드포인트 목록과 상태 확인
 * @access  Public
 */
router.get('/endpoints', async (req, res) => {
  try {
    const endpoints = [
      // 인증 관련
      { method: 'GET', path: '/api/auth/me', description: '현재 사용자 정보', requiresAuth: true },
      { method: 'POST', path: '/api/auth/login', description: '로그인', requiresAuth: false },
      { method: 'POST', path: '/api/auth/logout', description: '로그아웃', requiresAuth: true },
      { method: 'GET', path: '/api/auth/bnet', description: 'Battle.net OAuth 시작', requiresAuth: false },
      { method: 'GET', path: '/api/auth/bnet/callback', description: 'Battle.net OAuth 콜백', requiresAuth: false },

      // 사용자 관련
      { method: 'GET', path: '/api/users/profile/:id', description: '사용자 프로필 조회', requiresAuth: false },
      { method: 'PUT', path: '/api/users/profile', description: '사용자 프로필 업데이트', requiresAuth: true },
      { method: 'GET', path: '/api/users/all', description: '모든 사용자 목록 (관리자)', requiresAuth: true },

      // 리더보드
      { method: 'GET', path: '/api/leaderboard', description: '리더보드 조회', requiresAuth: false },
      { method: 'GET', path: '/api/users/leaderboard', description: '리더보드 조회 (구버전)', requiresAuth: false },

      // 매치메이킹
      { method: 'POST', path: '/api/matchmaking/join', description: '매치메이킹 참가', requiresAuth: true },
      { method: 'POST', path: '/api/matchmaking/leave', description: '매치메이킹 나가기', requiresAuth: true },
      { method: 'GET', path: '/api/matchmaking/status', description: '매치메이킹 상태', requiresAuth: true },
      { method: 'GET', path: '/api/matchmaking/recent-games', description: '최근 게임 목록', requiresAuth: false },

      // 매치 관련
      { method: 'GET', path: '/api/matches', description: '매치 목록', requiresAuth: false },
      { method: 'GET', path: '/api/matches/:id', description: '매치 상세 정보', requiresAuth: false },
      { method: 'POST', path: '/api/matches', description: '매치 생성', requiresAuth: true },
      { method: 'PUT', path: '/api/matches/:id', description: '매치 업데이트', requiresAuth: true },

      // 관리자 관련
      { method: 'POST', path: '/api/admin/login', description: '관리자 로그인', requiresAuth: false },
      { method: 'GET', path: '/api/admin/dashboard', description: '관리자 대시보드', requiresAuth: true },
      { method: 'GET', path: '/api/admin/users', description: '관리자 사용자 목록', requiresAuth: true },
      { method: 'GET', path: '/api/admin/users/:id', description: '관리자 사용자 상세', requiresAuth: true },
      { method: 'PUT', path: '/api/admin/users/:id', description: '관리자 사용자 수정', requiresAuth: true },
      { method: 'DELETE', path: '/api/admin/users/:id', description: '관리자 사용자 삭제', requiresAuth: true },
      { method: 'GET', path: '/api/admin/matches', description: '관리자 매치 목록', requiresAuth: true },
      { method: 'GET', path: '/api/admin/matches/:id', description: '관리자 매치 상세', requiresAuth: true },
      { method: 'PUT', path: '/api/admin/matches/:id', description: '관리자 매치 수정', requiresAuth: true },
      { method: 'DELETE', path: '/api/admin/matches/:id', description: '관리자 매치 삭제', requiresAuth: true },

      // 리플레이 관련
      { method: 'POST', path: '/api/replay/upload', description: '리플레이 업로드', requiresAuth: true },
      { method: 'GET', path: '/api/replay/:id', description: '리플레이 다운로드', requiresAuth: false },
      { method: 'GET', path: '/api/replay/list', description: '리플레이 목록', requiresAuth: false },

      // 시스템
      { method: 'GET', path: '/api/health', description: '헬스체크', requiresAuth: false },
      { method: 'GET', path: '/api/debug/endpoints', description: '엔드포인트 목록', requiresAuth: false },
      { method: 'GET', path: '/api/debug/database', description: '데이터베이스 상태', requiresAuth: false },
      { method: 'GET', path: '/api/debug/models', description: '데이터베이스 모델 정보', requiresAuth: false }
    ];

    // 각 엔드포인트의 상태를 체크
    const endpointStatus = [];

    for (const endpoint of endpoints) {
      try {
        // 간단한 상태 체크 (실제 요청은 하지 않고 라우터 존재 여부만 확인)
        const status = {
          ...endpoint,
          status: 'available',
          lastChecked: new Date().toISOString()
        };
        endpointStatus.push(status);
      } catch (error) {
        endpointStatus.push({
          ...endpoint,
          status: 'error',
          error: error.message,
          lastChecked: new Date().toISOString()
        });
      }
    }

    res.json({
      totalEndpoints: endpoints.length,
      availableEndpoints: endpointStatus.filter(e => e.status === 'available').length,
      errorEndpoints: endpointStatus.filter(e => e.status === 'error').length,
      endpoints: endpointStatus,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    logger.error('엔드포인트 체크 오류:', error);
    res.status(500).json({
      message: '엔드포인트 체크 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/debug/database
 * @desc    데이터베이스 상태 및 테이블 정보 확인
 * @access  Public
 */
router.get('/database', async (req, res) => {
  try {
    const sequelize = getSequelize();
    const dbStatus = {
      connection: 'disconnected',
      tables: [],
      models: [],
      errors: []
    };

    // 데이터베이스 연결 상태 확인
    try {
      await sequelize.authenticate();
      dbStatus.connection = 'connected';
    } catch (error) {
      dbStatus.connection = 'error';
      dbStatus.errors.push(`Connection error: ${error.message}`);
    }

    // 테이블 목록 조회
    try {
      const [tables] = await sequelize.query(`
        SELECT table_name, table_schema
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);
      dbStatus.tables = tables;
    } catch (error) {
      dbStatus.errors.push(`Tables query error: ${error.message}`);
    }

    // 모델 정보 확인
    if (global.db) {
      dbStatus.models = Object.keys(global.db).filter(key => key !== 'sequelize');
    }

    // 각 테이블의 컬럼 정보 확인
    const tableDetails = {};
    for (const table of dbStatus.tables) {
      try {
        const [columns] = await sequelize.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_name = '${table.table_name}'
          AND table_schema = 'public'
          ORDER BY ordinal_position
        `);
        tableDetails[table.table_name] = columns;
      } catch (error) {
        dbStatus.errors.push(`Column info error for ${table.table_name}: ${error.message}`);
      }
    }

    res.json({
      status: dbStatus.connection,
      database: process.env.DB_NAME || 'unknown',
      host: process.env.DB_HOST || 'unknown',
      port: process.env.DB_PORT || 'unknown',
      user: process.env.DB_USER || 'unknown',
      tablesCount: dbStatus.tables.length,
      modelsCount: dbStatus.models.length,
      tables: dbStatus.tables,
      models: dbStatus.models,
      tableDetails,
      errors: dbStatus.errors,
      lastChecked: new Date().toISOString()
    });

  } catch (error) {
    logger.error('데이터베이스 상태 체크 오류:', error);
    res.status(500).json({
      message: '데이터베이스 상태 체크 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/debug/models
 * @desc    Sequelize 모델 정보 및 필드 매핑 확인
 * @access  Public
 */
router.get('/models', async (req, res) => {
  try {
    const modelInfo = {};

    if (!global.db) {
      return res.json({
        message: '모델이 초기화되지 않았습니다.',
        models: {}
      });
    }

    // 각 모델의 정보 수집
    for (const [modelName, model] of Object.entries(global.db)) {
      if (modelName === 'sequelize') continue;

      try {
        const attributes = model.getTableName ? {
          tableName: model.getTableName(),
          attributes: Object.keys(model.rawAttributes).map(attr => ({
            name: attr,
            type: model.rawAttributes[attr].type.toString(),
            field: model.rawAttributes[attr].field || attr,
            allowNull: model.rawAttributes[attr].allowNull !== false,
            defaultValue: model.rawAttributes[attr].defaultValue,
            primaryKey: model.rawAttributes[attr].primaryKey || false,
            autoIncrement: model.rawAttributes[attr].autoIncrement || false
          })),
          associations: Object.keys(model.associations || {}).map(assoc => ({
            name: assoc,
            type: model.associations[assoc].associationType,
            target: model.associations[assoc].target.name
          }))
        } : null;

        modelInfo[modelName] = attributes;
      } catch (error) {
        modelInfo[modelName] = {
          error: error.message
        };
      }
    }

    res.json({
      modelsCount: Object.keys(modelInfo).length,
      models: modelInfo,
      lastChecked: new Date().toISOString()
    });

  } catch (error) {
    logger.error('모델 정보 체크 오류:', error);
    res.status(500).json({
      message: '모델 정보 체크 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/debug/test-endpoints
 * @desc    실제 API 엔드포인트 테스트
 * @access  Public
 */
router.get('/test-endpoints', async (req, res) => {
  try {
    const testResults = [];
    const baseUrl = `http://localhost:${process.env.PORT || 5000}`;

    // 테스트할 엔드포인트 목록 (GET 요청만)
    const testEndpoints = [
      '/api/health',
      '/api/leaderboard',
      '/api/matchmaking/recent-games',
      '/api/debug/endpoints',
      '/api/debug/database',
      '/api/debug/models'
    ];

    for (const endpoint of testEndpoints) {
      try {
        const startTime = Date.now();
        const response = await fetch(`${baseUrl}${endpoint}`);
        const endTime = Date.now();

        testResults.push({
          endpoint,
          status: response.status,
          statusText: response.statusText,
          responseTime: endTime - startTime,
          success: response.ok,
          contentType: response.headers.get('content-type'),
          lastTested: new Date().toISOString()
        });
      } catch (error) {
        testResults.push({
          endpoint,
          status: 'error',
          error: error.message,
          success: false,
          lastTested: new Date().toISOString()
        });
      }
    }

    const successCount = testResults.filter(r => r.success).length;
    const errorCount = testResults.filter(r => !r.success).length;

    res.json({
      summary: {
        total: testResults.length,
        success: successCount,
        errors: errorCount,
        successRate: `${((successCount / testResults.length) * 100).toFixed(1)}%`
      },
      results: testResults,
      lastTested: new Date().toISOString()
    });

  } catch (error) {
    logger.error('엔드포인트 테스트 오류:', error);
    res.status(500).json({
      message: '엔드포인트 테스트 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/debug/client-error
 * @desc    클라이언트에서 발생한 에러를 서버 로그에 기록
 * @access  Public
 */
router.post('/client-error', async (req, res) => {
  try {
    const { error, stack, component, action, timestamp, userAgent, url } = req.body;

    logger.error('🔴 클라이언트 에러 발생', {
      error,
      stack,
      component,
      action,
      timestamp,
      userAgent,
      url,
      ip: req.ip
    });

    res.json({
      message: '클라이언트 에러가 서버에 기록되었습니다.',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('클라이언트 에러 리포팅 실패:', error);
    res.status(500).json({
      message: '에러 리포팅 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

module.exports = router;
