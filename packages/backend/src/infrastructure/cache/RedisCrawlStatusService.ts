import { injectable } from 'tsyringe';
import type { ICrawlProgress } from '@/domain/models';
import { DEFAULTS } from '@ai-onboarding/shared';
import type { ICrawlStatusService } from '../../domain/services/cache';
import { getRedisClient } from './RedisClient';

const PROGRESS_KEY_PREFIX = 'crawl:progress:';
const RATE_LIMIT_KEY_PREFIX = 'crawl:ratelimit:';
const PROGRESS_TTL_SECONDS = 3600; // 1 hour

@injectable()
export class RedisCrawlStatusService implements ICrawlStatusService {
  async setProgress(siteId: string, progress: ICrawlProgress): Promise<void> {
    const redis = getRedisClient();
    const key = `${PROGRESS_KEY_PREFIX}${siteId}`;
    await redis.setex(key, PROGRESS_TTL_SECONDS, JSON.stringify(progress));
  }

  async getProgress(siteId: string): Promise<ICrawlProgress | null> {
    const redis = getRedisClient();
    const key = `${PROGRESS_KEY_PREFIX}${siteId}`;
    const data = await redis.get(key);

    if (!data) {
      return null;
    }

    return JSON.parse(data) as ICrawlProgress;
  }

  async clearProgress(siteId: string): Promise<void> {
    const redis = getRedisClient();
    const key = `${PROGRESS_KEY_PREFIX}${siteId}`;
    await redis.del(key);
  }

  async canStartCrawl(siteId: string): Promise<boolean> {
    const redis = getRedisClient();
    const key = `${RATE_LIMIT_KEY_PREFIX}${siteId}`;
    const exists = await redis.exists(key);
    return exists === 0;
  }

  async recordCrawlStart(siteId: string): Promise<void> {
    const redis = getRedisClient();
    const key = `${RATE_LIMIT_KEY_PREFIX}${siteId}`;
    const ttlSeconds = DEFAULTS.RECRAWL_RATE_LIMIT_HOURS * 3600;
    await redis.setex(key, ttlSeconds, Date.now().toString());
  }
}
