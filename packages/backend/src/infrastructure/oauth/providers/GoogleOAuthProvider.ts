import { injectable } from 'tsyringe';
import { IOAuthProvider, IOAuthTokens } from '@/domain/services/oauth/IOAuthProvider';
import { IOAuthUserProfile, OAuthProvider } from '@/domain/models';
import { Errors } from '@/domain/errors';

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  id_token?: string;
}

interface GoogleUserInfo {
  id: string;
  email?: string;
  verified_email?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

@injectable()
export class GoogleOAuthProvider implements IOAuthProvider {
  readonly provider = OAuthProvider.GOOGLE;

  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly authorizationEndpoint =
    'https://accounts.google.com/o/oauth2/v2/auth';
  private readonly tokenEndpoint = 'https://oauth2.googleapis.com/token';
  private readonly userInfoEndpoint =
    'https://www.googleapis.com/oauth2/v2/userinfo';

  constructor() {
    this.clientId = process.env.GOOGLE_CLIENT_ID || '';
    this.clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
  }

  getAuthorizationUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      access_type: 'offline',
      prompt: 'consent',
    });

    return `${this.authorizationEndpoint}?${params.toString()}`;
  }

  async exchangeCodeForTokens(
    code: string,
    redirectUri: string
  ): Promise<IOAuthTokens> {
    const body = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    });

    // DEBUG
    console.log('[Google OAuth] Token exchange request:');
    console.log('  redirect_uri:', redirectUri);
    console.log('  code:', code);
    console.log('  client_id:', this.clientId.substring(0, 20) + '...');

    const response = await fetch(this.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    if (!response.ok) {
      const error = await response.text();
      console.log('[Google OAuth] Token exchange error:', error);
      throw Errors.oauthCallbackError(`Failed to exchange code: ${error}`);
    }

    const data = (await response.json()) as GoogleTokenResponse;

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    };
  }

  async getUserProfile(accessToken: string): Promise<IOAuthUserProfile> {
    const response = await fetch(this.userInfoEndpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw Errors.oauthCallbackError(`Failed to fetch user profile: ${error}`);
    }

    const data = (await response.json()) as GoogleUserInfo;

    return {
      providerAccountId: data.id,
      email: data.email || null,
      displayName: data.name || null,
      avatarUrl: data.picture || null,
    };
  }
}
