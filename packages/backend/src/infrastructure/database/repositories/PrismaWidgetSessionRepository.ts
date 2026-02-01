import { injectable } from 'tsyringe';
import { IWidgetSessionRepository } from '@/domain/repositories';
import {
  IWidgetSession,
  ICreateWidgetSessionData,
  IUpdateWidgetSessionData,
} from '@/domain/models';
import { prisma } from '../prisma';

type PrismaWidgetSession = {
  id: string;
  siteId: string;
  ipAddressHash: string;
  userEmail: string | null;
  messagesCount: number;
  firstSeenAt: Date;
  lastSeenAt: Date;
};

function mapSession(session: PrismaWidgetSession): IWidgetSession {
  return {
    ...session,
    userEmail: session.userEmail ?? undefined,
  };
}

@injectable()
export class PrismaWidgetSessionRepository implements IWidgetSessionRepository {
  async findById(id: string): Promise<IWidgetSession | null> {
    const session = await prisma.widgetSession.findUnique({
      where: { id },
    });

    return session ? mapSession(session) : null;
  }

  async findBySiteId(siteId: string): Promise<IWidgetSession[]> {
    const sessions = await prisma.widgetSession.findMany({
      where: { siteId },
      orderBy: { lastSeenAt: 'desc' },
    });

    return sessions.map(mapSession);
  }

  async create(data: ICreateWidgetSessionData): Promise<IWidgetSession> {
    const session = await prisma.widgetSession.create({
      data: {
        id: data.id,
        siteId: data.siteId,
        ipAddressHash: data.ipAddressHash,
        userEmail: data.userEmail,
      },
    });

    return mapSession(session);
  }

  async update(
    id: string,
    data: IUpdateWidgetSessionData
  ): Promise<IWidgetSession> {
    const session = await prisma.widgetSession.update({
      where: { id },
      data: {
        ...(data.userEmail !== undefined && { userEmail: data.userEmail }),
        ...(data.messagesCount !== undefined && {
          messagesCount: data.messagesCount,
        }),
        ...(data.lastSeenAt !== undefined && { lastSeenAt: data.lastSeenAt }),
      },
    });

    return mapSession(session);
  }

  async upsert(data: ICreateWidgetSessionData): Promise<IWidgetSession> {
    const session = await prisma.widgetSession.upsert({
      where: { id: data.id },
      create: {
        id: data.id,
        siteId: data.siteId,
        ipAddressHash: data.ipAddressHash,
        userEmail: data.userEmail,
      },
      update: {
        lastSeenAt: new Date(),
        ...(data.userEmail && { userEmail: data.userEmail }),
      },
    });

    return mapSession(session);
  }

  async incrementMessageCount(id: string): Promise<IWidgetSession> {
    const session = await prisma.widgetSession.update({
      where: { id },
      data: {
        messagesCount: { increment: 1 },
        lastSeenAt: new Date(),
      },
    });

    return mapSession(session);
  }
}
