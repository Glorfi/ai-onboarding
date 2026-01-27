import { mainApi } from '@/shared/api';
import { API_PATHS } from '@/shared/config/apiPaths';
import type {
  IPasswordSignInRequest,
  IPasswordSignInResponse,
} from '@ai-onboarding/shared';

export const signInApi = mainApi.injectEndpoints({
  endpoints: (build) => ({
    signIn: build.mutation<IPasswordSignInResponse, IPasswordSignInRequest>({
      query: (body) => ({
        url: API_PATHS.AUTH_PASSWORD_SIGN_IN,
        method: 'POST',
        body,
      }),
      // invalidatesTags: ['Auth'],
    }),
  }),
});

export const { useSignInMutation } = signInApi;
