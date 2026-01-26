import { injectable, inject } from 'tsyringe';
import { OAuthService, IOAuthSignInResult } from '@/infrastructure/oauth';
import { OAuthProvider } from '@ai-onboarding/shared';

export interface IOAuthSignInInput {
  provider: OAuthProvider;
  code: string;
  state: string;
  redirectUri: string;
}

@injectable()
export class OAuthSignInUseCase {
  constructor(
    @inject('OAuthService') private oauthService: OAuthService
  ) {}

  async execute(input: IOAuthSignInInput): Promise<IOAuthSignInResult> {
    return this.oauthService.handleCallback(
      input.provider,
      input.code,
      input.state,
      input.redirectUri
    );
  }
}
