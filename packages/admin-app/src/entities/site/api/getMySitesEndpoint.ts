import { mainApi } from '@/shared/api';
import { API_PATHS } from '@/shared/config';
import type { ICreateSiteResponse } from '@ai-onboarding/shared';

export const getMySitesApi = mainApi.injectEndpoints({
  endpoints: (build) => ({
    getMySites: build.query<ICreateSiteResponse, void>({
      query: () => ({
        url: API_PATHS.SITES_MINE,
        method: 'GET',
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.sites.map(({ id }) => ({ type: 'Site' as const, id })),
              { type: 'Site' as const, id: 'LIST' },
            ]
          : [{ type: 'Site' as const, id: 'LIST' }],
    }),
  }),
});

export const { useGetMySitesQuery } = getMySitesApi;
