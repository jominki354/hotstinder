const fs = require('fs');
const path = require('path');

// 로그 파일 경로 설정
const LOG_DIR = path.join(__dirname, '../../logs');
const DEBUG_LOG = path.join(LOG_DIR, 'debug.log');
const ERROR_LOG = path.join(LOG_DIR, 'error.log');
const ACCESS_LOG = path.join(LOG_DIR, 'access.log');

// 로그 디렉토리 생성
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * 현재 시간을 ISO 문자열로 반환
 * @returns {string} 현재 시간을 ISO 형식으로 표현한 문자열
 */
const getTimestamp = () => new Date().toISOString();

/**
 * 로그 메시지 포맷팅
 * @param {string} level - 로그 레벨 (INFO, WARN, ERROR 등)
 * @param {string} message - 로그 메시지
 * @param {*} data - 추가 데이터 (객체, 문자열 등)
 * @returns {string} 포맷팅된 로그 메시지
 */
const formatLogMessage = (level, message, data) => {
  const timestamp = getTimestamp();
  const dataStr = data !== undefined ? JSON.stringify(data, null, 2) : '';
  return `[${timestamp}] [${level}] ${message} ${dataStr}\n`;
};

/**
 * 로그 파일에 메시지 추가
 * @param {string} filePath - 로그 파일 경로
 * @param {string} message - 기록할 메시지
 */
const appendToLogFile = (filePath, message) => {
  try {
    fs.appendFileSync(filePath, message);
  } catch (err) {
    console.error(`로그 파일 쓰기 오류 (${filePath}):`, err);
  }
};

/**
 * 콘솔에 메시지 출력
 * @param {string} level - 로그 레벨
 * @param {string} message - 로그 메시지
 * @param {*} data - 추가 데이터
 */
const logToConsole = (level, message, data) => {
  const timestamp = getTimestamp();
  
  switch (level) {
    case 'ERROR':
      console.error(`[${timestamp}] [${level}] ${message}`, data || '');
      break;
    case 'WARN':
      console.warn(`[${timestamp}] [${level}] ${message}`, data || '');
      break;
    case 'DEBUG':
      console.debug(`[${timestamp}] [${level}] ${message}`, data || '');
      break;
    default:
      console.log(`[${timestamp}] [${level}] ${message}`, data || '');
  }
};

// 로거 객체 정의
const logger = {
  /**
   * 일반 정보 로깅
   * @param {string} message - 로그 메시지
   * @param {*} data - 추가 데이터
   */
  info(message, data) {
    const logMessage = formatLogMessage('INFO', message, data);
    appendToLogFile(DEBUG_LOG, logMessage);
    logToConsole('INFO', message, data);
  },
  
  /**
   * 경고 로깅
   * @param {string} message - 로그 메시지
   * @param {*} data - 추가 데이터
   */
  warn(message, data) {
    const logMessage = formatLogMessage('WARN', message, data);
    appendToLogFile(DEBUG_LOG, logMessage);
    logToConsole('WARN', message, data);
  },
  
  /**
   * 오류 로깅
   * @param {string} message - 로그 메시지
   * @param {*} error - 오류 객체 또는 메시지
   */
  error(message, error) {
    const errorDetails = error instanceof Error 
      ? { message: error.message, stack: error.stack } 
      : error;
    
    const logMessage = formatLogMessage('ERROR', message, errorDetails);
    appendToLogFile(ERROR_LOG, logMessage);
    appendToLogFile(DEBUG_LOG, logMessage);
    logToConsole('ERROR', message, errorDetails);
  },
  
  /**
   * 디버그 로깅
   * @param {string} message - 로그 메시지
   * @param {*} data - 추가 데이터
   */
  debug(message, data) {
    if (process.env.NODE_ENV !== 'production') {
      const logMessage = formatLogMessage('DEBUG', message, data);
      appendToLogFile(DEBUG_LOG, logMessage);
      logToConsole('DEBUG', message, data);
    }
  },
  
  /**
   * HTTP 요청 로깅
   * @param {Express.Request} req - Express 요청 객체
   */
  logRequest(req) {
    const accessLog = formatLogMessage('REQUEST', `${req.method} ${req.url}`, {
      sessionID: req.sessionID,
      authStatus: req.isAuthenticated ? req.isAuthenticated() : false,
      ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
    });
    
    appendToLogFile(ACCESS_LOG, accessLog);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log(`\n--- 새 요청 ---`);
      console.log(`요청 URL: ${req.method} ${req.url}`);
      console.log(`세션 ID: ${req.sessionID}`);
      console.log(`인증 상태: ${req.isAuthenticated ? req.isAuthenticated() : '미확인'}`);
    }
  }
};

module.exports = logger; 