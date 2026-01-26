import { IOAuthUserProfile, OAuthProvider } from '@ai-onboarding/shared';

export interface IOAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

export interface IOAuthProvider {
  readonly provider: OAuthProvider;

  getAuthorizationUrl(state: string, redirectUri: string): string;

  exchangeCodeForTokens(
    code: string,
    redirectUri: string
  ): Promise<IOAuthTokens>;

  getUserProfile(accessToken: string): Promise<IOAuthUserProfile>;
}
