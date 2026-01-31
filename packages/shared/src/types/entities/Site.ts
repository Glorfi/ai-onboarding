export type SiteStatus = 'pending' | 'crawling' | 'active' | 'error';

export interface ISite {
  id: string;
  userId: string;
  url: string;
  domain: string;
  name?: string;
  status: SiteStatus;
  triggerDelaySeconds: number;
  additionalUrls: string[];
  lastCrawledAt?: Date;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateSiteData {
  userId: string;
  url: string;
  domain: string;
  name?: string;
  additionalUrls?: string[];
  triggerDelaySeconds?: number;
}

export interface IUpdateSiteData {
  name?: string;
  status?: SiteStatus;
  triggerDelaySeconds?: number;
  lastCrawledAt?: Date;
  errorMessage?: string;
}
