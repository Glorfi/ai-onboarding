import { injectable, inject } from 'tsyringe';
import type {
  IRateLimitService,
  IRateLimitResult,
} from '@/domain/services/ratelimit';
import type { ISiteRepository } from '@/domain/repositories';
import { getRedisClient } from './RedisClient';

const SESSION_KEY_PREFIX = 'ratelimit:session:';
const IP_KEY_PREFIX = 'ratelimit:ip:';
const SESSION_TTL_SECONDS = 24 * 60 * 60; // 24 hours
const IP_TTL_SECONDS = 60 * 60; // 1 hour
const DEFAULT_IP_LIMIT = 50;
const DEFAULT_SESSION_LIMIT = 15;

@injectable()
export class RedisRateLimitService implements IRateLimitService {
  constructor(
    @inject('ISiteRepository') private siteRepo: ISiteRepository
  ) {}

  async checkSessionLimit(
    sessionId: string,
    siteId: string
  ): Promise<IRateLimitResult> {
    const site = await this.siteRepo.findById(siteId);
    const limit = site?.maxMessagesPerSession ?? DEFAULT_SESSION_LIMIT;

    const redis = getRedisClient();
    const key = `${SESSION_KEY_PREFIX}${sessionId}`;
    const countStr = await redis.get(key);
    const count = countStr ? parseInt(countStr, 10) : 0;

    if (count >= limit) {
      const ttl = await redis.ttl(key);
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(Date.now() + ttl * 1000),
        limitType: 'session',
      };
    }

    return {
      allowed: true,
      remaining: limit - count,
      resetAt: new Date(Date.now() + SESSION_TTL_SECONDS * 1000),
      limitType: 'session',
    };
  }

  async checkIpLimit(ipAddress: string): Promise<IRateLimitResult> {
    const redis = getRedisClient();
    const key = `${IP_KEY_PREFIX}${ipAddress}`;
    const countStr = await redis.get(key);
    const count = countStr ? parseInt(countStr, 10) : 0;

    if (count >= DEFAULT_IP_LIMIT) {
      const ttl = await redis.ttl(key);
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(Date.now() + ttl * 1000),
        limitType: 'ip',
      };
    }

    return {
      allowed: true,
      remaining: DEFAULT_IP_LIMIT - count,
      resetAt: new Date(Date.now() + IP_TTL_SECONDS * 1000),
      limitType: 'ip',
    };
  }

  async incrementSession(sessionId: string, _siteId: string): Promise<void> {
    const redis = getRedisClient();
    const key = `${SESSION_KEY_PREFIX}${sessionId}`;
    const count = await redis.incr(key);

    if (count === 1) {
      await redis.expire(key, SESSION_TTL_SECONDS);
    }
  }

  async incrementIp(ipAddress: string): Promise<void> {
    const redis = getRedisClient();
    const key = `${IP_KEY_PREFIX}${ipAddress}`;
    const count = await redis.incr(key);

    if (count === 1) {
      await redis.expire(key, IP_TTL_SECONDS);
    }
  }

  async getRemainingQuota(sessionId: string, siteId: string): Promise<number> {
    const result = await this.checkSessionLimit(sessionId, siteId);
    return result.remaining;
  }
}
