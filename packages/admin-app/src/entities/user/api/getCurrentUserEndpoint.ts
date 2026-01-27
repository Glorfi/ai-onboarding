import { mainApi } from '@/shared/api';
import { API_PATHS } from '@/shared/config/apiPaths';
import type { IGetCurrentUserResponse } from '@ai-onboarding/shared';

export const signInApi = mainApi.injectEndpoints({
  endpoints: (build) => ({
    getCurrentUser: build.query<IGetCurrentUserResponse, void>({
      query: () => ({
        url: API_PATHS.USERS_ME,
        method: 'GET',
      }),
    }),
  }),
});

export const { useGetCurrentUserQuery } = signInApi;
