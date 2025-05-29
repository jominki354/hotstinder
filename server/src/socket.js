const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('./utils/logger');

// 소켓 인증 미들웨어
const authenticateSocket = async (socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('인증 토큰이 없습니다'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // PostgreSQL에서 사용자 조회
    if (!global.db || !global.db.User) {
      return next(new Error('데이터베이스가 초기화되지 않았습니다'));
    }

    const user = await global.db.User.findByPk(decoded.id);

    if (!user) {
      return next(new Error('사용자를 찾을 수 없습니다'));
    }

    socket.user = user;
    next();
  } catch (error) {
    logger.error('소켓 인증 오류:', error);
    return next(new Error('인증에 실패했습니다'));
  }
};

// 소켓 서버 설정
const setupSocketIO = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: function (origin, callback) {
        // 허용할 도메인 목록
        const allowedOrigins = [
          process.env.FRONTEND_URL || 'http://localhost:3000',
          'http://localhost:3000'
        ];

        // origin이 없는 경우 허용
        if (!origin) return callback(null, true);

        // 허용된 도메인인지 확인
        const isAllowed = allowedOrigins.some(allowedOrigin => {
          if (typeof allowedOrigin === 'string') {
            return origin === allowedOrigin;
          } else if (allowedOrigin instanceof RegExp) {
            return allowedOrigin.test(origin);
          }
          return false;
        });

        if (isAllowed) {
          callback(null, true);
        } else {
          logger.warn('Socket CORS 차단된 도메인:', origin);
          callback(new Error('Socket CORS 정책에 의해 차단되었습니다.'));
        }
      },
      credentials: true
    }
  });

  // 인증 미들웨어 적용
  io.use(authenticateSocket);

  // 소켓 연결 이벤트
  io.on('connection', (socket) => {
    logger.info(`사용자 소켓 연결: ${socket.user.battleTag} (${socket.id})`);

    // 사용자 정보로 룸 가입
    socket.join(`user:${socket.user.id}`);

    // 매치 생성 이벤트
    socket.on('match:create', async (matchData) => {
      try {
        logger.info('소켓을 통한 매치 생성 요청:', { userId: socket.user.id, matchData });

        // 매치 생성 로직은 REST API를 통해 처리하도록 안내
        socket.emit('match:createResponse', {
          success: false,
          message: '매치 생성은 REST API를 통해 처리해주세요 (POST /api/matches)'
        });
      } catch (error) {
        logger.error('소켓 매치 생성 오류:', error);
        socket.emit('match:createResponse', {
          success: false,
          message: '매치 생성 중 오류가 발생했습니다'
        });
      }
    });

    // 매치 참가 이벤트
    socket.on('match:join', async (matchId) => {
      try {
        logger.info('소켓을 통한 매치 참가:', { userId: socket.user.id, matchId });

        // 매치 룸 가입
        socket.join(`match:${matchId}`);

        // 매치 참가자들에게 알림
        io.to(`match:${matchId}`).emit('match:playerJoined', {
          matchId,
          player: {
            id: socket.user.id,
            battleTag: socket.user.battleTag,
            nickname: socket.user.nickname
          },
          timestamp: new Date()
        });

        logger.info('매치 룸 참가 완료:', { userId: socket.user.id, matchId });
      } catch (error) {
        logger.error('소켓 매치 참가 오류:', error);
        socket.emit('error', { message: '매치 참가 중 오류가 발생했습니다' });
      }
    });

    // 매치 나가기 이벤트
    socket.on('match:leave', async (matchId) => {
      try {
        logger.info('소켓을 통한 매치 나가기:', { userId: socket.user.id, matchId });

        // 매치 룸 나가기
        socket.leave(`match:${matchId}`);

        // 매치 참가자들에게 알림
        io.to(`match:${matchId}`).emit('match:playerLeft', {
          matchId,
          player: {
            id: socket.user.id,
            battleTag: socket.user.battleTag,
            nickname: socket.user.nickname
          },
          timestamp: new Date()
        });

        logger.info('매치 룸 나가기 완료:', { userId: socket.user.id, matchId });
      } catch (error) {
        logger.error('소켓 매치 나가기 오류:', error);
        socket.emit('error', { message: '매치 나가기 중 오류가 발생했습니다' });
      }
    });

    // 매치 채팅 이벤트
    socket.on('match:message', async ({ matchId, message }) => {
      try {
        if (!message || message.trim().length === 0) {
          return socket.emit('error', { message: '메시지 내용이 필요합니다' });
        }

        const chatMessage = {
          sender: {
            id: socket.user.id,
            battleTag: socket.user.battleTag,
            nickname: socket.user.nickname
          },
          message: message.trim(),
          timestamp: new Date()
        };

        // 매치 룸의 모든 사용자에게 메시지 전송
        io.to(`match:${matchId}`).emit('match:newMessage', chatMessage);

        logger.info('매치 채팅 메시지 전송:', {
          matchId,
          senderId: socket.user.id,
          messageLength: message.length
        });
      } catch (error) {
        logger.error('소켓 채팅 메시지 오류:', error);
        socket.emit('error', { message: '메시지 전송 중 오류가 발생했습니다' });
      }
    });

    // 매치메이킹 상태 업데이트 이벤트
    socket.on('matchmaking:statusUpdate', async () => {
      try {
        // 매치메이킹 상태 조회
        const queueEntry = await global.db.MatchmakingQueue.findOne({
          where: { userId: socket.user.id }
        });

        if (queueEntry) {
          const totalInQueue = await global.db.MatchmakingQueue.count({
            where: {
              gameMode: queueEntry.gameMode,
              status: 'waiting'
            }
          });

          socket.emit('matchmaking:statusUpdate', {
            inQueue: true,
            currentPlayers: totalInQueue,
            requiredPlayers: 10,
            queueTime: queueEntry.queueTime
          });
        } else {
          socket.emit('matchmaking:statusUpdate', {
            inQueue: false,
            currentPlayers: 0,
            requiredPlayers: 10
          });
        }
      } catch (error) {
        logger.error('매치메이킹 상태 업데이트 오류:', error);
        socket.emit('error', { message: '매치메이킹 상태 조회 중 오류가 발생했습니다' });
      }
    });

    // 연결 해제 이벤트
    socket.on('disconnect', () => {
      logger.info(`사용자 소켓 연결 해제: ${socket.user.battleTag} (${socket.id})`);
    });

    // 오류 처리
    socket.on('error', (error) => {
      logger.error('소켓 오류:', { userId: socket.user.id, error });
    });
  });

  return io;
};

module.exports = { setupSocketIO };
