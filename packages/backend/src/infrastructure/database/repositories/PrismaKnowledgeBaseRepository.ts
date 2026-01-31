import { injectable } from 'tsyringe';
import { IKnowledgeBaseRepository } from '@/domain/repositories';
import { IKnowledgeBase, ICreateKnowledgeBaseData } from '@/domain/models';
import { prisma } from '../prisma';

@injectable()
export class PrismaKnowledgeBaseRepository implements IKnowledgeBaseRepository {
  async findById(id: string): Promise<IKnowledgeBase | null> {
    const kb = await prisma.knowledgeBase.findUnique({
      where: { id },
    });

    return kb;
  }

  async findBySiteId(siteId: string): Promise<IKnowledgeBase[]> {
    const kbs = await prisma.knowledgeBase.findMany({
      where: { siteId },
      orderBy: { createdAt: 'asc' },
    });

    return kbs;
  }

  async findByVectorIds(vectorIds: string[]): Promise<IKnowledgeBase[]> {
    const kbs = await prisma.knowledgeBase.findMany({
      where: {
        vectorId: { in: vectorIds },
      },
    });

    return kbs;
  }

  async create(data: ICreateKnowledgeBaseData): Promise<IKnowledgeBase> {
    const kb = await prisma.knowledgeBase.create({
      data: {
        siteId: data.siteId,
        pageUrl: data.pageUrl,
        content: data.content,
        vectorId: data.vectorId,
      },
    });

    return kb;
  }

  async createMany(data: ICreateKnowledgeBaseData[]): Promise<number> {
    const result = await prisma.knowledgeBase.createMany({
      data: data.map((d) => ({
        siteId: d.siteId,
        pageUrl: d.pageUrl,
        content: d.content,
        vectorId: d.vectorId,
      })),
    });

    return result.count;
  }

  async deleteBySiteId(siteId: string): Promise<number> {
    const result = await prisma.knowledgeBase.deleteMany({
      where: { siteId },
    });

    return result.count;
  }
}
