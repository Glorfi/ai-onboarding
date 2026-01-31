import type { SiteStatus } from '../../entities/Site';

export interface ICrawlError {
  url: string;
  message: string;
}

export interface ICrawlProgress {
  pagesDiscovered: number;
  pagesCrawled: number;
  pagesProcessed: number;
  currentUrl?: string;
  errors: ICrawlError[];
}

export interface ICrawlStatusResponse {
  siteId: string;
  status: SiteStatus;
  progress: ICrawlProgress;
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
}
