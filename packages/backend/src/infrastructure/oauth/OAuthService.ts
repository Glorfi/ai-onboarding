import { injectable, inject } from 'tsyringe';
import { IUserRepository, IOAuthAccountRepository } from '@/domain/repositories';
import { JwtService } from '@/domain/services';
import { OAuthProviderRegistry } from './OAuthProviderRegistry';
import { OAuthStateService } from './OAuthStateService';
import {
  IOAuthAccount,
  IUserPublic,
  OAuthProvider,
} from '@ai-onboarding/shared';
import { Errors } from '@/domain/errors';

export interface IOAuthSignInResult {
  user: IUserPublic;
  accessToken: string;
  refreshToken: string;
  isNewUser: boolean;
}

export interface IOAuthLinkResult {
  oauthAccount: IOAuthAccount;
}

@injectable()
export class OAuthService {
  constructor(
    @inject('IUserRepository') private userRepo: IUserRepository,
    @inject('IOAuthAccountRepository')
    private oauthAccountRepo: IOAuthAccountRepository,
    @inject('JwtService') private jwtService: JwtService,
    @inject('OAuthProviderRegistry')
    private providerRegistry: OAuthProviderRegistry,
    @inject('OAuthStateService') private stateService: OAuthStateService
  ) {}

  getAuthorizationUrl(provider: OAuthProvider, redirectUri: string): string {
    const oauthProvider = this.providerRegistry.getProvider(provider);
    const state = this.stateService.generateState(provider);

    return oauthProvider.getAuthorizationUrl(state, redirectUri);
  }

  async handleCallback(
    provider: OAuthProvider,
    code: string,
    state: string,
    redirectUri: string
  ): Promise<IOAuthSignInResult> {
    if (!this.stateService.validateAndConsumeState(state, provider)) {
      throw Errors.oauthStateInvalid();
    }

    const oauthProvider = this.providerRegistry.getProvider(provider);

    const tokens = await oauthProvider.exchangeCodeForTokens(code, redirectUri);
    const profile = await oauthProvider.getUserProfile(tokens.accessToken);

    let oauthAccount = await this.oauthAccountRepo.findByProviderAndAccountId(
      provider,
      profile.providerAccountId
    );

    let user;
    let isNewUser = false;

    if (oauthAccount) {
      await this.oauthAccountRepo.update(oauthAccount.id, {
        email: profile.email,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
      });

      user = await this.userRepo.findById(oauthAccount.userId);
      if (!user) {
        throw Errors.notFound('User');
      }
    } else {
      if (profile.email) {
        user = await this.userRepo.findByEmail(profile.email);
      }

      if (!user) {
        user = await this.userRepo.create({
          email: profile.email,
          passwordHash: null,
        });
        isNewUser = true;
      }

      oauthAccount = await this.oauthAccountRepo.create({
        userId: user.id,
        provider,
        providerAccountId: profile.providerAccountId,
        email: profile.email,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
      });
    }

    const accessToken = this.jwtService.generateAccessToken(user.id);
    const refreshToken = this.jwtService.generateRefreshToken(user.id);

    const { passwordHash: _, ...userPublic } = user;

    return {
      user: userPublic,
      accessToken,
      refreshToken,
      isNewUser,
    };
  }

  async linkAccount(
    userId: string,
    provider: OAuthProvider,
    code: string,
    redirectUri: string
  ): Promise<IOAuthLinkResult> {
    const oauthProvider = this.providerRegistry.getProvider(provider);

    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw Errors.notFound('User');
    }

    const existingAccount = await this.oauthAccountRepo.findByUserIdAndProvider(
      userId,
      provider
    );
    if (existingAccount) {
      throw Errors.conflict(`${provider} account is already linked`);
    }

    const tokens = await oauthProvider.exchangeCodeForTokens(code, redirectUri);
    const profile = await oauthProvider.getUserProfile(tokens.accessToken);

    const existingOAuth = await this.oauthAccountRepo.findByProviderAndAccountId(
      provider,
      profile.providerAccountId
    );
    if (existingOAuth) {
      throw Errors.oauthAccountAlreadyLinked();
    }

    const oauthAccount = await this.oauthAccountRepo.create({
      userId,
      provider,
      providerAccountId: profile.providerAccountId,
      email: profile.email,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
    });

    return { oauthAccount };
  }

  async unlinkAccount(userId: string, provider: OAuthProvider): Promise<void> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw Errors.notFound('User');
    }

    const oauthAccounts = await this.oauthAccountRepo.findByUserId(userId);
    const hasPassword = user.passwordHash !== null;

    if (!hasPassword && oauthAccounts.length <= 1) {
      throw Errors.cannotUnlinkLastAuth();
    }

    const deleted = await this.oauthAccountRepo.deleteByUserIdAndProvider(
      userId,
      provider
    );
    if (!deleted) {
      throw Errors.oauthAccountNotFound();
    }
  }

  async getLinkedAccounts(userId: string): Promise<IOAuthAccount[]> {
    return this.oauthAccountRepo.findByUserId(userId);
  }
}
