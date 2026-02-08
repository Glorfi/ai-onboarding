import { injectable, inject } from 'tsyringe';
import { ISiteRepository } from '@/domain/repositories';
import { ICrawlStatusService } from '@/domain/services/cache';
import { ISite, ICrawlProgress } from '@/domain/models';
import { Errors } from '@/domain/errors';

export interface IGetCrawlStatusOutput {
  site: ISite;
  progress: ICrawlProgress | null;
}

@injectable()
export class GetCrawlStatusUseCase {
  constructor(
    @inject('ISiteRepository') private siteRepo: ISiteRepository,
    @inject('ICrawlStatusService') private statusService: ICrawlStatusService
  ) {}

  async execute(userId: string, siteId: string): Promise<IGetCrawlStatusOutput> {
    const site = await this.siteRepo.findById(siteId);

    if (!site) {
      throw Errors.siteNotFound();
    }

    if (site.userId !== userId) {
      throw Errors.siteNotOwned();
    }

    const progress = await this.statusService.getProgress(siteId);

    return { site, progress };
  }
}
