import 'reflect-metadata';
import 'dotenv/config';
import { Worker, Job } from 'bullmq';
import { container } from 'tsyringe';
import { getRedisClient, closeRedisConnection } from '../cache/RedisClient';
import { CrawlJobProcessor } from './CrawlJobProcessor';
import type { ICrawlJobData } from './queue';
import { initDI } from '@/di-container';

// Register DI dependencies
// import '../../di-container';
initDI();
// TO DO: вынести этот воркер в отдельный контейнер

const QUEUE_NAME = 'site-crawl';
const CONCURRENCY = 2; // Max concurrent crawls

console.log('Starting crawl worker...');

const worker = new Worker<ICrawlJobData>(
  QUEUE_NAME,
  async (job: Job<ICrawlJobData>) => {
    console.log(`Processing job ${job.id} for site ${job.data.siteId}`);

    const processor = container.resolve(CrawlJobProcessor);
    await processor.process(job.data);

    console.log(`Job ${job.id} completed`);
  },
  {
    connection: getRedisClient(),
    concurrency: CONCURRENCY,
  },
);

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

worker.on('failed', (job, error) => {
  console.error(`Job ${job?.id} failed:`, error.message);
});

worker.on('error', (error) => {
  console.error('Worker error:', error);
});

// Graceful shutdown
async function shutdown() {
  console.log('Shutting down worker...');
  await worker.close();
  await closeRedisConnection();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

console.log(`Crawl worker started with concurrency ${CONCURRENCY}`);
