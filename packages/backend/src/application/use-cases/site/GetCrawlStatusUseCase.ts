import { injectable, inject } from 'tsyringe';
import { ISiteRepository } from '@/domain/repositories';
import { ICrawlStatusService } from '@/domain/services/cache';
import { Errors } from '@/domain/errors';
import type { ICrawlStatusResponse } from '@ai-onboarding/shared';

@injectable()
export class GetCrawlStatusUseCase {
  constructor(
    @inject('ISiteRepository') private siteRepo: ISiteRepository,
    @inject('ICrawlStatusService') private statusService: ICrawlStatusService
  ) {}

  async execute(userId: string, siteId: string): Promise<ICrawlStatusResponse> {
    const site = await this.siteRepo.findById(siteId);

    if (!site) {
      throw Errors.siteNotFound();
    }

    if (site.userId !== userId) {
      throw Errors.siteNotOwned();
    }

    const progress = await this.statusService.getProgress(siteId);

    return {
      siteId: site.id,
      status: site.status,
      progress: progress || {
        pagesDiscovered: 0,
        pagesCrawled: 0,
        pagesProcessed: 0,
        errors: [],
      },
      errorMessage: site.errorMessage,
    };
  }
}
