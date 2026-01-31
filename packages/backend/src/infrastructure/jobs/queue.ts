import { Queue } from 'bullmq';
import { getRedisClient } from '../cache/RedisClient';

export interface ICrawlJobData {
  siteId: string;
  urls: string[];
}

export const crawlQueue = new Queue<ICrawlJobData>('site-crawl', {
  connection: getRedisClient(),
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: true,
    removeOnFail: false,
  },
});
