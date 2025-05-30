const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const { analyzeReplay } = require('../utils/replayParser');

// 미들웨어: 인증 확인
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: '인증 토큰이 필요합니다' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!global.db || !global.db.User) {
      return res.status(500).json({ message: '데이터베이스가 초기화되지 않았습니다' });
    }

    const user = await global.db.User.findByPk(decoded.id);
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다' });
    }

    req.user = user;
    next();
  } catch (err) {
    logger.error('인증 오류:', err);
    return res.status(401).json({ message: '인증에 실패했습니다' });
  }
};

// 리플레이 파일 업로드 설정
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads/replays');
    // 디렉토리가 없으면 생성
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // 파일명: timestamp_userid_originalname
    const timestamp = Date.now();
    const userId = req.user.id;
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${timestamp}_${userId}_${name}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB 제한
  },
  fileFilter: function (req, file, cb) {
    // 리플레이 파일 확장자 확인 (.StormReplay)
    const allowedExtensions = ['.stormreplay', '.replay'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('리플레이 파일만 업로드 가능합니다 (.StormReplay)'));
    }
  }
});

/**
 * @route   POST /api/replay/upload
 * @desc    리플레이 파일 업로드
 * @access  Private
 */
router.post('/upload', authenticate, upload.single('replay'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '리플레이 파일이 필요합니다' });
    }

    const { matchId, gameVersion, gameLength, mapName, gameMode } = req.body;

    // 리플레이 정보 저장
    const replay = await global.db.Replay.create({
      matchId: matchId || null,
      uploaderId: req.user.id,
      filename: req.file.filename,
      originalFilename: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      gameVersion: gameVersion || null,
      gameLength: gameLength ? parseInt(gameLength) : null,
      mapName: mapName || null,
      gameMode: gameMode || null,
      uploadedAt: new Date()
    });

    // 로그 기록
    try {
      if (global.db && global.db.UserLog) {
        await global.db.UserLog.create({
          userId: req.user.id,
          action: 'replay_uploaded',
          details: {
            replayId: replay.id,
            filename: req.file.originalname,
            fileSize: req.file.size,
            matchId: matchId || null
          },
          ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
          userAgent: req.headers['user-agent']
        });
      }
    } catch (logErr) {
      logger.error('리플레이 업로드 로그 기록 오류:', logErr);
    }

    logger.info('리플레이 업로드 성공:', {
      replayId: replay.id,
      userId: req.user.id,
      filename: req.file.originalname,
      fileSize: req.file.size
    });

    res.status(201).json({
      success: true,
      message: '리플레이가 성공적으로 업로드되었습니다',
      replay: {
        id: replay.id,
        filename: replay.originalFilename,
        fileSize: replay.fileSize,
        gameVersion: replay.gameVersion,
        gameLength: replay.gameLength,
        mapName: replay.mapName,
        gameMode: replay.gameMode,
        uploadedAt: replay.uploadedAt
      }
    });

  } catch (err) {
    // 업로드 실패 시 파일 삭제
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    logger.error('리플레이 업로드 오류:', err);

    if (err.message.includes('리플레이 파일만')) {
      return res.status(400).json({ message: err.message });
    }

    res.status(500).json({ message: '리플레이 업로드에 실패했습니다' });
  }
});

/**
 * @route   GET /api/replay/list
 * @desc    리플레이 목록 조회
 * @access  Private
 */
router.get('/list', authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const userId = req.query.userId; // 특정 사용자의 리플레이만 조회
    const matchId = req.query.matchId; // 특정 매치의 리플레이만 조회

    let whereClause = {};

    // 사용자별 필터
    if (userId) {
      whereClause.uploaderId = userId;
    }

    // 매치별 필터
    if (matchId) {
      whereClause.matchId = matchId;
    }

    const { count, rows: replays } = await global.db.Replay.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: global.db.User,
          as: 'uploader',
          attributes: ['id', 'battleTag', 'nickname']
        },
        {
          model: global.db.Match,
          as: 'match',
          attributes: ['id', 'gameMode', 'mapName', 'status'],
          required: false
        }
      ],
      order: [['uploadedAt', 'DESC']],
      limit,
      offset
    });

    const replayList = replays.map(replay => ({
      id: replay.id,
      filename: replay.originalFilename,
      fileSize: replay.fileSize,
      gameVersion: replay.gameVersion,
      gameLength: replay.gameLength,
      mapName: replay.mapName,
      gameMode: replay.gameMode,
      uploadedAt: replay.uploadedAt,
      uploader: replay.uploader,
      match: replay.match,
      downloadUrl: `/api/replay/download/${replay.id}`
    }));

    res.json({
      replays: replayList,
      pagination: {
        total: count,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        limit
      }
    });

  } catch (err) {
    logger.error('리플레이 목록 조회 오류:', err);
    res.status(500).json({ message: '리플레이 목록 조회에 실패했습니다' });
  }
});

/**
 * @route   GET /api/replay/download/:id
 * @desc    리플레이 파일 다운로드
 * @access  Private
 */
router.get('/download/:id', authenticate, async (req, res) => {
  try {
    const replayId = req.params.id;

    const replay = await global.db.Replay.findByPk(replayId, {
      include: [
        {
          model: global.db.User,
          as: 'uploader',
          attributes: ['id', 'battleTag']
        }
      ]
    });

    if (!replay) {
      return res.status(404).json({ message: '리플레이를 찾을 수 없습니다' });
    }

    // 파일 존재 확인
    if (!fs.existsSync(replay.filePath)) {
      logger.error('리플레이 파일이 존재하지 않음:', replay.filePath);
      return res.status(404).json({ message: '리플레이 파일을 찾을 수 없습니다' });
    }

    // 로그 기록
    try {
      if (global.db && global.db.UserLog) {
        await global.db.UserLog.create({
          userId: req.user.id,
          action: 'replay_downloaded',
          details: {
            replayId: replay.id,
            filename: replay.originalFilename,
            uploaderId: replay.uploaderId
          },
          ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
          userAgent: req.headers['user-agent']
        });
      }
    } catch (logErr) {
      logger.error('리플레이 다운로드 로그 기록 오류:', logErr);
    }

    logger.info('리플레이 다운로드:', {
      replayId: replay.id,
      downloaderId: req.user.id,
      filename: replay.originalFilename
    });

    // 파일 다운로드
    res.download(replay.filePath, replay.originalFilename, (err) => {
      if (err) {
        logger.error('리플레이 파일 다운로드 오류:', err);
        if (!res.headersSent) {
          res.status(500).json({ message: '파일 다운로드에 실패했습니다' });
        }
      }
    });

  } catch (err) {
    logger.error('리플레이 다운로드 오류:', err);
    res.status(500).json({ message: '리플레이 다운로드에 실패했습니다' });
  }
});

/**
 * @route   DELETE /api/replay/:id
 * @desc    리플레이 삭제
 * @access  Private
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const replayId = req.params.id;

    const replay = await global.db.Replay.findByPk(replayId);

    if (!replay) {
      return res.status(404).json({ message: '리플레이를 찾을 수 없습니다' });
    }

    // 업로더 또는 관리자만 삭제 가능
    if (replay.uploaderId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: '리플레이를 삭제할 권한이 없습니다' });
    }

    // 파일 삭제
    if (fs.existsSync(replay.filePath)) {
      fs.unlinkSync(replay.filePath);
    }

    // 데이터베이스에서 삭제
    await replay.destroy();

    // 로그 기록
    try {
      if (global.db && global.db.UserLog) {
        await global.db.UserLog.create({
          userId: req.user.id,
          action: 'replay_deleted',
          details: {
            replayId: replay.id,
            filename: replay.originalFilename,
            originalUploaderId: replay.uploaderId
          },
          ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
          userAgent: req.headers['user-agent']
        });
      }
    } catch (logErr) {
      logger.error('리플레이 삭제 로그 기록 오류:', logErr);
    }

    logger.info('리플레이 삭제:', {
      replayId: replay.id,
      deleterId: req.user.id,
      filename: replay.originalFilename
    });

    res.json({
      success: true,
      message: '리플레이가 성공적으로 삭제되었습니다'
    });

  } catch (err) {
    logger.error('리플레이 삭제 오류:', err);
    res.status(500).json({ message: '리플레이 삭제에 실패했습니다' });
  }
});

/**
 * @route   POST /api/replay/analyze
 * @desc    리플레이 파일 분석 (업로드 + 분석)
 * @access  Private
 */
router.post('/analyze', authenticate, upload.single('replayFile'), async (req, res) => {
  const timer = logger.startTimer('Replay Analysis');

  try {
    logger.info('🎮 리플레이 분석 요청 시작', {
      userId: req.user.id,
      hasFile: !!req.file,
      originalName: req.file?.originalname
    });

    if (!req.file) {
      timer.end();
      return res.status(400).json({
        message: '리플레이 파일이 필요합니다',
        error: 'NO_FILE_UPLOADED'
      });
    }

    const filePath = req.file.path;
    const originalFilename = req.file.originalname;

    logger.info('📁 리플레이 파일 업로드 완료', {
      filePath,
      originalFilename,
      fileSize: req.file.size
    });

    // 리플레이 파일 분석
    logger.info('🔍 리플레이 파싱 시작');
    const analysisResult = await analyzeReplay(filePath);

    logger.info('✅ 리플레이 파싱 완료', {
      success: analysisResult.success,
      hasMetadata: !!analysisResult.metadata,
      hasTeams: !!analysisResult.teams
    });

    // 분석 완료 후 임시 파일 삭제
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.debug('🗑️ 임시 파일 삭제 완료:', filePath);
      }
    } catch (cleanupErr) {
      logger.warn('⚠️ 임시 파일 삭제 실패:', cleanupErr.message);
    }

    // 로그 기록
    try {
      if (global.db && global.db.UserLog) {
        await global.db.UserLog.create({
          userId: req.user.id,
          action: 'replay_analyzed',
          details: {
            filename: originalFilename,
            fileSize: req.file.size,
            success: analysisResult.success,
            error: analysisResult.error || null
          },
          ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
          userAgent: req.headers['user-agent']
        });
      }
    } catch (logErr) {
      logger.error('💾 리플레이 분석 로그 기록 오류:', logErr);
    }

    if (!analysisResult.success) {
      logger.warn('❌ 리플레이 분석 실패', {
        error: analysisResult.error,
        logs: analysisResult.logs
      });

      timer.end();
      return res.status(400).json({
        message: analysisResult.error || '리플레이 분석에 실패했습니다',
        error: 'ANALYSIS_FAILED',
        logs: analysisResult.logs || []
      });
    }

    logger.info('🎉 리플레이 분석 성공', {
      userId: req.user.id,
      filename: originalFilename,
      duration: timer.end()
    });

    res.json({
      success: true,
      message: '리플레이 분석이 완료되었습니다',
      analysisResult: analysisResult
    });

  } catch (err) {
    timer.end();

    // 오류 발생 시 임시 파일 삭제
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
        logger.debug('🗑️ 오류 발생으로 인한 임시 파일 삭제:', req.file.path);
      } catch (cleanupErr) {
        logger.warn('⚠️ 오류 발생 시 임시 파일 삭제 실패:', cleanupErr.message);
      }
    }

    logger.error('💥 리플레이 분석 중 오류', {
      error: err.message,
      stack: err.stack,
      userId: req.user?.id,
      filename: req.file?.originalname
    });

    // 에러 타입에 따른 응답
    if (err.message.includes('리플레이 파일만')) {
      return res.status(400).json({
        message: err.message,
        error: 'INVALID_FILE_TYPE'
      });
    }

    res.status(500).json({
      message: '리플레이 분석 중 오류가 발생했습니다',
      error: 'INTERNAL_SERVER_ERROR',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

module.exports = router;
