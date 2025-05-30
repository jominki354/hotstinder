const logger = require('../utils/logger');

class CacheService {
  constructor() {
    this.cache = new Map(); // 메모리 캐시
    this.init();
  }

  async init() {
    logger.info('메모리 캐시 서비스 초기화 완료');
  }

  /**
   * 캐시에서 값 가져오기
   */
  async get(key) {
    try {
      const cached = this.cache.get(key);
      if (cached && cached.expiry > Date.now()) {
        return cached.value;
      } else if (cached) {
        this.cache.delete(key);
      }
      return null;
    } catch (err) {
      logger.error('캐시 조회 오류:', err);
      return null;
    }
  }

  /**
   * 캐시에 값 저장
   */
  async set(key, value, ttlSeconds = 300) {
    try {
      this.cache.set(key, {
        value,
        expiry: Date.now() + (ttlSeconds * 1000)
      });

      // 메모리 캐시 크기 제한 (최대 1000개)
      if (this.cache.size > 1000) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }
    } catch (err) {
      logger.error('캐시 저장 오류:', err);
    }
  }

  /**
   * 캐시에서 값 삭제
   */
  async del(key) {
    try {
      this.cache.delete(key);
    } catch (err) {
      logger.error('캐시 삭제 오류:', err);
    }
  }

  /**
   * 패턴으로 키 삭제
   */
  async delPattern(pattern) {
    try {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key);
        }
      }
    } catch (err) {
      logger.error('캐시 패턴 삭제 오류:', err);
    }
  }

  /**
   * 대기열 상태 캐시 키 생성
   */
  getQueueCacheKey(userId) {
    return `queue:status:${userId}`;
  }

  /**
   * 매치메이킹 통계 캐시 키 생성
   */
  getMatchmakingStatsKey(gameMode = 'Storm League') {
    return `matchmaking:stats:${gameMode}`;
  }

  /**
   * 사용자 MMR 캐시 키 생성
   */
  getUserMmrKey(userId) {
    return `user:mmr:${userId}`;
  }

  /**
   * 연결 상태 확인
   */
  isHealthy() {
    return true;
  }

  /**
   * 캐시 통계
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      type: 'memory'
    };
  }

  /**
   * 연결 종료
   */
  async close() {
    try {
      this.cache.clear();
      logger.info('캐시 서비스 종료');
    } catch (err) {
      logger.error('캐시 서비스 종료 오류:', err);
    }
  }
}

// 싱글톤 인스턴스
const cacheService = new CacheService();

module.exports = cacheService;
