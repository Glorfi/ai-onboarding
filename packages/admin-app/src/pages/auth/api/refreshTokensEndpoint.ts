import { mainApi } from '@/shared/api';
import { API_PATHS } from '@/shared/config';
import type { IPasswordSignInResponse } from '@ai-onboarding/shared';

export const signInApi = mainApi.injectEndpoints({
  endpoints: (build) => ({
    refreshTokens: build.query<IPasswordSignInResponse, void>({
      query: () => ({
        url: API_PATHS.AUTH_REFRESH_TOKENS,
        method: 'POST',
      }),
    }),
  }),
});

export const { useRefreshTokensQuery } = signInApi;
