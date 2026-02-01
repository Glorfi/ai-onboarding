import { injectable } from 'tsyringe';
import { IApiKeyRepository } from '@/domain/repositories';
import { IApiKey, ICreateApiKeyData } from '@/domain/models';
import { prisma } from '../prisma';

@injectable()
export class PrismaApiKeyRepository implements IApiKeyRepository {
  async findByKey(key: string): Promise<IApiKey | null> {
    const apiKey = await prisma.apiKey.findUnique({
      where: { key },
    });

    return apiKey ? this.mapToEntity(apiKey) : null;
  }

  async findBySiteId(siteId: string): Promise<IApiKey | null> {
    const apiKey = await prisma.apiKey.findUnique({
      where: { siteId },
    });

    return apiKey ? this.mapToEntity(apiKey) : null;
  }

  async create(data: ICreateApiKeyData): Promise<IApiKey> {
    const apiKey = await prisma.apiKey.create({
      data: {
        siteId: data.siteId,
        key: data.key,
      },
    });

    return this.mapToEntity(apiKey);
  }

  async regenerate(siteId: string, newKey: string): Promise<IApiKey> {
    const apiKey = await prisma.apiKey.update({
      where: { siteId },
      data: {
        key: newKey,
        lastRegeneratedAt: new Date(),
      },
    });

    return this.mapToEntity(apiKey);
  }

  private mapToEntity(apiKey: any): IApiKey {
    return {
      ...apiKey,
      lastRegeneratedAt: apiKey.lastRegeneratedAt ?? undefined,
    };
  }
}
