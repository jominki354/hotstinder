const express = require('express');
const router = express.Router();
const upload = require('../utils/upload');
const { analyzeReplay, getReplayHeader } = require('../utils/replayParser');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

// MongoDB 모델 사용
const MongoMatch = require('../models/MongoMatch');
const MongoUser = require('../models/MongoUser');

// 인증 미들웨어
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: '인증 토큰이 필요합니다' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await MongoUser.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다' });
    }
    
    req.user = user;
    next();
  } catch (err) {
    console.error('인증 오류:', err);
    return res.status(401).json({ message: '인증에 실패했습니다' });
  }
};

// 매치 ID 유효성 검사 함수 (일반적인 문자열 ID 허용)
const isValidMatchId = (id) => {
  // 빈 문자열이나 null/undefined 체크
  if (!id || typeof id !== 'string') {
    return false;
  }
  
  // 기본적인 길이 및 문자 검사 (영숫자, 하이픈, 언더스코어 허용)
  const matchIdPattern = /^[a-zA-Z0-9\-_]{5,50}$/;
  return matchIdPattern.test(id);
};

/**
 * @route   POST /api/replay/upload
 * @desc    리플레이 파일 업로드 및 분석
 * @access  Private
 */
router.post('/upload', authenticate, upload.single('replayFile'), async (req, res) => {
  try {
    // 업로드된 파일 확인
    if (!req.file) {
      return res.status(400).json({ message: '리플레이 파일이 업로드되지 않았습니다' });
    }
    
    console.log('리플레이 파일 업로드 성공:', req.file.filename);
    
    // 파일 경로
    const filePath = req.file.path;
    
    // matchId 확인
    const matchId = req.body.matchId;
    if (!matchId) {
      fs.unlinkSync(filePath); // 파일 삭제
      return res.status(400).json({ message: '매치 ID가 필요합니다' });
    }
    
    // 매치 ID 유효성 검사
    if (!isValidMatchId(matchId)) {
      fs.unlinkSync(filePath); // 파일 삭제
      return res.status(400).json({ 
        message: '유효하지 않은 매치 ID 형식입니다',
        details: `제공된 ID: ${matchId}는 유효한 매치 ID가 아닙니다`
      });
    }
    
    // 매치 존재 여부 확인 (사용자 정의 매치 ID 지원)
    let match;
    
    try {
      // 먼저 _id로 조회 시도 (MongoDB ObjectId인 경우)
      if (mongoose.Types.ObjectId.isValid(matchId)) {
        match = await MongoMatch.findById(matchId);
      }
      
      // _id로 찾지 못했거나 ObjectId가 아닌 경우, 새로 생성
    if (!match) {
        // 사용자 정의 매치 ID로 조회하는 방법이 없으므로 새로 생성
        console.log(`매치 ID ${matchId}로 기존 매치를 찾을 수 없어 새로 생성합니다.`);
        
        // 새 매치 생성 (리플레이 업로드용 임시 매치)
        const newMatchData = {
          // _id는 MongoDB가 자동 생성하도록 하고, 사용자 정의 ID는 별도 필드로 저장
          title: `리플레이 매치 ${matchId}`,
          description: `리플레이 업로드를 위해 생성된 매치 (원본 ID: ${matchId})`,
          createdBy: req.user._id,
          status: 'completed', // 리플레이 업로드 시점에서는 이미 완료된 매치
          map: '알 수 없음', // 리플레이 분석 후 업데이트
          teams: {
            blue: [],
            red: []
          },
          // 사용자 정의 매치 ID를 별도 필드로 저장 (필요시 나중에 스키마에 추가)
          originalMatchId: matchId,
          createdAt: new Date(),
          scheduledTime: new Date()
        };
        
        match = await MongoMatch.create(newMatchData);
        console.log(`새 매치 생성됨: ${match._id} (원본 ID: ${matchId})`);
      }
    } catch (createError) {
      console.error('매치 생성 오류:', createError);
      fs.unlinkSync(filePath); // 파일 삭제
      return res.status(500).json({ message: '매치 생성 중 오류가 발생했습니다' });
    }
    
    // 새로운 hots-parser로 파싱 실행
    const parseResult = await analyzeReplay(filePath);
    
    // 파싱 실패 처리
    if (!parseResult.success) {
      fs.unlinkSync(filePath); // 파일 삭제
      return res.status(400).json({ message: `리플레이 파싱 실패: ${parseResult.error}` });
    }
    
    // 분석 결과 생성 (클라이언트가 기대하는 형식)
    const analysisResult = {
      basic: {
        map: parseResult.match.map,
        gameMode: parseResult.match.gameMode,
        gameLength: parseResult.match.gameLength,
        winningTeam: parseResult.match.winner, // 0 = blue, 1 = red
      uploadedAt: new Date()
      },
      teams: {
        blue: parseResult.players.blue,
        red: parseResult.players.red
      },
      statistics: parseResult.statistics,
      metadata: parseResult.metadata
    };
    
    // 매치 결과 업데이트
    match.result = {
      winner: parseResult.match.winner === 0 ? 'blue' : 'red',
      blueScore: parseResult.match.winner === 0 ? 1 : 0,
      redScore: parseResult.match.winner === 1 ? 1 : 0,
      duration: parseResult.match.gameLength,
      details: analysisResult
    };
    
    // 매치 맵 정보 업데이트
    if (match.map === '알 수 없음' && parseResult.match.map) {
      match.map = parseResult.match.map;
    }
    
    // 매치 상태 업데이트
    match.status = 'completed';
    
    // 매치 저장
    await MongoMatch.updateById(match._id, {
      result: match.result,
      status: match.status,
      map: match.map,
      updatedAt: new Date()
    });
    
    // 결과 반환 (클라이언트가 기대하는 형식)
    res.status(200).json({ 
      message: '리플레이 파일이 성공적으로 업로드되고 분석되었습니다',
      analysisResult,
      matchId: match._id
    });
    
  } catch (err) {
    console.error('리플레이 업로드 오류:', err);
    
    // 업로드된 파일이 있다면 삭제
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('파일 삭제 오류:', unlinkError);
      }
    }
    
    res.status(500).json({ 
      message: '리플레이 업로드 중 오류가 발생했습니다',
      error: err.message 
    });
  }
});

/**
 * @route   POST /api/replay/analyze
 * @desc    리플레이 파일 분석만 수행 (매치 ID 없이)
 * @access  Private
 */
router.post('/analyze', authenticate, upload.single('replayFile'), async (req, res) => {
  try {
    // 업로드된 파일 확인
    if (!req.file) {
      return res.status(400).json({ message: '리플레이 파일이 업로드되지 않았습니다' });
    }
    
    console.log('리플레이 분석 파일 업로드 성공:', req.file.filename);
    
    // 파일 경로
    const filePath = req.file.path;
    
    try {
      // 새로운 hots-parser로 파싱 실행
      const parseResult = await analyzeReplay(filePath);
      
      // 파싱 실패 처리
      if (!parseResult.success) {
        fs.unlinkSync(filePath); // 파일 삭제
        return res.status(400).json({ message: `리플레이 파싱 실패: ${parseResult.error}` });
      }
      
      // 분석 결과 생성 (새로운 형식)
      const analysisResult = {
        basic: {
          map: parseResult.match.map,
          gameMode: parseResult.match.gameMode,
          gameLength: parseResult.match.gameLength,
          winner: parseResult.match.winner === 0 ? 'blue' : 'red',
          uploadedAt: new Date()
        },
        teams: {
          blue: parseResult.players.blue,
          red: parseResult.players.red
        },
        statistics: parseResult.statistics,
        metadata: parseResult.metadata
      };
      
      // 파일 삭제 (분석만 하고 저장하지 않음)
      fs.unlinkSync(filePath);
      
      // 결과 반환
      res.status(200).json({ 
        message: '리플레이 파일이 성공적으로 분석되었습니다',
        analysisResult
      });
    } catch (err) {
      console.error('리플레이 분석 오류:', err);
      
      // 업로드된 파일이 있다면 삭제
      if (req.file && req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error('파일 삭제 오류:', unlinkError);
        }
      }
      
      res.status(500).json({ 
        message: '리플레이 분석 중 오류가 발생했습니다',
        error: err.message 
      });
    }
  } catch (err) {
    console.error('리플레이 분석 오류:', err);
    
    // 업로드된 파일이 있다면 삭제
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('파일 삭제 오류:', unlinkError);
      }
    }
    
    res.status(500).json({ 
      message: '리플레이 분석 중 오류가 발생했습니다',
      error: err.message 
    });
  }
});

/**
 * @route   GET /api/replay/matches
 * @desc    리플레이가 업로드된 매치 목록 조회
 * @access  Private
 */
router.get('/matches', authenticate, async (req, res) => {
  try {
    const matches = await MongoMatch.find({
      'result.details.replayFile': { $exists: true }
    })
    .populate('createdBy', 'battleTag nickname')
    .populate('result.details.uploadedBy', 'battleTag nickname')
    .sort('-updatedAt')
    .limit(20);
    
    res.json(matches);
  } catch (err) {
    console.error('리플레이 매치 목록 조회 오류:', err);
    res.status(500).json({ message: '매치 목록 조회 중 오류가 발생했습니다' });
  }
});

module.exports = router; 