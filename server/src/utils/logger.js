const fs = require('fs');
const path = require('path');
const util = require('util');

// 로그 레벨 정의
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4
};

// 색상 코드 정의 (콘솔 출력용)
const COLORS = {
  RESET: '\x1b[0m',
  BRIGHT: '\x1b[1m',
  DIM: '\x1b[2m',
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  MAGENTA: '\x1b[35m',
  CYAN: '\x1b[36m',
  WHITE: '\x1b[37m',
  GRAY: '\x1b[90m'
};

// 로그 파일 경로 설정
const LOG_DIR = path.join(__dirname, '../../logs');
const LOG_FILES = {
  ERROR: path.join(LOG_DIR, 'error.log'),
  COMBINED: path.join(LOG_DIR, 'combined.log'),
  ACCESS: path.join(LOG_DIR, 'access.log')
};

// 로그 디렉토리 생성
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

class Logger {
  constructor() {
    this.currentLevel = this.getLogLevel();
    this.enableConsole = true;
    this.enableFile = true;
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
  }

  /**
   * 환경 변수에서 로그 레벨 가져오기
   */
  getLogLevel() {
    const envLevel = (process.env.LOG_LEVEL || 'INFO').toUpperCase();
    return LOG_LEVELS[envLevel] !== undefined ? LOG_LEVELS[envLevel] : LOG_LEVELS.INFO;
  }

  /**
   * 현재 시간을 한국 시간으로 포맷팅
   */
  getTimestamp() {
    const now = new Date();
    const kstOffset = 9 * 60; // KST는 UTC+9
    const kstTime = new Date(now.getTime() + (kstOffset * 60 * 1000));

    return kstTime.toISOString().replace('T', ' ').replace('Z', '').slice(0, 23);
  }

  /**
   * 데이터를 안전하게 문자열로 변환
   */
  stringify(data) {
    if (data === null) return 'null';
    if (data === undefined) return 'undefined';
    if (typeof data === 'string') return data;
    if (typeof data === 'number' || typeof data === 'boolean') return String(data);

    try {
      if (data instanceof Error) {
        return `${data.name}: ${data.message}\n${data.stack}`;
      }

      // 객체인 경우 JSON으로 변환하되, 순환 참조 처리
      return JSON.stringify(data, (key, value) => {
        if (typeof value === 'function') return '[Function]';
        if (value instanceof Date) return value.toISOString();
        if (value instanceof RegExp) return value.toString();
        return value;
      }, 2);
    } catch (err) {
      return util.inspect(data, { depth: 3, colors: false });
    }
  }

  /**
   * 로그 메시지 포맷팅
   */
  formatMessage(level, message, data, context) {
    const timestamp = this.getTimestamp();
    const contextStr = context ? `[${context}]` : '';
    const dataStr = data !== undefined ? `\n${this.stringify(data)}` : '';

    return `[${timestamp}] [${level}] ${contextStr} ${message}${dataStr}`;
  }

  /**
   * 콘솔에 컬러 로그 출력
   */
  logToConsole(level, message, data, context) {
    if (!this.enableConsole) return;

    const timestamp = this.getTimestamp();
    const contextStr = context ? `${COLORS.GRAY}[${context}]${COLORS.RESET}` : '';

    let levelColor = COLORS.WHITE;
    let messageColor = COLORS.RESET;

    switch (level) {
      case 'ERROR':
        levelColor = COLORS.RED + COLORS.BRIGHT;
        messageColor = COLORS.RED;
        break;
      case 'WARN':
        levelColor = COLORS.YELLOW + COLORS.BRIGHT;
        messageColor = COLORS.YELLOW;
        break;
      case 'INFO':
        levelColor = COLORS.GREEN + COLORS.BRIGHT;
        messageColor = COLORS.RESET;
        break;
      case 'DEBUG':
        levelColor = COLORS.BLUE + COLORS.BRIGHT;
        messageColor = COLORS.BLUE;
        break;
      case 'TRACE':
        levelColor = COLORS.MAGENTA + COLORS.BRIGHT;
        messageColor = COLORS.MAGENTA;
        break;
    }

    const formattedTimestamp = `${COLORS.GRAY}[${timestamp}]${COLORS.RESET}`;
    const formattedLevel = `${levelColor}[${level}]${COLORS.RESET}`;
    const formattedMessage = `${messageColor}${message}${COLORS.RESET}`;

    console.log(`${formattedTimestamp} ${formattedLevel} ${contextStr} ${formattedMessage}`);

    if (data !== undefined) {
      const dataStr = this.stringify(data);
      if (level === 'ERROR') {
        console.error(`${COLORS.RED}${dataStr}${COLORS.RESET}`);
      } else {
        console.log(`${COLORS.GRAY}${dataStr}${COLORS.RESET}`);
      }
    }
  }

  /**
   * 파일에 로그 기록
   */
  logToFile(level, message, data, context) {
    if (!this.enableFile) return;

    const logMessage = this.formatMessage(level, message, data, context) + '\n';

    try {
      // 모든 로그를 combined.log에 기록
      this.appendToFile(LOG_FILES.COMBINED, logMessage);

      // 에러 로그는 별도 파일에도 기록
      if (level === 'ERROR') {
        this.appendToFile(LOG_FILES.ERROR, logMessage);
      }
    } catch (err) {
      console.error(`${COLORS.RED}로그 파일 쓰기 실패:${COLORS.RESET}`, err.message);
    }
  }

  /**
   * 파일에 로그 추가 (로테이션 포함)
   */
  appendToFile(filePath, content) {
    try {
      // 파일 크기 확인 및 로테이션
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        if (stats.size > this.maxFileSize) {
          const backupPath = filePath + '.old';
          if (fs.existsSync(backupPath)) {
            fs.unlinkSync(backupPath);
          }
          fs.renameSync(filePath, backupPath);
        }
      }

      fs.appendFileSync(filePath, content);
    } catch (err) {
      console.error(`파일 쓰기 오류 (${filePath}):`, err.message);
    }
  }

  /**
   * 로그 레벨 확인
   */
  shouldLog(level) {
    return LOG_LEVELS[level] <= this.currentLevel;
  }

  /**
   * 기본 로그 메서드
   */
  log(level, message, data, context) {
    if (!this.shouldLog(level)) return;

    this.logToConsole(level, message, data, context);
    this.logToFile(level, message, data, context);
  }

  /**
   * ERROR 레벨 로그
   */
  error(message, data, context) {
    this.log('ERROR', message, data, context);
  }

  /**
   * WARN 레벨 로그
   */
  warn(message, data, context) {
    this.log('WARN', message, data, context);
  }

  /**
   * INFO 레벨 로그
   */
  info(message, data, context) {
    this.log('INFO', message, data, context);
  }

  /**
   * DEBUG 레벨 로그
   */
  debug(message, data, context) {
    this.log('DEBUG', message, data, context);
  }

  /**
   * TRACE 레벨 로그
   */
  trace(message, data, context) {
    this.log('TRACE', message, data, context);
  }

  /**
   * HTTP 요청 로깅
   */
  logRequest(req, res, responseTime) {
    const method = req.method;
    const url = req.originalUrl || req.url;
    const statusCode = res.statusCode;
    const contentLength = res.get('content-length') || 0;
    const userAgent = req.get('user-agent') || 'Unknown';
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';
    const responseTimeMs = responseTime ? `${responseTime}ms` : 'N/A';

    const logData = {
      method,
      url,
      statusCode,
      contentLength,
      responseTime: responseTimeMs,
      ip,
      userAgent: userAgent.substring(0, 100) // 길이 제한
    };

    // 상태 코드에 따라 로그 레벨 결정
    let level = 'INFO';
    if (statusCode >= 500) {
      level = 'ERROR';
    } else if (statusCode >= 400) {
      level = 'WARN';
    }

    const message = `${method} ${url} ${statusCode} ${responseTimeMs}`;
    this.log(level, message, logData, 'HTTP');

    // 액세스 로그 파일에도 기록
    const accessLogMessage = `${this.getTimestamp()} ${ip} "${method} ${url}" ${statusCode} ${contentLength} "${userAgent}" ${responseTimeMs}\n`;
    this.appendToFile(LOG_FILES.ACCESS, accessLogMessage);
  }

  /**
   * 데이터베이스 쿼리 로깅
   */
  logQuery(query, duration, context = 'DB') {
    const message = `Query executed in ${duration}ms`;
    this.debug(message, { query: query.substring(0, 200) + (query.length > 200 ? '...' : '') }, context);
  }

  /**
   * API 응답 로깅
   */
  logApiResponse(endpoint, statusCode, data, context = 'API') {
    const message = `${endpoint} responded with ${statusCode}`;
    const logData = {
      statusCode,
      dataSize: typeof data === 'string' ? data.length : JSON.stringify(data || {}).length
    };

    if (statusCode >= 400) {
      this.warn(message, { ...logData, response: data }, context);
    } else {
      this.debug(message, logData, context);
    }
  }

  /**
   * 인증 관련 로깅
   */
  logAuth(action, userId, details, context = 'AUTH') {
    const message = `Authentication ${action}`;
    const logData = {
      userId,
      action,
      ...details
    };

    if (action.includes('failed') || action.includes('error')) {
      this.warn(message, logData, context);
    } else {
      this.info(message, logData, context);
    }
  }

  /**
   * 성능 측정 시작
   */
  startTimer(label) {
    const startTime = process.hrtime.bigint();
    return {
      end: () => {
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000; // 나노초를 밀리초로 변환
        this.debug(`Timer [${label}] completed`, { duration: `${duration.toFixed(2)}ms` }, 'PERF');
        return duration;
      }
    };
  }

  /**
   * 로그 설정 변경
   */
  setLevel(level) {
    if (LOG_LEVELS[level.toUpperCase()] !== undefined) {
      this.currentLevel = LOG_LEVELS[level.toUpperCase()];
      this.info(`Log level changed to ${level.toUpperCase()}`);
    }
  }

  /**
   * 콘솔 출력 활성화/비활성화
   */
  setConsoleOutput(enabled) {
    this.enableConsole = enabled;
  }

  /**
   * 파일 출력 활성화/비활성화
   */
  setFileOutput(enabled) {
    this.enableFile = enabled;
  }
}

// 싱글톤 인스턴스 생성
const logger = new Logger();

// 프로세스 종료 시 로그 기록
process.on('exit', () => {
  logger.info('Application shutting down');
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
});

module.exports = logger;
