import { injectable, inject } from 'tsyringe';
import { Errors } from '@/domain/errors';
import type {
  IChatMessageRepository,
  IChatRatingRepository,
} from '@/domain/repositories';
import type { RatingType } from '@/domain/models';
import type { IRateResponseOutput } from '@/interfaces/mappers/widgetMapper';

export interface IRateResponseInput {
  messageId: string;
  rating: RatingType;
  feedback?: string;
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
    input: IRateResponseInput
  ): Promise<IRateResponseOutput> {
    // 1. Find the message
    const message = await this.chatMessageRepo.findById(input.messageId);
    if (!message) throw Errors.widgetMessageNotFound();

    // 2. Verify message belongs to the site
    if (message.siteId !== siteId) {
      throw Errors.widgetMessageNotFound();
    }

    // 3. Check if already rated
    const existingRating = await this.chatRatingRepo.findByMessageId(
      input.messageId
    );
    if (existingRating) {
      // Already rated, return success
      return { success: true };
    }

    // 4. Create rating
    await this.chatRatingRepo.create({
      chatMessageId: input.messageId,
      siteId: message.siteId,
      sessionId: message.sessionId,
      rating: input.rating,
      feedback: input.feedback,
    });

    return { success: true };
  }
}
