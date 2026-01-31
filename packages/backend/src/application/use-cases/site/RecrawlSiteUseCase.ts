import { injectable, inject } from 'tsyringe';
import { ISiteRepository, IKnowledgeBaseRepository } from '@/domain/repositories';
import { ICrawlStatusService } from '@/domain/services/cache';
import { IVectorStoreService } from '@/domain/services/vector';
import { Errors } from '@/domain/errors';
import { crawlQueue } from '@/infrastructure/jobs/queue';

@injectable()
export class RecrawlSiteUseCase {
  constructor(
    @inject('ISiteRepository') private siteRepo: ISiteRepository,
    @inject('IKnowledgeBaseRepository') private kbRepo: IKnowledgeBaseRepository,
    @inject('IVectorStoreService') private vectorStore: IVectorStoreService,
    @inject('ICrawlStatusService') private statusService: ICrawlStatusService
  ) {}

  async execute(userId: string, siteId: string): Promise<void> {
    const site = await this.siteRepo.findById(siteId);

    if (!site) {
      throw Errors.siteNotFound();
    }

    if (site.userId !== userId) {
      throw Errors.siteNotOwned();
    }

    // Check if crawl is already in progress
    if (site.status === 'crawling') {
      throw Errors.crawlAlreadyInProgress();
    }

    // Check rate limit
    const canStart = await this.statusService.canStartCrawl(siteId);
    if (!canStart) {
      throw Errors.crawlRateLimited();
    }

    // Clear old knowledge base data
    await this.vectorStore.deleteBySiteId(siteId);
    await this.kbRepo.deleteBySiteId(siteId);

    // Prepare URLs for crawling
    const urlsToCrawl = [site.url, ...site.additionalUrls];

    // Enqueue new crawl job
    await crawlQueue.add(
      'crawl',
      {
        siteId: site.id,
        urls: urlsToCrawl,
      },
      {
        jobId: `crawl-${site.id}-${Date.now()}`,
      }
    );

    // Update status to crawling
    await this.siteRepo.updateStatus(siteId, 'crawling');

    // Record crawl start for rate limiting
    await this.statusService.recordCrawlStart(siteId);
  }
}
