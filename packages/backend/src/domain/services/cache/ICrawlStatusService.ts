import type { ICrawlProgress } from '@ai-onboarding/shared';

export interface ICrawlStatusService {
  setProgress(siteId: string, progress: ICrawlProgress): Promise<void>;
  getProgress(siteId: string): Promise<ICrawlProgress | null>;
  clearProgress(siteId: string): Promise<void>;
  canStartCrawl(siteId: string): Promise<boolean>;
  recordCrawlStart(siteId: string): Promise<void>;
}
