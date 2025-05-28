const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/user.model');  // MongoDB User 모델
const NeDBUser = require('../models/NeDBUser'); // NeDB User 모델
const Match = require('../models/match.model');

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
  
  // 특정 사용자의 대기 시간 계산 (초 단위)
  getPlayerWaitTime: function(userId) {
    const player = this.players.find(p => p.userId === userId || p.userId.toString() === userId.toString());
    if (!player || !player.joinedAt) {
      return 0;
    }
    
    // 서버 시간 기준으로 대기 시간 계산 (초 단위)
    const waitTimeMs = Date.now() - player.joinedAt.getTime();
    return Math.floor(waitTimeMs / 1000);
  },
  
  // 매치메이킹 대기열에 플레이어 추가
  addPlayer: async function(userId) {
    try {
      console.log('대기열 플레이어 추가 시도:', { userId });
      
      // 유효한 사용자 ID 검증
      if (!userId) {
        console.error('대기열 추가 실패: 유효하지 않은 사용자 ID');
        return { success: false, message: '유효하지 않은 사용자 ID입니다.' };
      }
      
      // 이미 대기열에 있는지 확인
      const existingPlayer = this.players.find(p => p.userId === userId || p.userId.toString() === userId.toString());
      if (existingPlayer) {
        console.warn('대기열 추가 실패: 이미 대기열에 존재', { 
          userId,
          joinedAt: existingPlayer.joinedAt,
          waitTime: this.getPlayerWaitTime(userId)
        });
        return { 
          success: false, 
          message: '이미 대기열에 등록되어 있습니다.',
          waitTime: this.getPlayerWaitTime(userId)
        };
      }
      
      // 사용자 정보 가져오기
      let user;
      try {
        // 데이터베이스 타입에 따라 다른 모델 사용
        if (global.useNeDB) {
          console.log('NeDB에서 사용자 조회 시도:', { userId });
          user = await NeDBUser.findById(userId);
        } else {
          console.log('MongoDB에서 사용자 조회 시도:', { userId });
          user = await User.findById(userId);
        }
        
        console.log('사용자 정보 조회 결과:', { 
          found: !!user,
          userId,
          battletag: user?.battletag || user?.battleTag
        });
      } catch (dbErr) {
        console.error('대기열 추가 시 사용자 정보 조회 오류:', dbErr);
        return { success: false, message: '사용자 정보를 조회하는데 실패했습니다.' };
      }
      
      if (!user) {
        console.error('대기열 추가 실패: 사용자 정보 없음', { userId });
        return { success: false, message: '사용자를 찾을 수 없습니다.' };
      }
      
      // MMR이 없으면 기본값 설정
      const mmr = user.mmr || 1500;
      const battletag = user.battletag || user.battleTag || `unknown#${userId.substring(0, 4)}`;
      
      // 플레이어 추가 (서버 시간으로 대기 시작 시간 기록)
      const joinTime = new Date();
      const newPlayer = {
        userId: user._id,
        battletag: battletag,
        nickname: user.nickname || battletag.split('#')[0],
        mmr: mmr,
        mainRole: user.preferredRoles?.[0] || 'flex',
        joinedAt: joinTime
      };
      
      this.players.push(newPlayer);
      this.currentPlayers = this.players.length;
      
      // 예상 대기 시간 업데이트 (간단한 로직)
      this.updateEstimatedTime();
      
      console.log('대기열 추가 성공:', { 
        userId: newPlayer.userId, 
        battletag: newPlayer.battletag, 
        mmr: newPlayer.mmr,
        joinedAt: joinTime,
        currentPlayersInQueue: this.currentPlayers
      });
      
      return { 
        success: true, 
        queueStatus: {
          currentPlayers: this.currentPlayers,
          requiredPlayers: this.requiredPlayers,
          estimatedTime: this.estimatedTime
        },
        waitTime: 0, // 방금 추가되었으므로 0초
        joinedAt: joinTime.toISOString()
      };
    } catch (error) {
      console.error('대기열 추가 중 예외 발생:', error);
      return { 
        success: false, 
        message: '대기열 추가 중 오류가 발생했습니다. 다시 시도해주세요.',
        errorDetail: error.message || '알 수 없는 오류'
      };
    }
  },
  
  // 매치메이킹 대기열에서 플레이어 제거
  removePlayer: function(userId) {
    try {
      console.log('대기열 플레이어 제거 시도:', { userId });
      const initialCount = this.players.length;
      
      // 현재 대기열에 있는지 확인
      const existingPlayer = this.players.find(p => p.userId === userId || p.userId.toString() === userId.toString());
      if (!existingPlayer) {
        console.warn('대기열 제거 실패: 대기열에 존재하지 않음', { userId });
        return { 
          success: false, 
          message: '대기열에 등록되어 있지 않습니다.',
          queueStatus: this.getStatus()
        };
      }
      
      // 플레이어 제거
      this.players = this.players.filter(p => p.userId !== userId && p.userId.toString() !== userId.toString());
      this.currentPlayers = this.players.length;
      
      // 예상 대기 시간 업데이트
      this.updateEstimatedTime();
      
      console.log('대기열 제거 결과:', { 
        userId, 
        removed: initialCount !== this.players.length,
        previousCount: initialCount,
        currentCount: this.currentPlayers
      });
      
      return { 
        success: initialCount !== this.players.length,
        queueStatus: {
          currentPlayers: this.currentPlayers,
          requiredPlayers: this.requiredPlayers,
          estimatedTime: this.estimatedTime
        }
      };
    } catch (error) {
      console.error('대기열 제거 중 예외 발생:', error);
      return { 
        success: false, 
        message: '대기열 제거 중 오류가 발생했습니다.',
        errorDetail: error.message || '알 수 없는 오류',
        queueStatus: this.getStatus()
      };
    }
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
    // 인증 상태 로깅
    console.log('대기열 참가 API 인증 확인:', { 
      isAuthenticated: !!req.user,
      userId: req.user?._id,
      userBattleTag: req.user?.battleTag || req.user?.battletag
    });

    // 사용자 ID 검증
    const userId = req.body.userId || req.user?._id;
    if (!userId) {
      console.error('대기열 참가 실패: 사용자 ID가 없음');
      return res.status(400).json({ 
        success: false, 
        message: '사용자 ID가 필요합니다.' 
      });
    }

    console.log('대기열 참가에 사용될 ID:', { 
      userId, 
      fromReq: !!req.body.userId, 
      fromAuth: !!req.user?._id,
      authUser: !!req.user 
    });

    // 유효한 ObjectId인지 확인
    try {
      // ObjectId 유효성 검사 로직 (MongoDB와 NeDB에 따라 다를 수 있음)
      if (userId.length < 5) {
        console.error('대기열 참가 실패: 유효하지 않은 사용자 ID 형식', { userId });
        return res.status(400).json({ 
          success: false, 
          message: '유효하지 않은 사용자 ID 형식입니다.' 
        });
      }
    } catch (idErr) {
      console.error('대기열 참가 실패: 유효하지 않은 ID 형식', idErr);
      return res.status(400).json({ 
        success: false, 
        message: '유효하지 않은 사용자 ID 형식입니다.' 
      });
    }

    console.log('대기열 참가 시도:', { userId });
    const result = await matchmakingQueue.addPlayer(userId);
    
    if (result.success) {
      console.log('대기열 참가 성공:', { userId, currentPlayers: matchmakingQueue.currentPlayers });
      res.json(result);
    } else {
      console.error('대기열 참가 실패:', result.message, { userId });
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('대기열 참가 API 오류:', error, { userId: req.body.userId || req.user?._id || '알 수 없음' });
    res.status(500).json({ 
      success: false, 
      message: '대기열 참가 중 오류가 발생했습니다. 다시 시도해주세요.', 
      errorDetail: error.message || '알 수 없는 오류'
    });
  }
});

// 대기열 취소 API
router.post('/leave', authenticateToken, (req, res) => {
  try {
    // 인증 상태 로깅
    console.log('대기열 취소 API 인증 확인:', { 
      isAuthenticated: !!req.user,
      userId: req.user?._id
    });

    const userId = req.body.userId || req.user?._id;
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: '사용자 ID가 필요합니다.' 
      });
    }

    console.log('대기열 취소 시도:', { userId });
    const result = matchmakingQueue.removePlayer(userId);
    
    console.log('대기열 취소 결과:', { userId, success: result.success });
    res.json(result);
  } catch (error) {
    console.error('대기열 취소 API 오류:', error, { userId: req.body.userId || req.user?._id || '알 수 없음' });
    res.status(500).json({ 
      success: false, 
      message: '대기열 취소 중 오류가 발생했습니다. 다시 시도해주세요.',
      errorDetail: error.message || '알 수 없는 오류'
    });
  }
});

// 대기열 상태 조회 API
router.get('/status', authenticateToken, (req, res) => {
  try {
    // 인증 상태 로깅
    console.log('대기열 상태 조회 API 인증 확인:', { 
      isAuthenticated: !!req.user,
      userId: req.user?._id
    });
    
    const userId = req.user?._id;
    const status = matchmakingQueue.getStatus();
    
    // 사용자가 대기열에 있는 경우 대기 시간 추가
    let waitTime = 0;
    let joinedAt = null;
    let inQueue = false;
    
    if (userId) {
      const player = matchmakingQueue.players.find(p => 
        p.userId === userId || p.userId.toString() === userId.toString()
      );
      
      if (player) {
        waitTime = matchmakingQueue.getPlayerWaitTime(userId);
        joinedAt = player.joinedAt.toISOString();
        inQueue = true;
      }
    }
    
    res.json({
      ...status,
      waitTime,
      joinedAt,
      inQueue,
      serverTime: new Date().toISOString() // 서버 시간 추가
    });
  } catch (error) {
    console.error('대기열 상태 조회 API 오류:', error);
    res.status(500).json({ 
      success: false, 
      message: '대기열 상태 조회 중 서버 오류가 발생했습니다.' 
    });
  }
});

/**
 * @route   GET /api/matchmaking/recent-games
 * @desc    최근 완료된 게임 목록 조회
 * @access  Public
 */
router.get('/recent-games', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const skip = (page - 1) * limit;
    let recentGames = [];
    let totalCount = 0; // 전체 게임 수를 저장할 변수
    
    if (global.useNeDB) {
      // NeDB 사용 시 최근 매치 조회
      try {
        // 전체 완료된 게임 수 먼저 조회
        const countPromise = new Promise((resolve, reject) => {
          global.db.matches.count({ status: 'completed' }, (err, count) => {
            if (err) reject(err);
            else resolve(count);
          });
        });
        
        totalCount = await countPromise;
        
        // 페이지네이션을 적용한 쿼리
        const gamesPromise = new Promise((resolve, reject) => {
          global.db.matches
            .find({ status: 'completed' })
            .sort({ scheduledTime: -1 })
            .skip(skip)
            .limit(limit)
            .exec((err, docs) => {
              if (err) reject(err);
              else resolve(docs);
            });
        });
        
        recentGames = await gamesPromise;
        
        // 빈 배열 확인
        if (!Array.isArray(recentGames) || recentGames.length === 0) {
          // 전체 게임 수를 헤더에 추가
          res.set('X-Total-Count', totalCount.toString());
          return res.json([]);
        }
        
        // 각 게임의 상세 정보 추가
        const populatedGames = await Promise.all(recentGames.map(async (game) => {
          // 유효한 팀 데이터가 있는지 확인
          if (!game || !game.teams || !game.teams.blue || !game.teams.red) {
            console.warn('유효하지 않은 게임 데이터:', game?._id);
            return null;
          }
          
          // 기본값 설정으로 안전한 접근 보장
          const blueTeam = Array.isArray(game.teams.blue) ? game.teams.blue : [];
          const redTeam = Array.isArray(game.teams.red) ? game.teams.red : [];
          
          // playerStats 배열에서 통계 데이터 가져오기
          const playerStats = Array.isArray(game.playerStats) ? game.playerStats : [];
          console.log(`[DEBUG] 게임 ${game._id} playerStats 개수:`, playerStats.length);
          
          // 플레이어 통계를 battletag로 매핑하는 함수
          const getPlayerStats = (battletag, team) => {
            const stats = playerStats.find(stat => 
              stat.battletag === battletag && stat.team === team
            );
            if (stats) {
              console.log(`[DEBUG] ${battletag} 통계 발견:`, {
                kills: stats.kills,
                deaths: stats.deaths,
                assists: stats.assists,
                heroDamage: stats.heroDamage,
                siegeDamage: stats.siegeDamage,
                healing: stats.healing
              });
            }
            return stats || {};
          };
          
          // 시뮬레이션 매치인지 확인
          const isSimulationMatch = game.isSimulation || 
            (playerStats.length > 0 && playerStats.some(p => p.userId && p.userId.startsWith('sim_')));
          
          // 시뮬레이션 매치의 경우 playerStats에서 직접 플레이어 정보 생성
          if (isSimulationMatch && playerStats.length > 0) {
            console.log(`[DEBUG] 시뮬레이션 매치 감지: ${game._id}, playerStats에서 직접 플레이어 정보 생성`);
            
            // playerStats에서 팀별로 플레이어 분리
            const blueTeamStats = playerStats.filter(p => p.team === 'blue');
            const redTeamStats = playerStats.filter(p => p.team === 'red');
            
            // 팀별 평균 MMR 계산 (시뮬레이션은 기본 1500)
            const blueTeamAvgMmr = 1500;
            const redTeamAvgMmr = 1500;
            
            // 플레이어 정보 변환 함수 (시뮬레이션용)
            const formatSimulationPlayers = (teamStats) => {
              return teamStats.map(player => ({
                id: player.userId || 'unknown',
                nickname: player.battletag ? player.battletag.split('#')[0] : '시뮬레이션 플레이어',
                role: '알 수 없음',
                hero: player.hero || '알 수 없음',
                kills: player.kills || 0,
                deaths: player.deaths || 0,
                assists: player.assists || 0,
                heroDamage: player.heroDamage || 0,
                siegeDamage: player.siegeDamage || 0,
                healing: player.healing || 0,
                experienceContribution: player.experienceContribution || 0,
                mmrBefore: 1500,
                mmrAfter: 1500,
                mmrChange: 0
              }));
            };

            return {
              id: game._id,
              title: game.title || '시뮬레이션 매치',
              map: game.map || '알 수 없는 맵',
              gameMode: '시뮬레이션',
              date: formattedDate,
              time: formattedTime,
              duration: formattedDuration,
              winner: game.result?.winner || 'none',
              blueTeam: {
                name: '블루팀 (시뮬레이션)',
                avgMmr: blueTeamAvgMmr,
                players: formatSimulationPlayers(blueTeamStats)
              },
              redTeam: {
                name: '레드팀 (시뮬레이션)',
                avgMmr: redTeamAvgMmr,
                players: formatSimulationPlayers(redTeamStats)
              }
            };
          }
          
          // 블루팀과 레드팀 유저 정보 불러오기
          const blueTeamUsers = await Promise.all(blueTeam.map(async (player) => {
            try {
              if (!player || !player.user) return { userInfo: null };
              
              const user = await global.db.users.findOne({ _id: player.user });
              const userInfo = user ? {
                _id: user._id,
                nickname: user.nickname || (user.battletag ? user.battletag.split('#')[0] : '알 수 없음'),
                battletag: user.battletag,
                mmr: user.mmr || 1500
              } : null;
              
              // playerStats에서 해당 플레이어의 통계 찾기
              const stats = userInfo ? getPlayerStats(userInfo.battletag, 'blue') : {};
              
              return {
                ...player,
                userInfo: userInfo,
                stats: stats
              };
            } catch (err) {
              console.error('플레이어 정보 조회 오류:', err);
              return { userInfo: null, stats: {} };
            }
          }));
          
          const redTeamUsers = await Promise.all(redTeam.map(async (player) => {
            try {
              if (!player || !player.user) return { userInfo: null };
              
              const user = await global.db.users.findOne({ _id: player.user });
              const userInfo = user ? {
                _id: user._id,
                nickname: user.nickname || (user.battletag ? user.battletag.split('#')[0] : '알 수 없음'),
                battletag: user.battletag,
                mmr: user.mmr || 1500
              } : null;
              
              // playerStats에서 해당 플레이어의 통계 찾기
              const stats = userInfo ? getPlayerStats(userInfo.battletag, 'red') : {};
              
              return {
                ...player,
                userInfo: userInfo,
                stats: stats
              };
            } catch (err) {
              console.error('플레이어 정보 조회 오류:', err);
              return { userInfo: null, stats: {} };
            }
          }));
          
          // 유효한 유저만 필터링
          const validBlueTeamUsers = blueTeamUsers.filter(player => player.userInfo);
          const validRedTeamUsers = redTeamUsers.filter(player => player.userInfo);
          
          // 블루팀과 레드팀의 평균 MMR 계산 (유효한 유저가 없는 경우 기본값 설정)
          const blueTeamAvgMmr = validBlueTeamUsers.length > 0 
            ? Math.round(validBlueTeamUsers.reduce((sum, player) => sum + (player.userInfo?.mmr || 1500), 0) / validBlueTeamUsers.length)
            : 1500;
          
          const redTeamAvgMmr = validRedTeamUsers.length > 0
            ? Math.round(validRedTeamUsers.reduce((sum, player) => sum + (player.userInfo?.mmr || 1500), 0) / validRedTeamUsers.length)
            : 1500;
          
          // 게임 시간 형식화
          const gameDate = new Date(game.scheduledTime || Date.now());
          const formattedDate = `${gameDate.getFullYear()}년 ${gameDate.getMonth() + 1}월 ${gameDate.getDate()}일`;
          const hours = gameDate.getHours().toString().padStart(2, '0');
          const minutes = gameDate.getMinutes().toString().padStart(2, '0');
          const formattedTime = `${hours}:${minutes}`;
          
          // 게임 시간 형식화 (분:초)
          const duration = game.result?.duration || 0;
          const durationMinutes = Math.floor(duration / 60);
          const durationSeconds = duration % 60;
          const formattedDuration = `${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}`;
          
          // 팀 이름 생성 (없는 경우 기본값 설정)
          let blueTeamName = '블루팀';
          let redTeamName = '레드팀';
          
          try {
            if (validBlueTeamUsers.length > 0) {
              const blueNames = validBlueTeamUsers
                .map(player => player.userInfo?.nickname || '알 수 없음')
                .join(', ');
              blueTeamName = blueNames.length > 15 ? blueNames.substring(0, 15) + '...' : blueNames;
            }
            
            if (validRedTeamUsers.length > 0) {
              const redNames = validRedTeamUsers
                .map(player => player.userInfo?.nickname || '알 수 없음')
                .join(', ');
              redTeamName = redNames.length > 15 ? redNames.substring(0, 15) + '...' : redNames;
            }
          } catch (err) {
            console.error('팀 이름 생성 오류:', err);
          }
          
          return {
            id: game._id,
            title: game.title || '알 수 없는 매치',
            map: game.map || '알 수 없는 맵',
            gameMode: game.gameMode || '알 수 없는 모드',
            date: formattedDate,
            time: formattedTime,
            duration: formattedDuration,
            winner: game.result?.winner || 'none',
            blueTeam: {
              name: blueTeamName,
              avgMmr: blueTeamAvgMmr,
              players: validBlueTeamUsers.map(player => ({
                id: player.userInfo?._id,
                nickname: player.userInfo?.nickname || '알 수 없음',
                role: player.role || '알 수 없음',
                hero: player.stats?.hero || player.hero || '알 수 없음',
                kills: player.stats?.kills || 0,
                deaths: player.stats?.deaths || 0,
                assists: player.stats?.assists || 0,
                heroDamage: player.stats?.heroDamage || 0,
                siegeDamage: player.stats?.siegeDamage || 0,
                healing: player.stats?.healing || 0,
                experienceContribution: player.stats?.experienceContribution || 0,
                mmrBefore: player.stats?.mmrBefore || 1500,
                mmrAfter: player.stats?.mmrAfter || 1500,
                mmrChange: player.stats?.mmrChange || 0
              }))
            },
            redTeam: {
              name: redTeamName,
              avgMmr: redTeamAvgMmr,
              players: validRedTeamUsers.map(player => ({
                id: player.userInfo?._id,
                nickname: player.userInfo?.nickname || '알 수 없음',
                role: player.role || '알 수 없음',
                hero: player.stats?.hero || player.hero || '알 수 없음',
                kills: player.stats?.kills || 0,
                deaths: player.stats?.deaths || 0,
                assists: player.stats?.assists || 0,
                heroDamage: player.stats?.heroDamage || 0,
                siegeDamage: player.stats?.siegeDamage || 0,
                healing: player.stats?.healing || 0,
                experienceContribution: player.stats?.experienceContribution || 0,
                mmrBefore: player.stats?.mmrBefore || 1500,
                mmrAfter: player.stats?.mmrAfter || 1500,
                mmrChange: player.stats?.mmrChange || 0
              }))
            }
          };
        }));
        
        // null 값 필터링
        const validGames = populatedGames.filter(game => game !== null);
        
        // 전체 게임 수를 헤더에 추가
        res.set('X-Total-Count', totalCount.toString());
        res.json(validGames);
      } catch (nedbErr) {
        console.error('NeDB 최근 게임 조회 오류:', nedbErr);
        // 오류 발생 시 빈 배열 반환
        res.json([]);
      }
    } else {
      // MongoDB 사용 시 최근 매치 조회
      try {
        // 전체 완료된 게임 수 조회
        totalCount = await Match.countDocuments({ status: 'completed' });
        
        // 페이지네이션을 적용한 쿼리
        recentGames = await Match.find({ status: 'completed' })
          .sort({ scheduledTime: -1 })
          .skip(skip)
          .limit(limit)
          .populate('teams.blue.user', 'battleTag nickname mmr battletag')
          .populate('teams.red.user', 'battleTag nickname mmr battletag');
          
        // 전체 게임 수를 헤더에 추가
        res.set('X-Total-Count', totalCount.toString());
      
        // 클라이언트에 맞는 형식으로 변환
        const formattedGames = recentGames.map(game => {
          // 게임 시간 형식화
          const gameDate = new Date(game.scheduledTime || Date.now());
          const formattedDate = `${gameDate.getFullYear()}년 ${gameDate.getMonth() + 1}월 ${gameDate.getDate()}일`;
          const hours = gameDate.getHours().toString().padStart(2, '0');
          const minutes = gameDate.getMinutes().toString().padStart(2, '0');
          const formattedTime = `${hours}:${minutes}`;
          
          // 게임 시간 형식화 (분:초)
          const duration = game.result?.duration || 0;
          const durationMinutes = Math.floor(duration / 60);
          const durationSeconds = duration % 60;
          const formattedDuration = `${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}`;

          // 팀 구성 확인 및 변환
          const blueTeam = Array.isArray(game.teams?.blue) ? game.teams.blue : [];
          const redTeam = Array.isArray(game.teams?.red) ? game.teams.red : [];
          
          // playerStats 배열에서 통계 데이터 가져오기
          const playerStats = Array.isArray(game.playerStats) ? game.playerStats : [];
          console.log(`[DEBUG] MongoDB 게임 ${game._id} playerStats 개수:`, playerStats.length);
          
          // 플레이어 통계를 battletag로 매핑하는 함수
          const getPlayerStats = (battletag, team) => {
            const stats = playerStats.find(stat => 
              stat.battletag === battletag && stat.team === team
            );
            if (stats) {
              console.log(`[DEBUG] MongoDB ${battletag} 통계 발견:`, {
                kills: stats.kills,
                deaths: stats.deaths,
                assists: stats.assists,
                heroDamage: stats.heroDamage,
                siegeDamage: stats.siegeDamage,
                healing: stats.healing
              });
            }
            return stats || {};
          };

          // 팀별 평균 MMR 계산
          const calcAvgMmr = (players) => {
            if(!players || players.length === 0) return 1500;
            let totalMmr = 0;
            let validPlayers = 0;
            
            players.forEach(player => {
              if(player.user && typeof player.user === 'object') {
                const mmr = player.user.mmr || 1500;
                totalMmr += mmr;
                validPlayers++;
              }
            });
            
            return validPlayers > 0 ? Math.round(totalMmr / validPlayers) : 1500;
          };

          // 팀 이름 생성
          const blueTeamName = '블루팀';
          const redTeamName = '레드팀';

          // 플레이어 정보 변환 함수
          const formatPlayers = (teamPlayers, teamName) => {
            if(!teamPlayers || !Array.isArray(teamPlayers)) return [];
            
            return teamPlayers.map(player => {
              const userInfo = player.user;
              const nickname = userInfo?.nickname || 
                (userInfo?.battletag ? userInfo.battletag.split('#')[0] : 
                (userInfo?.battleTag ? userInfo.battleTag.split('#')[0] : '알 수 없음'));
              
              // playerStats에서 해당 플레이어의 통계 찾기
              const battletag = userInfo?.battletag || userInfo?.battleTag;
              const stats = battletag ? getPlayerStats(battletag, teamName) : {};
              
              return {
                id: userInfo?._id || 'unknown',
                nickname: nickname,
                role: player.role || '알 수 없음',
                hero: stats?.hero || player.hero || '알 수 없음',
                kills: stats?.kills || 0,
                deaths: stats?.deaths || 0,
                assists: stats?.assists || 0,
                heroDamage: stats?.heroDamage || 0,
                siegeDamage: stats?.siegeDamage || 0,
                healing: stats?.healing || 0,
                experienceContribution: stats?.experienceContribution || 0,
                mmrBefore: stats?.mmrBefore || 1500,
                mmrAfter: stats?.mmrAfter || 1500,
                mmrChange: stats?.mmrChange || 0
              };
            });
          };

          // 시뮬레이션 매치인지 확인
          const isSimulationMatch = game.isSimulation || 
            (playerStats.length > 0 && playerStats.some(p => p.userId && p.userId.startsWith('sim_')));
          
          // 시뮬레이션 매치의 경우 playerStats에서 직접 플레이어 정보 생성
          if (isSimulationMatch && playerStats.length > 0) {
            console.log(`[DEBUG] MongoDB 시뮬레이션 매치 감지: ${game._id}, playerStats에서 직접 플레이어 정보 생성`);
            
            // playerStats에서 팀별로 플레이어 분리
            const blueTeamStats = playerStats.filter(p => p.team === 'blue');
            const redTeamStats = playerStats.filter(p => p.team === 'red');
            
            // 팀별 평균 MMR 계산 (시뮬레이션은 기본 1500)
            const blueTeamAvgMmr = 1500;
            const redTeamAvgMmr = 1500;
            
            // 플레이어 정보 변환 함수 (시뮬레이션용)
            const formatSimulationPlayers = (teamStats) => {
              return teamStats.map(player => ({
                id: player.userId || 'unknown',
                nickname: player.battletag ? player.battletag.split('#')[0] : '시뮬레이션 플레이어',
                role: '알 수 없음',
                hero: player.hero || '알 수 없음',
                kills: player.kills || 0,
                deaths: player.deaths || 0,
                assists: player.assists || 0,
                heroDamage: player.heroDamage || 0,
                siegeDamage: player.siegeDamage || 0,
                healing: player.healing || 0,
                experienceContribution: player.experienceContribution || 0,
                mmrBefore: 1500,
                mmrAfter: 1500,
                mmrChange: 0
              }));
            };

            return {
              id: game._id,
              title: game.title || '시뮬레이션 매치',
              map: game.map || '알 수 없는 맵',
              gameMode: '시뮬레이션',
              date: formattedDate,
              time: formattedTime,
              duration: formattedDuration,
              winner: game.result?.winner || 'none',
              blueTeam: {
                name: '블루팀 (시뮬레이션)',
                avgMmr: blueTeamAvgMmr,
                players: formatSimulationPlayers(blueTeamStats)
              },
              redTeam: {
                name: '레드팀 (시뮬레이션)',
                avgMmr: redTeamAvgMmr,
                players: formatSimulationPlayers(redTeamStats)
              }
            };
          }

          return {
            id: game._id,
            title: game.title || '알 수 없는 매치',
            map: game.map || '알 수 없는 맵',
            gameMode: game.gameMode || '일반 게임',
            date: formattedDate,
            time: formattedTime,
            duration: formattedDuration,
            winner: game.result?.winner || 'none',
            blueTeam: {
              name: blueTeamName,
              avgMmr: calcAvgMmr(blueTeam),
              players: formatPlayers(blueTeam, 'blue')
            },
            redTeam: {
              name: redTeamName,
              avgMmr: calcAvgMmr(redTeam),
              players: formatPlayers(redTeam, 'red')
            }
          };
        });
      
        res.json(formattedGames);
      } catch (mongoErr) {
        console.error('MongoDB 최근 게임 조회 오류:', mongoErr);
        res.json([]);
      }
    }
  } catch (err) {
    console.error('최근 게임 조회 오류:', err);
    // 오류 발생 시에도 빈 배열 반환하여 클라이언트 오류 방지
    res.json([]);
  }
});

module.exports = router; 