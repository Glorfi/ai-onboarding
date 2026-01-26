export type SiteStatus = 'pending' | 'crawling' | 'active' | 'error';

export interface ISite {
  id: string;
  userId: string;
  url: string;
  domain: string;
  name?: string;
  status: SiteStatus;
  triggerDelaySeconds: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateSiteData {
  userId: string;
  url: string;
  domain: string;
  name?: string;
  triggerDelaySeconds?: number;
}

export interface IUpdateSiteData {
  name?: string;
  status?: SiteStatus;
  triggerDelaySeconds?: number;
}
