const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/NeDBUser');

// 매치메이킹 대기열
const matchmakingQueue = {
  players: [],
  currentPlayers: 0,
  requiredPlayers: 10,
  estimatedTime: '02:00',
  
  // MMR 범위 내의 플레이어를 찾아 매치 구성
  findMatch: async function() {
    if (this.players.length < this.requiredPlayers) {
      return null;
    }
    
    // MMR 기준으로 정렬
    this.players.sort((a, b) => a.mmr - b.mmr);
    
    // 플레이어 10명씩 팀 분배 (평균 MMR이 비슷하게)
    const matchPlayers = this.players.slice(0, this.requiredPlayers);
    
    // 팀 분배 로직 (짝수 인덱스와 홀수 인덱스로 나누기)
    const teamA = matchPlayers.filter((_, index) => index % 2 === 0);
    const teamB = matchPlayers.filter((_, index) => index % 2 === 1);
    
    // 매치 객체 생성
    const match = {
      id: `match_${Date.now()}`,
      createdAt: new Date(),
      status: 'ready',
      teams: {
        teamA: {
          players: teamA,
          averageMmr: teamA.reduce((sum, p) => sum + p.mmr, 0) / teamA.length
        },
        teamB: {
          players: teamB,
          averageMmr: teamB.reduce((sum, p) => sum + p.mmr, 0) / teamB.length
        }
      }
    };
    
    // 대기열에서 매치된 플레이어 제거
    this.players = this.players.slice(this.requiredPlayers);
    this.currentPlayers = this.players.length;
    
    return match;
  },
  
  // 매치메이킹 대기열에 플레이어 추가
  addPlayer: async function(userId) {
    try {
      // 이미 대기열에 있는지 확인
      const existingPlayer = this.players.find(p => p.userId === userId);
      if (existingPlayer) {
        return { success: false, message: '이미 대기열에 등록되어 있습니다.' };
      }
      
      // 사용자 정보 가져오기
      const user = await User.findById(userId);
      if (!user) {
        return { success: false, message: '사용자를 찾을 수 없습니다.' };
      }
      
      // MMR이 없으면 기본값 설정
      const mmr = user.mmr || 1500;
      
      // 플레이어 추가
      this.players.push({
        userId: user._id,
        battletag: user.battletag,
        nickname: user.nickname || user.battletag.split('#')[0],
        mmr: mmr,
        mainRole: user.mainRole || 'flex',
        joinedAt: new Date()
      });
      
      this.currentPlayers = this.players.length;
      
      // 예상 대기 시간 업데이트 (간단한 로직)
      this.updateEstimatedTime();
      
      return { 
        success: true, 
        queueStatus: {
          currentPlayers: this.currentPlayers,
          requiredPlayers: this.requiredPlayers,
          estimatedTime: this.estimatedTime
        }
      };
    } catch (error) {
      console.error('대기열 추가 오류:', error);
      return { success: false, message: '대기열 추가 중 오류가 발생했습니다.' };
    }
  },
  
  // 매치메이킹 대기열에서 플레이어 제거
  removePlayer: function(userId) {
    const initialCount = this.players.length;
    this.players = this.players.filter(p => p.userId !== userId);
    this.currentPlayers = this.players.length;
    
    // 예상 대기 시간 업데이트
    this.updateEstimatedTime();
    
    return { 
      success: initialCount !== this.players.length,
      queueStatus: {
        currentPlayers: this.currentPlayers,
        requiredPlayers: this.requiredPlayers,
        estimatedTime: this.estimatedTime
      }
    };
  },
  
  // 현재 대기열 상태 반환
  getStatus: function() {
    return {
      currentPlayers: this.currentPlayers,
      requiredPlayers: this.requiredPlayers,
      estimatedTime: this.estimatedTime
    };
  },
  
  // 예상 대기 시간 업데이트
  updateEstimatedTime: function() {
    if (this.players.length >= this.requiredPlayers) {
      this.estimatedTime = '00:00'; // 즉시 매치 가능
    } else if (this.players.length > 0) {
      // 간단한 예상 시간 계산 (플레이어 수에 반비례)
      const remainingPlayers = this.requiredPlayers - this.players.length;
      const minutes = Math.min(15, Math.max(1, Math.ceil(remainingPlayers / 2)));
      this.estimatedTime = `${minutes.toString().padStart(2, '0')}:00`;
    } else {
      this.estimatedTime = '--:--'; // 대기열이 비어있음
    }
  }
};

// 매치메이킹 주기적 처리 (자동 매치 찾기)
setInterval(async () => {
  if (matchmakingQueue.players.length >= matchmakingQueue.requiredPlayers) {
    const match = await matchmakingQueue.findMatch();
    if (match) {
      console.log('새로운 매치가 만들어졌습니다:', match.id);
      // 여기서 매치 정보를 데이터베이스에 저장하고 관련 로직 처리
    }
  }
}, 10000); // 10초마다 매치 찾기 시도

// 대기열 참가 API
router.post('/join', authenticateToken, async (req, res) => {
  try {
    const userId = req.body.userId || req.user._id;
    const result = await matchmakingQueue.addPlayer(userId);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('대기열 참가 API 오류:', error);
    res.status(500).json({ 
      success: false, 
      message: '대기열 참가 중 서버 오류가 발생했습니다.' 
    });
  }
});

// 대기열 취소 API
router.post('/leave', authenticateToken, (req, res) => {
  try {
    const userId = req.body.userId || req.user._id;
    const result = matchmakingQueue.removePlayer(userId);
    
    res.json(result);
  } catch (error) {
    console.error('대기열 취소 API 오류:', error);
    res.status(500).json({ 
      success: false, 
      message: '대기열 취소 중 서버 오류가 발생했습니다.' 
    });
  }
});

// 대기열 상태 조회 API
router.get('/status', authenticateToken, (req, res) => {
  try {
    const status = matchmakingQueue.getStatus();
    res.json(status);
  } catch (error) {
    console.error('대기열 상태 조회 API 오류:', error);
    res.status(500).json({ 
      success: false, 
      message: '대기열 상태 조회 중 서버 오류가 발생했습니다.' 
    });
  }
});

module.exports = router; 