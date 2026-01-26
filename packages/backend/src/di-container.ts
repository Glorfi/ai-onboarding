import 'reflect-metadata';
import { container } from 'tsyringe';
import {
  PrismaUserRepository,
  PrismaOAuthAccountRepository,
} from './infrastructure/database/repositories';
import { PasswordService, JwtService } from './domain/services';
import {
  OAuthProviderRegistry,
  OAuthStateService,
  OAuthService,
  GoogleOAuthProvider,
} from './infrastructure/oauth';

export function initDI() {
  // Repositories
  container.register('IUserRepository', {
    useClass: PrismaUserRepository,
  });
  container.register('IOAuthAccountRepository', {
    useClass: PrismaOAuthAccountRepository,
  });

  // Domain Services
  container.registerSingleton('PasswordService', PasswordService);
  container.registerSingleton('JwtService', JwtService);

  // OAuth Services
  container.registerSingleton('OAuthStateService', OAuthStateService);
  container.registerSingleton('OAuthProviderRegistry', OAuthProviderRegistry);
  container.registerSingleton('OAuthService', OAuthService);

  // Register OAuth Providers
  const registry = container.resolve<OAuthProviderRegistry>('OAuthProviderRegistry');

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    registry.registerProvider(new GoogleOAuthProvider());
    console.log('Google OAuth provider registered');
  }

  console.log('Dependency Injection initialized');
}
