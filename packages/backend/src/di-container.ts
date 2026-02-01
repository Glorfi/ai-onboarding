import 'reflect-metadata';
import { container } from 'tsyringe';
import {
  PrismaUserRepository,
  PrismaOAuthAccountRepository,
  PrismaApiKeyRepository,
  PrismaChatMessageRepository,
  PrismaChatRatingRepository,
  PrismaUnansweredQuestionRepository,
  PrismaWidgetSessionRepository,
} from './infrastructure/database/repositories';
import { PrismaSiteRepository } from './infrastructure/database/repositories/PrismaSiteRepository';
import { PrismaKnowledgeBaseRepository } from './infrastructure/database/repositories/PrismaKnowledgeBaseRepository';
import { PasswordService, JwtService } from './domain/services';
import {
  OAuthProviderRegistry,
  OAuthStateService,
  OAuthService,
  GoogleOAuthProvider,
} from './infrastructure/oauth';
import { RedisCrawlStatusService } from './infrastructure/cache/RedisCrawlStatusService';
import { PlaywrightCrawlerService } from './infrastructure/crawling/PlaywrightCrawlerService';
import { TextChunker } from './infrastructure/crawling/TextChunker';
import { OpenAIEmbeddingService } from './infrastructure/embedding/OpenAIEmbeddingService';
import { PineconeVectorStoreService } from './infrastructure/vector/PineconeVectorStoreService';
import { RedisRateLimitService } from './infrastructure/cache/RedisRateLimitService';
import { OpenAIChatService } from './infrastructure/chat/OpenAIChatService';
import { KnowledgeBaseSearchService } from './infrastructure/knowledge/KnowledgeBaseSearchService';

export function initDI() {
  // Repositories
  container.register('IUserRepository', {
    useClass: PrismaUserRepository,
  });
  container.register('IOAuthAccountRepository', {
    useClass: PrismaOAuthAccountRepository,
  });
  container.register('ISiteRepository', {
    useClass: PrismaSiteRepository,
  });
  container.register('IKnowledgeBaseRepository', {
    useClass: PrismaKnowledgeBaseRepository,
  });
  container.register('IUnansweredQuestionRepository', {
    useClass: PrismaUnansweredQuestionRepository,
  });
  container.register('IChatRatingRepository', {
    useClass: PrismaChatRatingRepository,
  });
  container.register('IWidgetSessionRepository', {
    useClass: PrismaWidgetSessionRepository,
  });
  container.register('IChatMessageRepository', {
    useClass: PrismaChatMessageRepository,
  });
  container.register('IApiKeyRepository', { useClass: PrismaApiKeyRepository });

  // Domain Services
  container.registerSingleton('PasswordService', PasswordService);
  container.registerSingleton('JwtService', JwtService);

  // OAuth Services
  container.registerSingleton('OAuthStateService', OAuthStateService);
  container.registerSingleton('OAuthProviderRegistry', OAuthProviderRegistry);
  container.registerSingleton('OAuthService', OAuthService);

  // Crawling Services
  container.registerSingleton('ICrawlStatusService', RedisCrawlStatusService);
  container.registerSingleton('ICrawlerService', PlaywrightCrawlerService);
  container.registerSingleton('ITextChunker', TextChunker);
  container.registerSingleton('IEmbeddingService', OpenAIEmbeddingService);
  container.registerSingleton(
    'IVectorStoreService',
    PineconeVectorStoreService,
  );

  container.registerSingleton('IRateLimitService', RedisRateLimitService);
  container.registerSingleton(
    'IKnowledgeBaseSearchService',
    KnowledgeBaseSearchService,
  );
  container.registerSingleton('IChatService', OpenAIChatService);

  // Register OAuth Providers
  const registry = container.resolve<OAuthProviderRegistry>(
    'OAuthProviderRegistry',
  );

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    registry.registerProvider(new GoogleOAuthProvider());
    console.log('Google OAuth provider registered');
  }

  console.log('Dependency Injection initialized');
}
