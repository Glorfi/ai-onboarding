import { injectable, inject } from 'tsyringe';
import type { ISiteRepository } from '@/domain/repositories';
import type { ISite } from '@/domain/models';

export interface IGetUserSitesOutput {
  sites: ISite[];
}

@injectable()
export class GetUserSitesUseCase {
  constructor(
    @inject('ISiteRepository') private siteRepo: ISiteRepository,
  ) {}

  async execute(userId: string): Promise<IGetUserSitesOutput> {
    const sites = await this.siteRepo.findByUserId(userId);
    return { sites };
  }
}
