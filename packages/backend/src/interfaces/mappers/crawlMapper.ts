import type { ISite, ICrawlProgress } from '@/domain/models';
import type { ICrawlStatusResponse } from '@ai-onboarding/shared';

const EMPTY_PROGRESS = {
  pagesDiscovered: 0,
  pagesCrawled: 0,
  pagesProcessed: 0,
  errors: [],
};

export function toCrawlStatusResponse(
  site: ISite,
  progress: ICrawlProgress | null,
): ICrawlStatusResponse {
  return {
    siteId: site.id,
    status: site.status,
    progress: progress || EMPTY_PROGRESS,
    errorMessage: site.errorMessage,
  };
}
