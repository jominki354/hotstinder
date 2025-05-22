const express = require('express');
const router = express.Router();
const Match = require('../models/match.model');
const User = require('../models/user.model');
const jwt = require('jsonwebtoken');

// 미들웨어: 인증 확인
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
 * @route   GET /api/matches
 * @desc    매치 목록 조회
 * @access  Private
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { status = 'open', page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    // 쿼리 생성
    const query = {};
    if (status !== 'all') {
      query.status = status;
    }
    
    // 매치 조회
    const matches = await Match.find(query)
      .populate('createdBy', 'battleTag nickname profilePicture')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));
    
    // 총 매치 수 조회
    const totalMatches = await Match.countDocuments(query);
    
    res.json({
      matches,
      pagination: {
        total: totalMatches,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalMatches / limit)
      }
    });
  } catch (err) {
    console.error('매치 목록 조회 오류:', err);
    res.status(500).json({ message: '매치 목록 조회에 실패했습니다' });
  }
});

/**
 * @route   POST /api/matches
 * @desc    새 매치 생성
 * @access  Private
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { 
      title, description, gameMode, maxPlayers, 
      map, isPrivate, password, balanceType, scheduledTime 
    } = req.body;
    
    // 매치 객체 생성
    const newMatch = new Match({
      title,
      description,
      createdBy: req.user._id,
      gameMode,
      maxPlayers: maxPlayers || 10,
      map,
      isPrivate: isPrivate || false,
      password: isPrivate ? password : null,
      balanceType: balanceType || 'mmr',
      scheduledTime: scheduledTime || Date.now()
    });
    
    // 생성자를 첫 번째 참가자로 등록
    newMatch.teams.blue.push({ user: req.user._id });
    
    // 매치 저장
    await newMatch.save();
    
    // 생성된 매치 반환
    const populatedMatch = await Match.findById(newMatch._id)
      .populate('createdBy', 'battleTag nickname profilePicture')
      .populate('teams.blue.user', 'battleTag nickname profilePicture playerStats')
      .populate('teams.red.user', 'battleTag nickname profilePicture playerStats');
    
    res.status(201).json(populatedMatch);
  } catch (err) {
    console.error('매치 생성 오류:', err);
    res.status(500).json({ message: '매치 생성에 실패했습니다' });
  }
});

/**
 * @route   GET /api/matches/:id
 * @desc    특정 매치 정보 조회
 * @access  Private
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('createdBy', 'battleTag nickname profilePicture')
      .populate('teams.blue.user', 'battleTag nickname profilePicture playerStats')
      .populate('teams.red.user', 'battleTag nickname profilePicture playerStats')
      .populate('spectators', 'battleTag nickname profilePicture')
      .populate('chat.user', 'battleTag nickname profilePicture');
    
    if (!match) {
      return res.status(404).json({ message: '매치를 찾을 수 없습니다' });
    }
    
    // 비공개 매치인 경우 접근 권한 확인
    if (match.isPrivate) {
      const isCreator = match.createdBy._id.toString() === req.user._id.toString();
      const isParticipant = 
        match.teams.blue.some(p => p.user._id.toString() === req.user._id.toString()) ||
        match.teams.red.some(p => p.user._id.toString() === req.user._id.toString()) ||
        match.spectators.some(s => s._id.toString() === req.user._id.toString());
      
      if (!isCreator && !isParticipant) {
        return res.status(403).json({ message: '비공개 매치에 접근할 권한이 없습니다' });
      }
    }
    
    res.json(match);
  } catch (err) {
    console.error('매치 조회 오류:', err);
    res.status(500).json({ message: '매치 정보 조회에 실패했습니다' });
  }
});

/**
 * @route   POST /api/matches/:id/join
 * @desc    매치 참가
 * @access  Private
 */
router.post('/:id/join', authenticate, async (req, res) => {
  try {
    const { password, team, role } = req.body;
    
    // 매치 조회
    const match = await Match.findById(req.params.id);
    
    if (!match) {
      return res.status(404).json({ message: '매치를 찾을 수 없습니다' });
    }
    
    // 매치 상태 확인
    if (match.status !== 'open') {
      return res.status(400).json({ message: '참가할 수 없는 매치입니다' });
    }
    
    // 비공개 매치 패스워드 확인
    if (match.isPrivate && match.password && match.password !== password) {
      return res.status(403).json({ message: '패스워드가 일치하지 않습니다' });
    }
    
    // 이미 참가 중인지 확인
    const isAlreadyInBlue = match.teams.blue.some(p => p.user.toString() === req.user._id.toString());
    const isAlreadyInRed = match.teams.red.some(p => p.user.toString() === req.user._id.toString());
    
    if (isAlreadyInBlue || isAlreadyInRed) {
      return res.status(400).json({ message: '이미 매치에 참가 중입니다' });
    }
    
    // 매치가 가득 찼는지 확인
    if (match.getPlayerCount() >= match.maxPlayers) {
      return res.status(400).json({ message: '매치가 가득 찼습니다' });
    }
    
    // 플레이어 추가
    const playerData = { 
      user: req.user._id,
      role: role || 'any'
    };
    
    // 팀 지정 또는 자동 배정
    const targetTeam = team || (match.teams.blue.length <= match.teams.red.length ? 'blue' : 'red');
    match.teams[targetTeam].push(playerData);
    
    // 매치가 가득 찼는지 확인하고 상태 업데이트
    if (match.getPlayerCount() >= match.maxPlayers) {
      match.status = 'full';
    }
    
    // 저장
    await match.save();
    
    // 업데이트된 매치 반환
    const updatedMatch = await Match.findById(req.params.id)
      .populate('createdBy', 'battleTag nickname profilePicture')
      .populate('teams.blue.user', 'battleTag nickname profilePicture playerStats')
      .populate('teams.red.user', 'battleTag nickname profilePicture playerStats');
    
    res.json(updatedMatch);
  } catch (err) {
    console.error('매치 참가 오류:', err);
    res.status(500).json({ message: '매치 참가에 실패했습니다' });
  }
});

/**
 * @route   POST /api/matches/:id/leave
 * @desc    매치 나가기
 * @access  Private
 */
router.post('/:id/leave', authenticate, async (req, res) => {
  try {
    // 매치 조회
    const match = await Match.findById(req.params.id);
    
    if (!match) {
      return res.status(404).json({ message: '매치를 찾을 수 없습니다' });
    }
    
    // 매치 상태 확인
    if (match.status !== 'open' && match.status !== 'full') {
      return res.status(400).json({ message: '이미 진행 중인 매치를 나갈 수 없습니다' });
    }
    
    // 플레이어의 팀 확인
    const blueIndex = match.teams.blue.findIndex(p => p.user.toString() === req.user._id.toString());
    const redIndex = match.teams.red.findIndex(p => p.user.toString() === req.user._id.toString());
    
    if (blueIndex === -1 && redIndex === -1) {
      return res.status(400).json({ message: '매치에 참가하고 있지 않습니다' });
    }
    
    // 매치 생성자인 경우 매치 취소
    if (match.createdBy.toString() === req.user._id.toString()) {
      match.status = 'canceled';
    } 
    // 일반 참가자인 경우 참가자 목록에서 제거
    else {
      if (blueIndex !== -1) {
        match.teams.blue.splice(blueIndex, 1);
      } else if (redIndex !== -1) {
        match.teams.red.splice(redIndex, 1);
      }
      
      // 매치 상태 업데이트
      if (match.status === 'full') {
        match.status = 'open';
      }
    }
    
    // 저장
    await match.save();
    
    // 업데이트된 매치 반환
    const updatedMatch = await Match.findById(req.params.id)
      .populate('createdBy', 'battleTag nickname profilePicture')
      .populate('teams.blue.user', 'battleTag nickname profilePicture playerStats')
      .populate('teams.red.user', 'battleTag nickname profilePicture playerStats');
    
    res.json(updatedMatch);
  } catch (err) {
    console.error('매치 나가기 오류:', err);
    res.status(500).json({ message: '매치 나가기에 실패했습니다' });
  }
});

/**
 * @route   POST /api/matches/:id/start
 * @desc    매치 시작
 * @access  Private (생성자만)
 */
router.post('/:id/start', authenticate, async (req, res) => {
  try {
    // 매치 조회
    const match = await Match.findById(req.params.id);
    
    if (!match) {
      return res.status(404).json({ message: '매치를 찾을 수 없습니다' });
    }
    
    // 권한 확인 (생성자만 시작 가능)
    if (match.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '매치 시작 권한이 없습니다' });
    }
    
    // 매치 상태 확인
    if (match.status !== 'open' && match.status !== 'full') {
      return res.status(400).json({ message: '이미 시작되었거나 취소된 매치입니다' });
    }
    
    // 최소 플레이어 수 확인
    if (match.getPlayerCount() < 2) {
      return res.status(400).json({ message: '매치 시작을 위한 최소 플레이어 수가 부족합니다' });
    }
    
    // 매치 상태 업데이트
    match.status = 'in_progress';
    await match.save();
    
    // 업데이트된 매치 반환
    const updatedMatch = await Match.findById(req.params.id)
      .populate('createdBy', 'battleTag nickname profilePicture')
      .populate('teams.blue.user', 'battleTag nickname profilePicture playerStats')
      .populate('teams.red.user', 'battleTag nickname profilePicture playerStats');
    
    res.json(updatedMatch);
  } catch (err) {
    console.error('매치 시작 오류:', err);
    res.status(500).json({ message: '매치 시작에 실패했습니다' });
  }
});

/**
 * @route   PUT /api/matches/:id/result
 * @desc    매치 결과 업데이트
 * @access  Private (생성자만)
 */
router.put('/:id/result', authenticate, async (req, res) => {
  try {
    const { winner, blueScore, redScore, duration } = req.body;
    
    // 매치 조회
    const match = await Match.findById(req.params.id);
    
    if (!match) {
      return res.status(404).json({ message: '매치를 찾을 수 없습니다' });
    }
    
    // 권한 확인 (생성자만 결과 등록 가능)
    if (match.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '매치 결과 등록 권한이 없습니다' });
    }
    
    // 매치 상태 확인
    if (match.status !== 'in_progress') {
      return res.status(400).json({ message: '진행 중인 매치만 결과를 등록할 수 있습니다' });
    }
    
    // 결과 업데이트
    match.result = {
      winner,
      blueScore: blueScore || 0,
      redScore: redScore || 0,
      duration: duration || 0
    };
    
    // 매치 상태 업데이트
    match.status = 'completed';
    await match.save();
    
    // 플레이어 전적 업데이트
    if (winner === 'blue' || winner === 'red') {
      const winnerTeam = match.teams[winner];
      const loserTeam = match.teams[winner === 'blue' ? 'red' : 'blue'];
      
      // 승자 팀 전적 업데이트
      for (const player of winnerTeam) {
        const user = await User.findById(player.user);
        if (user) {
          // 직접 필드 사용
          user.wins += 1;
          user.mmr += 15; // MMR 증가
          await user.save();
        }
      }
      
      // 패자 팀 전적 업데이트
      for (const player of loserTeam) {
        const user = await User.findById(player.user);
        if (user) {
          // 직접 필드 사용
          user.losses += 1;
          user.mmr = Math.max(1000, user.mmr - 10); // MMR 감소 (최소값 보장)
          await user.save();
        }
      }
    } else if (winner === 'draw') {
      // 무승부인 경우 모든 플레이어 전적 업데이트
      const allPlayers = [...match.teams.blue, ...match.teams.red];
      for (const player of allPlayers) {
        const user = await User.findById(player.user);
        if (user) {
          // 직접 필드 사용
          user.mmr += 5; // 약간의 MMR 증가
          await user.save();
        }
      }
    }
    
    // 업데이트된 매치 반환
    const updatedMatch = await Match.findById(req.params.id)
      .populate('createdBy', 'battleTag nickname profilePicture')
      .populate('teams.blue.user', 'battleTag nickname mmr wins losses')
      .populate('teams.red.user', 'battleTag nickname mmr wins losses');
    
    res.json(updatedMatch);
  } catch (err) {
    console.error('매치 결과 업데이트 오류:', err);
    res.status(500).json({ message: '매치 결과 업데이트에 실패했습니다' });
  }
});

/**
 * @route   POST /api/matches/:id/chat
 * @desc    매치 채팅 메시지 추가
 * @access  Private
 */
router.post('/:id/chat', authenticate, async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message || message.trim() === '') {
      return res.status(400).json({ message: '메시지를 입력해주세요' });
    }
    
    // 매치 조회
    const match = await Match.findById(req.params.id);
    
    if (!match) {
      return res.status(404).json({ message: '매치를 찾을 수 없습니다' });
    }
    
    // 참가자 확인
    const isParticipant = 
      match.createdBy.toString() === req.user._id.toString() ||
      match.teams.blue.some(p => p.user.toString() === req.user._id.toString()) ||
      match.teams.red.some(p => p.user.toString() === req.user._id.toString()) ||
      match.spectators.some(s => s.toString() === req.user._id.toString());
    
    if (!isParticipant) {
      return res.status(403).json({ message: '매치에 참가한 사용자만 채팅을 작성할 수 있습니다' });
    }
    
    // 채팅 메시지 추가
    match.chat.push({
      user: req.user._id,
      message,
      timestamp: Date.now()
    });
    
    // 저장
    await match.save();
    
    // 새 메시지 반환
    const newMessage = match.chat[match.chat.length - 1];
    const populatedMessage = await Match.populate(newMessage, {
      path: 'user',
      select: 'battleTag nickname profilePicture'
    });
    
    res.json(populatedMessage);
  } catch (err) {
    console.error('채팅 메시지 추가 오류:', err);
    res.status(500).json({ message: '채팅 메시지 추가에 실패했습니다' });
  }
});

module.exports = router; 