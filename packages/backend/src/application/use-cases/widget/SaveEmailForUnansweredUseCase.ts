import { injectable, inject } from 'tsyringe';
import { Errors } from '@/domain/errors';
import type { IUnansweredQuestionRepository } from '@/domain/repositories';
import {
  widgetEmailRequestSchema,
  type IWidgetEmailRequest,
} from '@ai-onboarding/shared';

export interface ISaveEmailOutput {
  success: boolean;
  message: string;
}

@injectable()
export class SaveEmailForUnansweredUseCase {
  constructor(
    @inject('IUnansweredQuestionRepository')
    private unansweredRepo: IUnansweredQuestionRepository
  ) {}

  async execute(
    siteId: string,
    input: IWidgetEmailRequest
  ): Promise<ISaveEmailOutput> {
    // 1. Validate input (API key already validated in middleware)
    const validated = widgetEmailRequestSchema.parse(input);

    // 2. Find the question
    const question = await this.unansweredRepo.findById(validated.questionId);
    if (!question) throw Errors.widgetQuestionNotFound();

    // 3. Verify question belongs to the site
    if (question.siteId !== siteId) {
      throw Errors.widgetQuestionNotFound();
    }

    // 4. Update with email
    await this.unansweredRepo.update(validated.questionId, {
      userEmail: validated.email,
    });

    return {
      success: true,
      message: 'Thank you! The team will reach out to you soon.',
    };
  }
}
