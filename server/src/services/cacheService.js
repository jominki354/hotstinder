const Redis = require('ioredis');
const logger = require('../utils/logger');

class CacheService {
  constructor() {
    this.redis = null;
    this.isConnected = false;
    this.fallbackCache = new Map(); // Redis 연결 실패 시 메모리 캐시
    this.init();
  }

  async init() {
    try {
      // Redis 연결 설정
      const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        db: process.env.REDIS_DB || 0,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        connectTimeout: 5000,
        commandTimeout: 3000
      };

      this.redis = new Redis(redisConfig);

      // 연결 이벤트 처리
      this.redis.on('connect', () => {
        logger.info('Redis 연결 성공');
        this.isConnected = true;
      });

      this.redis.on('error', (err) => {
        logger.warn('Redis 연결 오류, 메모리 캐시로 폴백:', err.message);
        this.isConnected = false;
      });

      this.redis.on('close', () => {
        logger.warn('Redis 연결 종료, 메모리 캐시로 폴백');
        this.isConnected = false;
      });

      // 연결 시도
      await this.redis.connect();

    } catch (err) {
      logger.warn('Redis 초기화 실패, 메모리 캐시 사용:', err.message);
      this.isConnected = false;
    }
  }

  /**
   * 캐시에서 값 가져오기
   */
  async get(key) {
    try {
      if (this.isConnected && this.redis) {
        const value = await this.redis.get(key);
        return value ? JSON.parse(value) : null;
      } else {
        // 폴백: 메모리 캐시 사용
        const cached = this.fallbackCache.get(key);
        if (cached && cached.expiry > Date.now()) {
          return cached.value;
        } else if (cached) {
          this.fallbackCache.delete(key);
        }
        return null;
      }
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
      if (this.isConnected && this.redis) {
        await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
      } else {
        // 폴백: 메모리 캐시 사용
        this.fallbackCache.set(key, {
          value,
          expiry: Date.now() + (ttlSeconds * 1000)
        });

        // 메모리 캐시 크기 제한 (최대 1000개)
        if (this.fallbackCache.size > 1000) {
          const firstKey = this.fallbackCache.keys().next().value;
          this.fallbackCache.delete(firstKey);
        }
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
      if (this.isConnected && this.redis) {
        await this.redis.del(key);
      } else {
        this.fallbackCache.delete(key);
      }
    } catch (err) {
      logger.error('캐시 삭제 오류:', err);
    }
  }

  /**
   * 패턴으로 키 삭제
   */
  async delPattern(pattern) {
    try {
      if (this.isConnected && this.redis) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } else {
        // 폴백: 메모리 캐시에서 패턴 매칭 삭제
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        for (const key of this.fallbackCache.keys()) {
          if (regex.test(key)) {
            this.fallbackCache.delete(key);
          }
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
    return this.isConnected || this.fallbackCache.size >= 0;
  }

  /**
   * 캐시 통계
   */
  getStats() {
    return {
      redisConnected: this.isConnected,
      fallbackCacheSize: this.fallbackCache.size,
      type: this.isConnected ? 'redis' : 'memory'
    };
  }

  /**
   * 연결 종료
   */
  async close() {
    try {
      if (this.redis) {
        await this.redis.quit();
      }
      this.fallbackCache.clear();
      logger.info('캐시 서비스 종료');
    } catch (err) {
      logger.error('캐시 서비스 종료 오류:', err);
    }
  }
}

// 싱글톤 인스턴스
const cacheService = new CacheService();

module.exports = cacheService;
