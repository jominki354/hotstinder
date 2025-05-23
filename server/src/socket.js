const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./models/user.model');

// 소켓 인증 미들웨어
const authenticateSocket = async (socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('인증 토큰이 없습니다'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return next(new Error('사용자를 찾을 수 없습니다'));
    }
    
    socket.user = user;
    next();
  } catch (error) {
    return next(new Error('인증에 실패했습니다'));
  }
};

// 소켓 서버 설정
const setupSocketIO = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true
    }
  });

  // 인증 미들웨어 적용
  io.use(authenticateSocket);

  // 소켓 연결 이벤트
  io.on('connection', (socket) => {
    console.log(`사용자 연결됨: ${socket.user.battleTag} (${socket.id})`);

    // 사용자 정보로 룸 가입
    socket.join(`user:${socket.user._id}`);

    // 매치 생성 이벤트
    socket.on('match:create', (matchData) => {
      // 매치 생성 로직
      console.log('새 매치 생성:', matchData);
      io.emit('match:new', { ...matchData, createdBy: socket.user._id });
    });

    // 매치 참가 이벤트
    socket.on('match:join', (matchId) => {
      // 매치 참가 로직
      socket.join(`match:${matchId}`);
      io.to(`match:${matchId}`).emit('match:playerJoined', { 
        matchId, 
        player: {
          id: socket.user._id,
          battleTag: socket.user.battleTag
        }
      });
    });

    // 매치 채팅 이벤트
    socket.on('match:message', ({ matchId, message }) => {
      io.to(`match:${matchId}`).emit('match:newMessage', {
        sender: {
          id: socket.user._id,
          battleTag: socket.user.battleTag
        },
        message,
        timestamp: new Date()
      });
    });

    // 연결 해제 이벤트
    socket.on('disconnect', () => {
      console.log(`사용자 연결 해제: ${socket.user.battleTag} (${socket.id})`);
    });
  });

  return io;
};

module.exports = { setupSocketIO }; 