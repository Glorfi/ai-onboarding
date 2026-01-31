import { mainApi } from '@/shared/api';
import { API_PATHS } from '@/shared/config';

export const recrawlSiteApi = mainApi.injectEndpoints({
  endpoints: (build) => ({
    recrawlSite: build.mutation<{ message: string }, string>({
      query: (id) => ({
        url: API_PATHS.SITES_RECRAWL(id),
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Site' as const, id },
        { type: 'CrawlStatus' as const, id },
      ],
    }),
  }),
});

export const { useRecrawlSiteMutation } = recrawlSiteApi;
