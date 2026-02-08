import { SITE_STATUS } from '../../../constants';

type SiteStatus = (typeof SITE_STATUS)[keyof typeof SITE_STATUS];

export interface ICrawlErrorDTO {
  url: string;
  message: string;
}

export interface ICrawlProgressDTO {
  pagesDiscovered: number;
  pagesCrawled: number;
  pagesProcessed: number;
  currentUrl?: string;
  errors: ICrawlErrorDTO[];
}

export interface ICrawlStatusResponse {
  siteId: string;
  status: SiteStatus;
  progress: ICrawlProgressDTO;
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
}
