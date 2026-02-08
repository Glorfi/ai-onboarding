import { SITE_STATUS } from '../../constants';

export type SiteStatus = (typeof SITE_STATUS)[keyof typeof SITE_STATUS];

export interface ISiteDTO {
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
  similarityThreshold: number;
  allowGeneralKnowledge: boolean;
  maxMessagesPerSession: number;
}

export interface IApiKeyDTO {
  id: string;
  siteId: string;
  key: string;
  isActive: boolean;
  createdAt: Date;
  lastRegeneratedAt?: Date;
}

export interface ISiteWithApiKeyDTO extends ISiteDTO {
  apiKey: IApiKeyDTO | null;
}
