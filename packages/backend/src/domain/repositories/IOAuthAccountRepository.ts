import {
  IOAuthAccount,
  ICreateOAuthAccountData,
  IUpdateOAuthAccountData,
  OAuthProvider,
} from '@ai-onboarding/shared';

export interface IOAuthAccountRepository {
  findById(id: string): Promise<IOAuthAccount | null>;

  findByProviderAndAccountId(
    provider: OAuthProvider,
    providerAccountId: string
  ): Promise<IOAuthAccount | null>;

  findByUserId(userId: string): Promise<IOAuthAccount[]>;

  findByUserIdAndProvider(
    userId: string,
    provider: OAuthProvider
  ): Promise<IOAuthAccount | null>;

  create(data: ICreateOAuthAccountData): Promise<IOAuthAccount>;

  update(id: string, data: IUpdateOAuthAccountData): Promise<IOAuthAccount>;

  delete(id: string): Promise<boolean>;

  deleteByUserIdAndProvider(
    userId: string,
    provider: OAuthProvider
  ): Promise<boolean>;
}
