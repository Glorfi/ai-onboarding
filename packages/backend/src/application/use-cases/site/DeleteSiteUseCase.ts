import { injectable, inject } from 'tsyringe';
import { ISiteRepository } from '@/domain/repositories';
import { IVectorStoreService } from '@/domain/services/vector';
import { ICrawlStatusService } from '@/domain/services/cache';
import { Errors } from '@/domain/errors';

@injectable()
export class DeleteSiteUseCase {
  constructor(
    @inject('ISiteRepository') private siteRepo: ISiteRepository,
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

    // Delete vectors from Pinecone
    await this.vectorStore.deleteBySiteId(siteId);

    // Clear crawl progress from Redis
    await this.statusService.clearProgress(siteId);

    // Delete site (cascades to KB records)
    await this.siteRepo.delete(siteId);
  }
}
