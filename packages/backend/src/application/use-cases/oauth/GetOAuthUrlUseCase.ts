import { injectable, inject } from 'tsyringe';
import { OAuthService } from '@/infrastructure/oauth';
import { OAuthProvider } from '@ai-onboarding/shared';

export interface IGetOAuthUrlInput {
  provider: OAuthProvider;
  redirectUri: string;
}

export interface IGetOAuthUrlOutput {
  authorizationUrl: string;
}

@injectable()
export class GetOAuthUrlUseCase {
  constructor(
    @inject('OAuthService') private oauthService: OAuthService
  ) {}

  execute(input: IGetOAuthUrlInput): IGetOAuthUrlOutput {
    const authorizationUrl = this.oauthService.getAuthorizationUrl(
      input.provider,
      input.redirectUri
    );

    return { authorizationUrl };
  }
}
