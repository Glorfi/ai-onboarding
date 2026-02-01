import { injectable } from 'tsyringe';
import { IChatRatingRepository } from '@/domain/repositories';
import { IChatRating, ICreateChatRatingData, RatingType } from '@/domain/models';
import { prisma } from '../prisma';

type PrismaChatRating = {
  id: string;
  chatMessageId: string;
  siteId: string;
  sessionId: string;
  rating: RatingType;
  feedback: string | null;
  createdAt: Date;
};

function mapRating(rating: PrismaChatRating): IChatRating {
  return {
    ...rating,
    feedback: rating.feedback ?? undefined,
  };
}

@injectable()
export class PrismaChatRatingRepository implements IChatRatingRepository {
  async findById(id: string): Promise<IChatRating | null> {
    const rating = await prisma.chatRating.findUnique({
      where: { id },
    });

    return rating ? mapRating(rating) : null;
  }

  async findByMessageId(messageId: string): Promise<IChatRating | null> {
    const rating = await prisma.chatRating.findUnique({
      where: { chatMessageId: messageId },
    });

    return rating ? mapRating(rating) : null;
  }

  async findBySiteId(siteId: string): Promise<IChatRating[]> {
    const ratings = await prisma.chatRating.findMany({
      where: { siteId },
      orderBy: { createdAt: 'desc' },
    });

    return ratings.map(mapRating);
  }

  async create(data: ICreateChatRatingData): Promise<IChatRating> {
    const rating = await prisma.chatRating.create({
      data,
    });

    return mapRating(rating);
  }
}
