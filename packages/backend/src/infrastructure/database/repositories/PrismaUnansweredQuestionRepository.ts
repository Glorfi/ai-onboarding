import { injectable } from 'tsyringe';
import { IUnansweredQuestionRepository } from '@/domain/repositories';
import {
  IUnansweredQuestion,
  ICreateUnansweredQuestionData,
  IUpdateUnansweredQuestionData,
  UnansweredQuestionStatus,
} from '@/domain/models';
import { prisma } from '../prisma';
import type { UnansweredQuestion as PrismaUnansweredQuestion } from '../generated/client';

function mapQuestion(question: PrismaUnansweredQuestion): IUnansweredQuestion {
  return {
    ...question,
    bestMatchScore: Number(question.bestMatchScore),
    userEmail: question.userEmail ?? undefined,
    contactedAt: question.contactedAt ?? undefined,
    resolvedAt: question.resolvedAt ?? undefined,
  };
}

@injectable()
export class PrismaUnansweredQuestionRepository
  implements IUnansweredQuestionRepository
{
  async findById(id: string): Promise<IUnansweredQuestion | null> {
    const question = await prisma.unansweredQuestion.findUnique({
      where: { id },
    });

    return question ? mapQuestion(question) : null;
  }

  async findBySiteId(
    siteId: string,
    status?: UnansweredQuestionStatus
  ): Promise<IUnansweredQuestion[]> {
    const questions = await prisma.unansweredQuestion.findMany({
      where: {
        siteId,
        ...(status && { status }),
      },
      orderBy: { createdAt: 'desc' },
    });

    return questions.map(mapQuestion);
  }

  async create(
    data: ICreateUnansweredQuestionData
  ): Promise<IUnansweredQuestion> {
    const question = await prisma.unansweredQuestion.create({
      data: {
        siteId: data.siteId,
        sessionId: data.sessionId,
        userEmail: data.userEmail,
        question: data.question,
        bestMatchScore: data.bestMatchScore,
        timestamp: data.timestamp,
      },
    });

    return mapQuestion(question);
  }

  async update(
    id: string,
    data: IUpdateUnansweredQuestionData
  ): Promise<IUnansweredQuestion> {
    const question = await prisma.unansweredQuestion.update({
      where: { id },
      data: {
        ...(data.userEmail !== undefined && { userEmail: data.userEmail }),
        ...(data.status !== undefined && {
          status: data.status,
          ...(data.status === 'contacted' && { contactedAt: new Date() }),
          ...(data.status === 'resolved' && { resolvedAt: new Date() }),
        }),
      },
    });

    return mapQuestion(question);
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.unansweredQuestion.delete({
        where: { id },
      });
      return true;
    } catch {
      return false;
    }
  }
}
