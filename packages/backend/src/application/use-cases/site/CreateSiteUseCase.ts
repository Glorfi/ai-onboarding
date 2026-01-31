import { injectable, inject } from 'tsyringe';
import { ISiteRepository } from '@/domain/repositories';
import { ICrawlStatusService } from '@/domain/services/cache';
import { ISite } from '@/domain/models';
import { Errors } from '@/domain/errors';
import { createSiteInputSchema, ICreateSiteInput } from '@ai-onboarding/shared';
import { crawlQueue } from '@/infrastructure/jobs/queue';

export interface ICreateSiteOutput {
  site: ISite;
}

@injectable()
export class CreateSiteUseCase {
  constructor(
    @inject('ISiteRepository') private siteRepo: ISiteRepository,
    @inject('ICrawlStatusService') private statusService: ICrawlStatusService
  ) {}

  async execute(userId: string, input: ICreateSiteInput): Promise<ICreateSiteOutput> {
    const validated = createSiteInputSchema.parse(input);

    // Extract domain from URL
    const urlObj = new URL(validated.url);
    const domain = urlObj.hostname;

    const existingSite = await this.siteRepo.findByDomain(domain);
    const canCreateSite = existingSite?.userId === userId
    if (canCreateSite) {
      throw Errors.conflict("This domain has been already added")
    }

    // Create site with pending status
    const site = await this.siteRepo.create({
      userId,
      url: validated.url,
      domain,
      name: validated.name || domain,
      additionalUrls: validated.additionalUrls,
    });

    // Prepare URLs for crawling
    const urlsToCrawl = [validated.url, ...(validated.additionalUrls || [])];

    // Enqueue crawl job
    await crawlQueue.add(
      'crawl',
      {
        siteId: site.id,
        urls: urlsToCrawl,
      },
      {
        jobId: `crawl-${site.id}`,
      }
    );

    // Update status to crawling
    const updatedSite = await this.siteRepo.updateStatus(site.id, 'crawling');

    // Record crawl start for rate limiting
    await this.statusService.recordCrawlStart(site.id);

    return { site: updatedSite };
  }
}
