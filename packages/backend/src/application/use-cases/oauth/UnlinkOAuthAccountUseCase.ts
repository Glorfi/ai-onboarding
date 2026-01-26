import { injectable, inject } from 'tsyringe';
import { OAuthService } from '@/infrastructure/oauth';
import { OAuthProvider } from '@ai-onboarding/shared';

export interface IUnlinkOAuthInput {
  userId: string;
  provider: OAuthProvider;
}

@injectable()
export class UnlinkOAuthAccountUseCase {
  constructor(
    @inject('OAuthService') private oauthService: OAuthService
  ) {}

  async execute(input: IUnlinkOAuthInput): Promise<void> {
    await this.oauthService.unlinkAccount(input.userId, input.provider);
  }
}
