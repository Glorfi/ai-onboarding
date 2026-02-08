import { injectable, inject } from 'tsyringe';
import type { IApiKeyRepository } from '@/domain/repositories';
import type { IApiKey } from '@/domain/models';

export interface IGetSiteApiKeyOutput {
  apiKey: IApiKey | null;
}

@injectable()
export class GetSiteApiKeyUseCase {
  constructor(
    @inject('IApiKeyRepository') private apiKeyRepo: IApiKeyRepository,
  ) {}

  async execute(siteId: string): Promise<IGetSiteApiKeyOutput> {
    const apiKey = await this.apiKeyRepo.findBySiteId(siteId);
    return { apiKey: apiKey || null };
  }
}
