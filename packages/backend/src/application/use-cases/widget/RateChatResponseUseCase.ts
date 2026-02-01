import { injectable, inject } from 'tsyringe';
import { Errors } from '@/domain/errors';
import type {
  IChatMessageRepository,
  IChatRatingRepository,
} from '@/domain/repositories';
import {
  widgetRatingRequestSchema,
  type IWidgetRatingRequest,
} from '@ai-onboarding/shared';

export interface IRateResponseOutput {
  success: boolean;
}

@injectable()
export class RateChatResponseUseCase {
  constructor(
    @inject('IChatMessageRepository')
    private chatMessageRepo: IChatMessageRepository,
    @inject('IChatRatingRepository')
    private chatRatingRepo: IChatRatingRepository
  ) {}

  async execute(
    siteId: string,
    input: IWidgetRatingRequest
  ): Promise<IRateResponseOutput> {
    // 1. Validate input (API key already validated in middleware)
    const validated = widgetRatingRequestSchema.parse(input);

    // 2. Find the message
    const message = await this.chatMessageRepo.findById(validated.messageId);
    if (!message) throw Errors.widgetMessageNotFound();

    // 3. Verify message belongs to the site
    if (message.siteId !== siteId) {
      throw Errors.widgetMessageNotFound();
    }

    // 4. Check if already rated
    const existingRating = await this.chatRatingRepo.findByMessageId(
      validated.messageId
    );
    if (existingRating) {
      // Already rated, return success
      return { success: true };
    }

    // 5. Create rating
    await this.chatRatingRepo.create({
      chatMessageId: validated.messageId,
      siteId: message.siteId,
      sessionId: message.sessionId,
      rating: validated.rating,
      feedback: validated.feedback,
    });

    return { success: true };
  }
}
