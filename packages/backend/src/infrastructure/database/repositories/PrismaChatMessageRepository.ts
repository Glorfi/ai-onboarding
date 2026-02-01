import { injectable } from 'tsyringe';
import { IChatMessageRepository } from '@/domain/repositories';
import { IChatMessage, ICreateChatMessageData } from '@/domain/models';
import { prisma } from '../prisma';

@injectable()
export class PrismaChatMessageRepository implements IChatMessageRepository {
  async findById(id: string): Promise<IChatMessage | null> {
    const message = await prisma.chatMessage.findUnique({
      where: { id },
    });

    return message;
  }

  async findBySiteId(
    siteId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<IChatMessage[]> {
    const messages = await prisma.chatMessage.findMany({
      where: { siteId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return messages;
  }

  async findBySessionId(sessionId: string): Promise<IChatMessage[]> {
    const messages = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });

    return messages;
  }

  async create(data: ICreateChatMessageData): Promise<IChatMessage> {
    const message = await prisma.chatMessage.create({
      data,
    });

    return message;
  }

  async countBySiteId(siteId: string): Promise<number> {
    const count = await prisma.chatMessage.count({
      where: { siteId },
    });

    return count;
  }
}
