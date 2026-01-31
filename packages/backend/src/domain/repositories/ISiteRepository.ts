import type { ISite, ICreateSiteData, IUpdateSiteData, SiteStatus } from '../models';

export interface ISiteRepository {
  findById(id: string): Promise<ISite | null>;
  findByUserId(userId: string): Promise<ISite[]>;
  findByDomain(domain: string): Promise<ISite | null>;
  create(data: ICreateSiteData): Promise<ISite>;
  update(id: string, data: IUpdateSiteData): Promise<ISite>;
  updateStatus(id: string, status: SiteStatus, errorMessage?: string): Promise<ISite>;
  delete(id: string): Promise<boolean>;
}
