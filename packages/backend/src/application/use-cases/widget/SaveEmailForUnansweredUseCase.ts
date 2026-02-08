import { injectable, inject } from 'tsyringe';
import { Errors } from '@/domain/errors';
import type { IUnansweredQuestionRepository } from '@/domain/repositories';
import type { ISaveEmailOutput } from '@/interfaces/mappers/widgetMapper';

export interface ISaveEmailInput {
  questionId: string;
  email: string;
}

@injectable()
export class SaveEmailForUnansweredUseCase {
  constructor(
    @inject('IUnansweredQuestionRepository')
    private unansweredRepo: IUnansweredQuestionRepository
  ) {}

  async execute(
    siteId: string,
    input: ISaveEmailInput
  ): Promise<ISaveEmailOutput> {
    // 1. Find the question
    const question = await this.unansweredRepo.findById(input.questionId);
    if (!question) throw Errors.widgetQuestionNotFound();

    // 2. Verify question belongs to the site
    if (question.siteId !== siteId) {
      throw Errors.widgetQuestionNotFound();
    }

    // 3. Update with email
    await this.unansweredRepo.update(input.questionId, {
      userEmail: input.email,
    });

    return {
      success: true,
      message: 'Thank you! The team will reach out to you soon.',
    };
  }
}
