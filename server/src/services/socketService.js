const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

class SocketService {
  constructor() {
    this.io = null;
    this.userSockets = new Map(); // userId -> socketId 매핑
    this.socketUsers = new Map(); // socketId -> userId 매핑
  }

  /**
   * Socket.IO 서버 초기화
   */
  init(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    // 인증 미들웨어
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

        if (!token) {
          return next(new Error('인증 토큰이 필요합니다'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 사용자 정보 조회
        if (!global.db || !global.db.User) {
          return next(new Error('데이터베이스가 초기화되지 않았습니다'));
        }

        const user = await global.db.User.findByPk(decoded.id);
        if (!user) {
          return next(new Error('사용자를 찾을 수 없습니다'));
        }

        socket.userId = user.id;
        socket.user = user;
        next();
      } catch (err) {
        logger.error('Socket 인증 오류:', err);
        next(new Error('인증에 실패했습니다'));
      }
    });

    // 연결 이벤트 처리
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    logger.info('WebSocket 서비스 초기화 완료');
  }

  /**
   * 클라이언트 연결 처리
   */
  handleConnection(socket) {
    const userId = socket.userId;

    logger.info('WebSocket 클라이언트 연결:', {
      socketId: socket.id,
      userId: userId,
      battleTag: socket.user?.battleTag
    });

    // 사용자-소켓 매핑 저장
    this.userSockets.set(userId, socket.id);
    this.socketUsers.set(socket.id, userId);

    // 사용자별 룸 참가
    socket.join(`user:${userId}`);

    // 연결 해제 처리
    socket.on('disconnect', () => {
      this.handleDisconnection(socket);
    });

    // 대기열 상태 구독
    socket.on('subscribe:queue', () => {
      socket.join('queue:updates');
      logger.debug('대기열 업데이트 구독:', { userId, socketId: socket.id });
    });

    // 대기열 상태 구독 해제
    socket.on('unsubscribe:queue', () => {
      socket.leave('queue:updates');
      logger.debug('대기열 업데이트 구독 해제:', { userId, socketId: socket.id });
    });

    // 매치 상태 구독
    socket.on('subscribe:match', (matchId) => {
      if (matchId) {
        socket.join(`match:${matchId}`);
        logger.debug('매치 업데이트 구독:', { userId, matchId, socketId: socket.id });
      }
    });

    // 매치 상태 구독 해제
    socket.on('unsubscribe:match', (matchId) => {
      if (matchId) {
        socket.leave(`match:${matchId}`);
        logger.debug('매치 업데이트 구독 해제:', { userId, matchId, socketId: socket.id });
      }
    });

    // 핑-퐁 처리 (연결 상태 확인)
    socket.on('ping', () => {
      socket.emit('pong');
    });

    // 초기 연결 확인 메시지
    socket.emit('connected', {
      message: '실시간 알림 서비스에 연결되었습니다',
      userId: userId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 클라이언트 연결 해제 처리
   */
  handleDisconnection(socket) {
    const userId = socket.userId;

    logger.info('WebSocket 클라이언트 연결 해제:', {
      socketId: socket.id,
      userId: userId
    });

    // 매핑 제거
    this.userSockets.delete(userId);
    this.socketUsers.delete(socket.id);
  }

  /**
   * 특정 사용자에게 메시지 전송
   */
  emitToUser(userId, event, data) {
    try {
      const socketId = this.userSockets.get(userId);
      if (socketId && this.io) {
        this.io.to(`user:${userId}`).emit(event, data);
        logger.debug('사용자에게 메시지 전송:', { userId, event, socketId });
        return true;
      }
      return false;
    } catch (err) {
      logger.error('사용자 메시지 전송 오류:', err);
      return false;
    }
  }

  /**
   * 대기열 업데이트 브로드캐스트
   */
  broadcastQueueUpdate(data) {
    try {
      if (this.io) {
        this.io.to('queue:updates').emit('queue:update', {
          ...data,
          timestamp: new Date().toISOString()
        });
        logger.debug('대기열 업데이트 브로드캐스트:', data);
      }
    } catch (err) {
      logger.error('대기열 업데이트 브로드캐스트 오류:', err);
    }
  }

  /**
   * 매치 찾음 알림
   */
  notifyMatchFound(userIds, matchData) {
    try {
      userIds.forEach(userId => {
        this.emitToUser(userId, 'match:found', {
          ...matchData,
          message: '매치를 찾았습니다!',
          timestamp: new Date().toISOString()
        });
      });

      logger.info('매치 찾음 알림 전송:', {
        userCount: userIds.length,
        matchId: matchData.matchId
      });
    } catch (err) {
      logger.error('매치 찾음 알림 오류:', err);
    }
  }

  /**
   * 매치 상태 업데이트
   */
  broadcastMatchUpdate(matchId, data) {
    try {
      if (this.io) {
        this.io.to(`match:${matchId}`).emit('match:update', {
          ...data,
          matchId,
          timestamp: new Date().toISOString()
        });
        logger.debug('매치 업데이트 브로드캐스트:', { matchId, data });
      }
    } catch (err) {
      logger.error('매치 업데이트 브로드캐스트 오류:', err);
    }
  }

  /**
   * 대기열 상태 변경 알림
   */
  notifyQueueStatusChange(userId, status, data = {}) {
    try {
      this.emitToUser(userId, 'queue:status', {
        status, // 'joined', 'left', 'match_found', 'error'
        ...data,
        timestamp: new Date().toISOString()
      });

      logger.debug('대기열 상태 변경 알림:', { userId, status });
    } catch (err) {
      logger.error('대기열 상태 변경 알림 오류:', err);
    }
  }

  /**
   * 시스템 알림 브로드캐스트
   */
  broadcastSystemNotification(message, type = 'info') {
    try {
      if (this.io) {
        this.io.emit('system:notification', {
          message,
          type, // 'info', 'warning', 'error', 'success'
          timestamp: new Date().toISOString()
        });
        logger.info('시스템 알림 브로드캐스트:', { message, type });
      }
    } catch (err) {
      logger.error('시스템 알림 브로드캐스트 오류:', err);
    }
  }

  /**
   * 연결된 사용자 수 조회
   */
  getConnectedUserCount() {
    return this.userSockets.size;
  }

  /**
   * 특정 사용자 연결 상태 확인
   */
  isUserConnected(userId) {
    return this.userSockets.has(userId);
  }

  /**
   * 서비스 상태 조회
   */
  getStatus() {
    return {
      isInitialized: !!this.io,
      connectedUsers: this.userSockets.size,
      totalSockets: this.socketUsers.size
    };
  }

  /**
   * 서비스 종료
   */
  close() {
    try {
      if (this.io) {
        this.io.close();
        this.userSockets.clear();
        this.socketUsers.clear();
        logger.info('WebSocket 서비스 종료');
      }
    } catch (err) {
      logger.error('WebSocket 서비스 종료 오류:', err);
    }
  }
}

// 싱글톤 인스턴스
const socketService = new SocketService();

module.exports = socketService;
