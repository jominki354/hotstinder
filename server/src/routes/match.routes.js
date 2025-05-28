const express = require('express');
const router = express.Router();
const Match = require('../models/match.model');
const MongoMatch = require('../models/MongoMatch');
const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

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

/**
 * @route   POST /api/matches/:id/submit-replay
 * @desc    리플레이 제출 및 매치 완료 처리
 * @access  Private
 */
router.post('/:id/submit-replay', authenticate, async (req, res) => {
  try {
    const { replayData, winningTeam, gameLength, playerStats, isSimulation } = req.body;
    const matchId = req.params.id;
    
    console.log('리플레이 제출 요청:', { 
      matchId, 
      winningTeam, 
      gameLength, 
      isSimulation: isSimulation || replayData?.isSimulation,
      playerCount: playerStats?.length || 0
    });
    
    // 플레이어 통계 상세 로그 출력
    if (playerStats && Array.isArray(playerStats)) {
      console.log('\n=== 플레이어 통계 상세 ===');
      playerStats.forEach((player, index) => {
        console.log(`플레이어 ${index + 1}:`, {
          userId: player.userId,
          battletag: player.battletag,
          team: player.team,
          hero: player.hero,
          kills: player.kills,
          deaths: player.deaths,
          assists: player.assists,
          heroDamage: player.heroDamage,
          siegeDamage: player.siegeDamage,
          healing: player.healing,
          experienceContribution: player.experienceContribution
        });
      });
      console.log('=== 플레이어 통계 상세 끝 ===\n');
    }
    
    // 시뮬레이션 매치인지 확인하는 함수 (먼저 정의)
    const isSimulationMatch = (matchId, playerStats) => {
      // 0. 클라이언트에서 명시적으로 전달한 플래그 확인
      if (isSimulation === true || replayData?.isSimulation === true) {
        return true;
      }
      
      // 1. 매치 ID 패턴으로 판단 (YYYYMMDD-HHMM-XXX 형식)
      const simulationPattern = /^\d{8}-\d{4}-\d{3}$/;
      if (simulationPattern.test(matchId)) {
        return true;
      }
      
      // 2. 매치 ID가 'sim_'로 시작하는 경우
      if (matchId.startsWith('sim_')) {
        return true;
      }
      
      // 3. 플레이어 ID가 시뮬레이션 패턴인 경우 (sim_team_playername)
      const hasSimulationPlayers = playerStats && playerStats.some(player => 
        player.userId && player.userId.startsWith('sim_')
      );
      if (hasSimulationPlayers) {
        return true;
      }
      
      // 4. 매치 데이터에 시뮬레이션 플래그가 있는 경우
      if (replayData && replayData.isSimulation) {
        return true;
      }
      
      return false;
    };
    
    // 매치 정보 조회 또는 생성
    let match;
    
    if (global.useNeDB) {
      // NeDB 사용 시
      const findMatchPromise = new Promise((resolve, reject) => {
        global.db.matches.findOne({ _id: matchId }, (err, doc) => {
          if (err) reject(err);
          else resolve(doc);
        });
      });
      
      match = await findMatchPromise;
      
      if (!match) {
        // 매치가 없으면 새로 생성 (시뮬레이션 매치의 경우)
        const newMatch = {
          _id: matchId,
          createdBy: req.user._id,
          status: 'completed',
          gameMode: 'ranked',
          map: replayData?.basic?.map || '알 수 없음',
          teams: {
            blue: replayData?.teams?.blue || [],
            red: replayData?.teams?.red || []
          },
          result: {
            winningTeam: winningTeam,
            gameLength: gameLength,
            completedAt: new Date()
          },
          replayData: replayData,
          playerStats: playerStats || [],
          createdAt: new Date(),
          scheduledTime: new Date()
        };
        
        const insertPromise = new Promise((resolve, reject) => {
          global.db.matches.insert(newMatch, (err, doc) => {
            if (err) reject(err);
            else resolve(doc);
          });
        });
        
        match = await insertPromise;
        console.log('새 매치 생성됨:', matchId);
      } else {
        // 기존 매치 업데이트
        const updateData = {
          status: 'completed',
          result: {
            winningTeam: winningTeam,
            gameLength: gameLength,
            completedAt: new Date()
          },
          replayData: replayData,
          playerStats: playerStats || []
        };
        
        const updatePromise = new Promise((resolve, reject) => {
          global.db.matches.update(
            { _id: matchId },
            { $set: updateData },
            {},
            (err, numReplaced) => {
              if (err) reject(err);
              else resolve(numReplaced);
            }
          );
        });
        
        await updatePromise;
        console.log('기존 매치 업데이트됨:', matchId);
      }
    } else {
      // MongoDB 사용 시
      try {
        // 먼저 ObjectId로 조회 시도
        if (mongoose.Types.ObjectId.isValid(matchId)) {
          match = await MongoMatch.findById(matchId);
        }
        
        // ObjectId로 찾지 못했거나 유효하지 않은 경우, originalMatchId로 조회
        if (!match) {
          match = await MongoMatch.findOne({ originalMatchId: matchId });
        }
        
        if (!match) {
          // 매치가 없으면 새로 생성
          const newMatchData = {
            title: `리플레이 매치 ${matchId}`,
            description: `리플레이 업로드를 위해 생성된 매치 (원본 ID: ${matchId})`,
            createdBy: req.user._id,
            status: 'completed',
            map: replayData?.basic?.map || '알 수 없음',
            teams: {
              blue: replayData?.teams?.blue || [],
              red: replayData?.teams?.red || []
            },
            result: {
              winner: winningTeam,
              blueScore: winningTeam === 'blue' ? 1 : 0,
              redScore: winningTeam === 'red' ? 1 : 0,
              duration: gameLength
            },
            replayData: replayData,
            playerStats: playerStats || [],
            originalMatchId: matchId,
            // 시뮬레이션 매치 여부를 미리 판별하여 설정
            isSimulation: isSimulationMatch(matchId, playerStats)
          };
          
          match = await MongoMatch.create(newMatchData);
          console.log('새 매치 생성됨:', match._id, '(원본 ID:', matchId, ') 시뮬레이션:', newMatchData.isSimulation);
        } else {
          // 기존 매치 업데이트
          const updateData = {
            status: 'completed',
            map: replayData?.basic?.map || match.map || '알 수 없음',
            result: {
              winner: winningTeam,
              blueScore: winningTeam === 'blue' ? 1 : 0,
              redScore: winningTeam === 'red' ? 1 : 0,
              duration: gameLength
            },
            replayData: replayData,
            playerStats: playerStats || [],
            updatedAt: new Date(),
            // 시뮬레이션 매치 여부 업데이트
            isSimulation: isSimulationMatch(matchId, playerStats)
          };
          
          match = await MongoMatch.updateById(match._id, updateData);
          console.log('기존 매치 업데이트됨:', match._id, '맵:', updateData.map, '시뮬레이션:', updateData.isSimulation);
        }
      } catch (mongoError) {
        console.error('MongoDB 매치 처리 오류:', mongoError);
        throw mongoError;
      }
    }
    
    // 플레이어 통계 업데이트 (승/패 기록)
    if (playerStats && Array.isArray(playerStats)) {
      // 시뮬레이션 매치인지 확인 (여러 방법으로 판단)
      const isSimulation = isSimulationMatch(matchId, playerStats);
      console.log(`매치 ${matchId} 시뮬레이션 여부:`, isSimulation);
      
      // 시뮬레이션 매치인 경우 매치 데이터에 플래그 추가
      if (isSimulation && match) {
        const simulationFlag = { isSimulation: true };
        
        if (global.useNeDB) {
          const updatePromise = new Promise((resolve, reject) => {
            global.db.matches.update(
              { _id: matchId },
              { $set: simulationFlag },
              {},
              (err, numReplaced) => {
                if (err) reject(err);
                else resolve(numReplaced);
              }
            );
          });
          await updatePromise;
        } else {
          await MongoMatch.updateById(match._id, simulationFlag);
        }
        console.log(`매치 ${matchId}에 시뮬레이션 플래그 추가됨`);
      }
      
      for (const playerStat of playerStats) {
        try {
          const userId = playerStat.userId;
          const isWinner = playerStat.team === winningTeam;
          
          // 시뮬레이션 매치의 경우 가상 사용자 ID 처리
          if (isSimulation) {
            // 시뮬레이션 매치는 실제 DB 업데이트 없이 로그만 남김
            console.log(`[시뮬레이션] 플레이어 ${playerStat.battletag || userId} (${playerStat.team}팀): ${isWinner ? '승리' : '패배'}`);
            console.log(`[시뮬레이션] - 영웅: ${playerStat.hero}`);
            console.log(`[시뮬레이션] - KDA: ${playerStat.kills}/${playerStat.deaths}/${playerStat.assists}`);
            console.log(`[시뮬레이션] - 데미지: 영웅 ${playerStat.heroDamage}, 공성 ${playerStat.siegeDamage}`);
            console.log(`[시뮬레이션] - 치유량: ${playerStat.healing}, 경험치: ${playerStat.experienceContribution}`);
            continue; // 실제 DB 업데이트는 건너뜀
          }
          
          // 실제 매치의 경우 기존 로직 사용
          // userId가 유효한 ObjectId인지 확인
          if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            console.log(`플레이어 통계 업데이트 건너뜀: 유효하지 않은 사용자 ID (${userId})`);
            continue;
          }
          
          if (global.useNeDB) {
            // NeDB에서 사용자 통계 업데이트
            const updateUserPromise = new Promise((resolve, reject) => {
              global.db.users.update(
                { _id: userId },
                { 
                  $inc: { 
                    'playerStats.gamesPlayed': 1,
                    'playerStats.wins': isWinner ? 1 : 0,
                    'playerStats.losses': isWinner ? 0 : 1
                  }
                },
                {},
                (err, numReplaced) => {
                  if (err) reject(err);
                  else resolve(numReplaced);
                }
              );
            });
            
            await updateUserPromise;
          } else {
            // MongoDB에서 사용자 통계 업데이트
            const updateResult = await User.findByIdAndUpdate(userId, {
              $inc: {
                'playerStats.gamesPlayed': 1,
                'playerStats.wins': isWinner ? 1 : 0,
                'playerStats.losses': isWinner ? 0 : 1
              }
            });
            
            if (!updateResult) {
              console.log(`플레이어 통계 업데이트 실패: 사용자를 찾을 수 없음 (${userId})`);
              continue;
            }
          }
          
          console.log(`플레이어 ${userId} 통계 업데이트: ${isWinner ? '승리' : '패배'}`);
        } catch (userUpdateError) {
          console.error('플레이어 통계 업데이트 오류:', userUpdateError);
          // 개별 플레이어 통계 업데이트 실패는 전체 프로세스를 중단하지 않음
        }
      }
    }
    
    res.json({
      success: true,
      message: '리플레이가 성공적으로 제출되었습니다.',
      matchId: matchId,
      match: match
    });
    
  } catch (error) {
    console.error('리플레이 제출 오류:', error);
    res.status(500).json({
      success: false,
      message: '리플레이 제출 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/matches/create-from-matchmaking
 * @desc    매치메이킹에서 매치 생성
 * @access  Private
 */
router.post('/create-from-matchmaking', authenticate, async (req, res) => {
  try {
    const { matchId, teams, map, gameMode = 'ranked' } = req.body;
    
    console.log('매치메이킹에서 매치 생성:', { matchId, map, gameMode });
    
    const newMatchData = {
      _id: matchId,
      createdBy: req.user._id,
      status: 'in_progress',
      gameMode: gameMode,
      map: map,
      teams: teams,
      createdAt: new Date(),
      scheduledTime: new Date()
    };
    
    if (global.useNeDB) {
      // NeDB 사용 시
      const insertPromise = new Promise((resolve, reject) => {
        global.db.matches.insert(newMatchData, (err, doc) => {
          if (err) reject(err);
          else resolve(doc);
        });
      });
      
      const match = await insertPromise;
      res.json({ success: true, match });
    } else {
      // MongoDB 사용 시
      const match = new Match(newMatchData);
      await match.save();
      res.json({ success: true, match });
    }
    
  } catch (error) {
    console.error('매치 생성 오류:', error);
    res.status(500).json({
      success: false,
      message: '매치 생성 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

module.exports = router; 