import { injectable, inject } from 'tsyringe';
import crypto from 'crypto';
import { Errors } from '@/domain/errors';
import type {
  ISiteRepository,
  IChatMessageRepository,
  IUnansweredQuestionRepository,
  IWidgetSessionRepository,
} from '@/domain/repositories';
import type { IRateLimitService } from '@/domain/services/ratelimit';
import type { IKnowledgeBaseSearchService } from '@/domain/services/knowledge';
import type { IChatService } from '@/domain/services/chat';
import {
  widgetChatRequestSchema,
  type IWidgetChatRequest,
} from '@ai-onboarding/shared';

export interface IChatResult {
  response: string;
  responseTime: number;
  messageId?: string;
  sources?: Array<{ pageUrl: string; title?: string }>;
  canProvideEmail?: boolean;
  unansweredQuestionId?: string;
}

@injectable()
export class ProcessChatMessageUseCase {
  constructor(
    @inject('ISiteRepository') private siteRepo: ISiteRepository,
    @inject('IChatMessageRepository')
    private chatMessageRepo: IChatMessageRepository,
    @inject('IUnansweredQuestionRepository')
    private unansweredRepo: IUnansweredQuestionRepository,
    @inject('IWidgetSessionRepository')
    private sessionRepo: IWidgetSessionRepository,
    @inject('IRateLimitService') private rateLimitService: IRateLimitService,
    @inject('IKnowledgeBaseSearchService')
    private searchService: IKnowledgeBaseSearchService,
    @inject('IChatService') private chatService: IChatService
  ) {}

  async execute(
    siteId: string,
    input: IWidgetChatRequest,
    ipAddress: string,
    requestDomain: string
  ): Promise<IChatResult> {
    const startTime = Date.now();

    // 1. Validate input
    const validated = widgetChatRequestSchema.parse(input);

    // 2. Get site and validate domain (API key already validated in middleware)
    const site = await this.siteRepo.findById(siteId);
    if (!site) throw Errors.siteNotFound();

    const siteDomain = new URL(site.url).hostname;
    // Allow localhost for development
    if (
      requestDomain !== siteDomain &&
      requestDomain !== 'localhost' &&
      !requestDomain.startsWith('localhost:')
    ) {
      throw Errors.widgetDomainMismatch(requestDomain, siteDomain);
    }

    // 4. Check rate limits
    const sessionLimit = await this.rateLimitService.checkSessionLimit(
      validated.sessionId,
      site.id
    );
    if (!sessionLimit.allowed) {
      const retryAfter = Math.ceil(
        (sessionLimit.resetAt.getTime() - Date.now()) / 1000
      );
      throw Errors.widgetSessionLimit(retryAfter);
    }

    const ipLimit = await this.rateLimitService.checkIpLimit(ipAddress);
    if (!ipLimit.allowed) {
      const retryAfter = Math.ceil(
        (ipLimit.resetAt.getTime() - Date.now()) / 1000
      );
      throw Errors.widgetIpLimit(retryAfter);
    }

    // 5. Upsert widget session
    const ipHashSecret = process.env.IP_HASH_SECRET || 'default-secret';
    const ipHash = crypto
      .createHash('sha256')
      .update(ipAddress + ipHashSecret)
      .digest('hex');
    await this.sessionRepo.upsert({
      id: validated.sessionId,
      siteId: site.id,
      ipAddressHash: ipHash,
      userEmail: validated.userEmail,
    });

    // 6. Search knowledge base
    const searchResult = await this.searchService.search(
      site.id,
      validated.message,
      site.similarityThreshold
    );

    // 7. If no answer found
    if (!searchResult.hasAnswer) {
      const unansweredQuestion = await this.unansweredRepo.create({
        siteId: site.id,
        sessionId: validated.sessionId,
        userEmail: validated.userEmail,
        question: validated.message,
        bestMatchScore: searchResult.bestScore,
        timestamp: new Date(),
      });

      // Increment rate limit counters
      await this.rateLimitService.incrementSession(
        validated.sessionId,
        site.id
      );
      await this.rateLimitService.incrementIp(ipAddress);
      await this.sessionRepo.incrementMessageCount(validated.sessionId);

      return {
        response:
          "I don't have enough information to answer this question. Would you like to leave your email so the team can help you?",
        responseTime: Date.now() - startTime,
        canProvideEmail: true,
        unansweredQuestionId: unansweredQuestion.id,
      };
    }

    // 8. Generate AI response
    const chatResponse = await this.chatService.generateResponse(
      validated.message,
      searchResult.chunks,
      site.allowGeneralKnowledge,
      site.name
    );

    // 9. Save chat message
    const chatMessage = await this.chatMessageRepo.create({
      siteId: site.id,
      sessionId: validated.sessionId,
      message: validated.message,
      response: chatResponse.response,
      responseTimeMs: Date.now() - startTime,
    });

    // 10. Increment rate limit counters
    await this.rateLimitService.incrementSession(validated.sessionId, site.id);
    await this.rateLimitService.incrementIp(ipAddress);
    await this.sessionRepo.incrementMessageCount(validated.sessionId);

    return {
      response: chatResponse.response,
      responseTime: Date.now() - startTime,
      messageId: chatMessage.id,
      sources: chatResponse.sources,
    };
  }
}
