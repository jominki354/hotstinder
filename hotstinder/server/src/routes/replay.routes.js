const express = require('express');
const router = express.Router();
const upload = require('../utils/upload');
const replayParser = require('../utils/replayParser');
const Match = require('../models/match.model');
const User = require('../models/user.model');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

// 인증 미들웨어
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: '인증 토큰이 필요합니다' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.id);
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
    
    // 매치 존재 여부 확인
    const match = await Match.findById(matchId);
    if (!match) {
      fs.unlinkSync(filePath); // 파일 삭제
      return res.status(404).json({ message: '매치를 찾을 수 없습니다' });
    }
    
    // 파싱 실행
    const parseResult = await replayParser.parseReplay(filePath);
    
    // 파싱 실패 처리
    if (!parseResult.success) {
      fs.unlinkSync(filePath); // 파일 삭제
      return res.status(400).json({ message: `리플레이 파싱 실패: ${parseResult.error}` });
    }
    
    // 매치 데이터 추출
    const matchData = replayParser.extractMatchData(parseResult);
    
    // 플레이어 정보 매핑 (배틀태그로 사용자 찾기)
    const blueTeamPlayers = [];
    const redTeamPlayers = [];
    
    // 게임 결과 정보
    const gameResult = {
      map: matchData.mapName,
      gameMode: matchData.gameMode,
      gameLength: matchData.gameLength,
      winner: matchData.winner === 0 ? 'blue' : 'red',
      replayFile: req.file.filename,
      blueTeam: matchData.blueTeam,
      redTeam: matchData.redTeam,
      uploadedBy: req.user._id,
      uploadedAt: new Date()
    };
    
    // 매치 결과 업데이트
    match.result = {
      winner: gameResult.winner,
      blueScore: gameResult.winner === 'blue' ? 1 : 0,
      redScore: gameResult.winner === 'red' ? 1 : 0,
      duration: matchData.gameLength,
      details: gameResult
    };
    
    // 매치 상태 업데이트
    match.status = 'completed';
    
    // 매치 저장
    await match.save();
    
    // 결과 반환
    res.status(200).json({ 
      message: '리플레이 파일이 성공적으로 업로드되고 분석되었습니다',
      gameResult
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
    
    res.status(500).json({ message: '리플레이 업로드 중 오류가 발생했습니다' });
  }
});

/**
 * @route   GET /api/replay/matches
 * @desc    리플레이가 업로드된 매치 목록 조회
 * @access  Private
 */
router.get('/matches', authenticate, async (req, res) => {
  try {
    const matches = await Match.find({
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