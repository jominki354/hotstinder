import { io } from 'socket.io-client';
import { toast } from 'react-toastify';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.listeners = new Map();
  }

  /**
   * WebSocket 연결 초기화
   */
  connect(token) {
    if (this.socket && this.isConnected) {
      console.log('[SocketService] 이미 연결되어 있음');
      return;
    }

    try {
      const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';

      this.socket = io(serverUrl, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000
      });

      this.setupEventHandlers();

      console.log('[SocketService] WebSocket 연결 시도:', serverUrl);
    } catch (err) {
      console.error('[SocketService] 연결 초기화 오류:', err);
    }
  }

  /**
   * 이벤트 핸들러 설정
   */
  setupEventHandlers() {
    if (!this.socket) return;

    // 연결 성공
    this.socket.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log('[SocketService] WebSocket 연결 성공:', this.socket.id);

      // 대기열 업데이트 구독
      this.socket.emit('subscribe:queue');
    });

    // 연결 해제
    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.log('[SocketService] WebSocket 연결 해제:', reason);

      if (reason === 'io server disconnect') {
        // 서버에서 연결을 끊은 경우 재연결 시도
        this.socket.connect();
      }
    });

    // 연결 오류
    this.socket.on('connect_error', (error) => {
      this.isConnected = false;
      this.reconnectAttempts++;

      console.error('[SocketService] 연결 오류:', error.message);

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('[SocketService] 최대 재연결 시도 횟수 초과');
        toast.error('실시간 알림 서비스 연결에 실패했습니다');
      }
    });

    // 초기 연결 확인
    this.socket.on('connected', (data) => {
      console.log('[SocketService] 서버 연결 확인:', data);
      toast.success('실시간 알림 서비스에 연결되었습니다', {
        autoClose: 2000
      });
    });

    // 매치 찾음 알림
    this.socket.on('match:found', (data) => {
      console.log('[SocketService] 매치 찾음 알림:', data);

      toast.success(`🎉 매치를 찾았습니다! 맵: ${data.mapName}`, {
        autoClose: 5000,
        onClick: () => {
          // 매치 상세 페이지로 이동
          window.location.href = '/match-details';
        }
      });

      // 매치 찾음 이벤트 리스너들에게 알림
      this.notifyListeners('match:found', data);
    });

    // 대기열 상태 변경
    this.socket.on('queue:status', (data) => {
      console.log('[SocketService] 대기열 상태 변경:', data);

      if (data.status === 'joined') {
        toast.info('매치메이킹 대기열에 참가했습니다');
      } else if (data.status === 'left') {
        toast.info('매치메이킹 대기열에서 나갔습니다');
      } else if (data.status === 'error') {
        toast.error(data.message || '대기열 오류가 발생했습니다');
      }

      this.notifyListeners('queue:status', data);
    });

    // 대기열 업데이트
    this.socket.on('queue:update', (data) => {
      console.log('[SocketService] 대기열 업데이트:', data);
      this.notifyListeners('queue:update', data);
    });

    // 매치 업데이트
    this.socket.on('match:update', (data) => {
      console.log('[SocketService] 매치 업데이트:', data);
      this.notifyListeners('match:update', data);
    });

    // 시스템 알림
    this.socket.on('system:notification', (data) => {
      console.log('[SocketService] 시스템 알림:', data);

      switch (data.type) {
        case 'info':
          toast.info(data.message);
          break;
        case 'warning':
          toast.warning(data.message);
          break;
        case 'error':
          toast.error(data.message);
          break;
        case 'success':
          toast.success(data.message);
          break;
        default:
          toast(data.message);
      }

      this.notifyListeners('system:notification', data);
    });

    // 핑-퐁 (연결 상태 확인)
    this.socket.on('pong', () => {
      console.log('[SocketService] Pong 수신');
    });
  }

  /**
   * 이벤트 리스너 등록
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    // 정리 함수 반환
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(callback);
        if (eventListeners.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  /**
   * 이벤트 리스너들에게 알림
   */
  notifyListeners(event, data) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (err) {
          console.error(`[SocketService] 리스너 오류 (${event}):`, err);
        }
      });
    }
  }

  /**
   * 매치 상태 구독
   */
  subscribeToMatch(matchId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('subscribe:match', matchId);
      console.log('[SocketService] 매치 구독:', matchId);
    }
  }

  /**
   * 매치 상태 구독 해제
   */
  unsubscribeFromMatch(matchId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('unsubscribe:match', matchId);
      console.log('[SocketService] 매치 구독 해제:', matchId);
    }
  }

  /**
   * 대기열 상태 구독
   */
  subscribeToQueue() {
    if (this.socket && this.isConnected) {
      this.socket.emit('subscribe:queue');
      console.log('[SocketService] 대기열 구독');
    }
  }

  /**
   * 대기열 상태 구독 해제
   */
  unsubscribeFromQueue() {
    if (this.socket && this.isConnected) {
      this.socket.emit('unsubscribe:queue');
      console.log('[SocketService] 대기열 구독 해제');
    }
  }

  /**
   * 핑 전송 (연결 상태 확인)
   */
  ping() {
    if (this.socket && this.isConnected) {
      this.socket.emit('ping');
    }
  }

  /**
   * 연결 상태 확인
   */
  isSocketConnected() {
    return this.socket && this.isConnected;
  }

  /**
   * 연결 해제
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
      console.log('[SocketService] WebSocket 연결 해제');
    }
  }

  /**
   * 재연결 시도
   */
  reconnect(token) {
    this.disconnect();
    setTimeout(() => {
      this.connect(token);
    }, 1000);
  }
}

// 싱글톤 인스턴스
const socketService = new SocketService();

export default socketService;
