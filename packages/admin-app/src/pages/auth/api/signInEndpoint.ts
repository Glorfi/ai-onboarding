import { mainApi } from '@/shared/api';
import { API_PATHS } from '@/shared/config';
import type {
  IPasswordSignInResponse,
  ISignInInput,
} from '@ai-onboarding/shared';

export const signInApi = mainApi.injectEndpoints({
  endpoints: (build) => ({
    signIn: build.mutation<IPasswordSignInResponse, ISignInInput>({
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
