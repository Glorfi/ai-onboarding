import { mainApi } from '@/shared/api';
import { API_PATHS } from '@/shared/config';
import type { ICreateSiteInput, ICreateSiteResponse } from '@ai-onboarding/shared';

export const createSiteApi = mainApi.injectEndpoints({
  endpoints: (build) => ({
    createSite: build.mutation<ICreateSiteResponse, ICreateSiteInput>({
      query: (body) => ({
        url: API_PATHS.SITES,
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Site' as const, id: 'LIST' }],
    }),
  }),
});

export const { useCreateSiteMutation } = createSiteApi;
