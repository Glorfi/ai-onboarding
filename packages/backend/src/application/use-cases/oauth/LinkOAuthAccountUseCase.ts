import { injectable, inject } from 'tsyringe';
import { OAuthService, IOAuthLinkResult } from '@/infrastructure/oauth';
import { OAuthProvider } from '@ai-onboarding/shared';

export interface ILinkOAuthInput {
  userId: string;
  provider: OAuthProvider;
  code: string;
  redirectUri: string;
}

@injectable()
export class LinkOAuthAccountUseCase {
  constructor(
    @inject('OAuthService') private oauthService: OAuthService
  ) {}

  async execute(input: ILinkOAuthInput): Promise<IOAuthLinkResult> {
    return this.oauthService.linkAccount(
      input.userId,
      input.provider,
      input.code,
      input.redirectUri
    );
  }
}
