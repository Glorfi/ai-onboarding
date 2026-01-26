import { injectable } from 'tsyringe';
import { IOAuthProvider } from '@/domain/services/oauth/IOAuthProvider';
import { OAuthProvider } from '@ai-onboarding/shared';
import { Errors } from '@/domain/errors';

@injectable()
export class OAuthProviderRegistry {
  private providers: Map<OAuthProvider, IOAuthProvider> = new Map();

  registerProvider(provider: IOAuthProvider): void {
    this.providers.set(provider.provider, provider);
  }

  getProvider(provider: OAuthProvider): IOAuthProvider {
    const oauthProvider = this.providers.get(provider);
    if (!oauthProvider) {
      throw Errors.oauthProviderNotSupported(provider);
    }
    return oauthProvider;
  }

  hasProvider(provider: OAuthProvider): boolean {
    return this.providers.has(provider);
  }

  getSupportedProviders(): OAuthProvider[] {
    return Array.from(this.providers.keys());
  }
}
