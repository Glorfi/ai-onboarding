import { injectable } from 'tsyringe';
import { ISiteRepository } from '@/domain/repositories';
import { ISite, ICreateSiteData, IUpdateSiteData, SiteStatus } from '@/domain/models';
import { prisma } from '../prisma';

type PrismaSite = {
  id: string;
  userId: string;
  url: string;
  domain: string;
  name: string | null;
  status: SiteStatus;
  triggerDelaySeconds: number;
  additionalUrls: string[];
  lastCrawledAt: Date | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function mapSite(site: PrismaSite): ISite {
  return {
    ...site,
    name: site.name ?? undefined,
    lastCrawledAt: site.lastCrawledAt ?? undefined,
    errorMessage: site.errorMessage ?? undefined,
  };
}

@injectable()
export class PrismaSiteRepository implements ISiteRepository {
  async findById(id: string): Promise<ISite | null> {
    const site = await prisma.site.findUnique({
      where: { id },
    });

    return site ? mapSite(site) : null;
  }

  async findByUserId(userId: string): Promise<ISite[]> {
    const sites = await prisma.site.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return sites.map(mapSite);
  }

  async findByDomain(domain: string): Promise<ISite | null> {
    const site = await prisma.site.findFirst({
      where: { domain },
    });

    return site ? mapSite(site) : null;
  }

  async create(data: ICreateSiteData): Promise<ISite> {
    const site = await prisma.site.create({
      data: {
        userId: data.userId,
        url: data.url,
        domain: data.domain,
        name: data.name,
        additionalUrls: data.additionalUrls || [],
        triggerDelaySeconds: data.triggerDelaySeconds,
      },
    });

    return mapSite(site);
  }

  async update(id: string, data: IUpdateSiteData): Promise<ISite> {
    const site = await prisma.site.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.triggerDelaySeconds !== undefined && {
          triggerDelaySeconds: data.triggerDelaySeconds,
        }),
        ...(data.lastCrawledAt !== undefined && {
          lastCrawledAt: data.lastCrawledAt,
        }),
        ...(data.errorMessage !== undefined && {
          errorMessage: data.errorMessage,
        }),
      },
    });

    return mapSite(site);
  }

  async updateStatus(
    id: string,
    status: SiteStatus,
    errorMessage?: string
  ): Promise<ISite> {
    const site = await prisma.site.update({
      where: { id },
      data: {
        status,
        errorMessage: errorMessage || null,
        ...(status === 'active' && { lastCrawledAt: new Date() }),
      },
    });

    return mapSite(site);
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.site.delete({
        where: { id },
      });
      return true;
    } catch {
      return false;
    }
  }
}
