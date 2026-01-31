import { mainApi } from '@/shared/api';
import { API_PATHS } from '@/shared/config';
import type { ICrawlStatusResponse } from '@ai-onboarding/shared';

export const getCrawlStatusApi = mainApi.injectEndpoints({
  endpoints: (build) => ({
    getCrawlStatus: build.query<ICrawlStatusResponse, string>({
      query: (id) => ({
        url: API_PATHS.SITES_CRAWL_STATUS(id),
        method: 'GET',
      }),
      providesTags: (_result, _error, id) => [{ type: 'CrawlStatus' as const, id }],
    }),
  }),
});

export const { useGetCrawlStatusQuery } = getCrawlStatusApi;
