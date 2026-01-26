import { injectable, inject } from 'tsyringe';
import { OAuthService } from '@/infrastructure/oauth';

export interface ILinkedAccountInfo {
  provider: string;
  email: string | null;
  displayName: string | null;
  linkedAt: Date;
}

export interface IGetLinkedAccountsOutput {
  accounts: ILinkedAccountInfo[];
}

@injectable()
export class GetLinkedAccountsUseCase {
  constructor(
    @inject('OAuthService') private oauthService: OAuthService
  ) {}

  async execute(userId: string): Promise<IGetLinkedAccountsOutput> {
    const accounts = await this.oauthService.getLinkedAccounts(userId);

    return {
      accounts: accounts.map((acc) => ({
        provider: acc.provider,
        email: acc.email,
        displayName: acc.displayName,
        linkedAt: acc.createdAt,
      })),
    };
  }
}
