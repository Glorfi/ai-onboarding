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
    @inject('IChatService') private chatService: IChatService,
  ) {}

  async execute(
    siteId: string,
    input: IWidgetChatRequest,
    ipAddress: string,
    requestDomain: string,
  ): Promise<IChatResult> {
    const startTime = Date.now();

    // 1. Validate input
    const validated = widgetChatRequestSchema.parse(input);

    // 2. Get site and validate domain
    const site = await this.siteRepo.findById(siteId);
    if (!site) throw Errors.siteNotFound();

    this.validateDomain(requestDomain, site.url);

    // 3. Check rate limits
    await this.checkRateLimits(validated.sessionId, site.id, ipAddress);

    // 4. Upsert session
    await this.upsertSession(
      validated.sessionId,
      site.id,
      ipAddress,
      validated.userEmail,
    );

    // 5. Search knowledge base
    const searchResult = await this.searchService.search(
      site.id,
      validated.message,
      site.similarityThreshold,
    );

    // 6. Handle no answer from knowledge base
    if (!searchResult.hasAnswer) {
      return this.handleUnanswered(
        site.id,
        validated.sessionId,
        validated.userEmail,
        validated.message,
        searchResult.bestScore,
        ipAddress,
        startTime,
      );
    }

    // 7. Generate AI response
    const chatResponse = await this.chatService.generateResponse(
      validated.message,
      searchResult.chunks,
      site.allowGeneralKnowledge,
      site.name,
    );

    // 8. If AI cannot provide answer
    if (chatResponse.response === 'noAnswer') {
      return this.handleUnanswered(
        site.id,
        validated.sessionId,
        validated.userEmail,
        validated.message,
        searchResult.bestScore,
        ipAddress,
        startTime,
      );
    }

    // 9. Save chat message
    const chatMessage = await this.chatMessageRepo.create({
      siteId: site.id,
      sessionId: validated.sessionId,
      message: validated.message,
      response: chatResponse.response,
      responseTimeMs: Date.now() - startTime,
    });

    // 10. Increment rate limit counters
    await this.incrementLimits(validated.sessionId, siteId, ipAddress);

    return {
      response: chatResponse.response,
      responseTime: Date.now() - startTime,
      messageId: chatMessage.id,
      sources: chatResponse.sources,
    };
  }

  private validateDomain(requestDomain: string, siteUrl: string) {
    const siteDomain = new URL(siteUrl).hostname;
    if (
      requestDomain !== siteDomain &&
      requestDomain !== 'localhost' &&
      !requestDomain.startsWith('localhost:')
    ) {
      throw Errors.widgetDomainMismatch(requestDomain, siteDomain);
    }
  }

  private async checkRateLimits(
    sessionId: string,
    siteId: string,
    ipAddress: string,
  ) {
    const sessionLimit = await this.rateLimitService.checkSessionLimit(
      sessionId,
      siteId,
    );
    if (!sessionLimit.allowed) {
      const retryAfter = Math.ceil(
        (sessionLimit.resetAt.getTime() - Date.now()) / 1000,
      );
      throw Errors.widgetSessionLimit(retryAfter);
    }

    const ipLimit = await this.rateLimitService.checkIpLimit(ipAddress);
    if (!ipLimit.allowed) {
      const retryAfter = Math.ceil(
        (ipLimit.resetAt.getTime() - Date.now()) / 1000,
      );
      throw Errors.widgetIpLimit(retryAfter);
    }
  }

  private async upsertSession(
    sessionId: string,
    siteId: string,
    ipAddress: string,
    userEmail?: string,
  ) {
    const ipHashSecret = process.env.IP_HASH_SECRET || 'default-secret';
    const ipHash = crypto
      .createHash('sha256')
      .update(ipAddress + ipHashSecret)
      .digest('hex');
    await this.sessionRepo.upsert({
      id: sessionId,
      siteId,
      ipAddressHash: ipHash,
      userEmail,
    });
  }

  private async incrementLimits(
    sessionId: string,
    siteId: string,
    ipAddress: string,
  ) {
    await this.rateLimitService.incrementSession(sessionId, siteId);
    await this.rateLimitService.incrementIp(ipAddress);
    await this.sessionRepo.incrementMessageCount(sessionId);
  }

  private async handleUnanswered(
    siteId: string,
    sessionId: string,
    userEmail: string | undefined,
    question: string,
    bestScore: number,
    ipAddress: string,
    startTime: number,
  ): Promise<IChatResult> {
    const unansweredQuestion = await this.unansweredRepo.create({
      siteId,
      sessionId,
      userEmail,
      question,
      bestMatchScore: bestScore,
      timestamp: new Date(),
    });

    await this.incrementLimits(sessionId, siteId, ipAddress);

    return {
      response:
        "I don't have enough information to answer this question. Would you like to leave your email so the team can help you?",
      responseTime: Date.now() - startTime,
      canProvideEmail: true,
      unansweredQuestionId: unansweredQuestion.id,
    };
  }
}
