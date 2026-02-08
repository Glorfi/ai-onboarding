import { injectable, inject } from 'tsyringe';
import crypto from 'crypto';
import { ISiteRepository, IApiKeyRepository } from '@/domain/repositories';
import { ICrawlStatusService } from '@/domain/services/cache';
import { ISite, IApiKey } from '@/domain/models';
import { Errors } from '@/domain/errors';
import { crawlQueue } from '@/infrastructure/jobs/queue';

export interface ICreateSiteUseCaseInput {
  url: string;
  additionalUrls?: string[];
  name?: string;
}

export interface ICreateSiteOutput {
  site: ISite;
  apiKey: IApiKey;
}

function generateApiKey(): string {
  return `aio_${crypto.randomBytes(24).toString('hex')}`;
}

@injectable()
export class CreateSiteUseCase {
  constructor(
    @inject('ISiteRepository') private siteRepo: ISiteRepository,
    @inject('IApiKeyRepository') private apiKeyRepo: IApiKeyRepository,
    @inject('ICrawlStatusService') private statusService: ICrawlStatusService
  ) {}

  async execute(userId: string, input: ICreateSiteUseCaseInput): Promise<ICreateSiteOutput> {
    // Extract domain from URL
    const urlObj = new URL(input.url);
    const domain = urlObj.hostname;

    const existingSite = await this.siteRepo.findByDomain(domain);
    const canCreateSite = existingSite?.userId === userId
    if (canCreateSite) {
      throw Errors.conflict("This domain has been already added")
    }

    // Create site with pending status
    const site = await this.siteRepo.create({
      userId,
      url: input.url,
      domain,
      name: input.name || domain,
      additionalUrls: input.additionalUrls,
    });

    // Prepare URLs for crawling
    const urlsToCrawl = [input.url, ...(input.additionalUrls || [])];

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

    // Create API key for the site
    const apiKey = await this.apiKeyRepo.create({
      siteId: site.id,
      key: generateApiKey(),
    });

    return { site: updatedSite, apiKey };
  }
}
