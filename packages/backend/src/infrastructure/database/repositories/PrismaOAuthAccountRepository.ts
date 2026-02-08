import { injectable } from 'tsyringe';
import { IOAuthAccountRepository } from '@/domain/repositories';
import {
  IOAuthAccount,
  ICreateOAuthAccountData,
  IUpdateOAuthAccountData,
  OAuthProvider,
} from '@/domain/models';
import { prisma } from '../prisma';

@injectable()
export class PrismaOAuthAccountRepository implements IOAuthAccountRepository {
  async findById(id: string): Promise<IOAuthAccount | null> {
    const account = await prisma.oAuthAccount.findUnique({
      where: { id },
    });

    return account ? this.mapToEntity(account) : null;
  }

  async findByProviderAndAccountId(
    provider: OAuthProvider,
    providerAccountId: string
  ): Promise<IOAuthAccount | null> {
    const account = await prisma.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: provider.toLowerCase() as any,
          providerAccountId,
        },
      },
    });

    return account ? this.mapToEntity(account) : null;
  }

  async findByUserId(userId: string): Promise<IOAuthAccount[]> {
    const accounts = await prisma.oAuthAccount.findMany({
      where: { userId },
    });

    return accounts.map(this.mapToEntity);
  }

  async findByUserIdAndProvider(
    userId: string,
    provider: OAuthProvider
  ): Promise<IOAuthAccount | null> {
    const account = await prisma.oAuthAccount.findFirst({
      where: {
        userId,
        provider: provider.toLowerCase() as any,
      },
    });

    return account ? this.mapToEntity(account) : null;
  }

  async create(data: ICreateOAuthAccountData): Promise<IOAuthAccount> {
    const account = await prisma.oAuthAccount.create({
      data: {
        userId: data.userId,
        provider: data.provider.toLowerCase() as any,
        providerAccountId: data.providerAccountId,
        email: data.email ?? null,
        displayName: data.displayName ?? null,
        avatarUrl: data.avatarUrl ?? null,
      },
    });

    return this.mapToEntity(account);
  }

  async update(
    id: string,
    data: IUpdateOAuthAccountData
  ): Promise<IOAuthAccount> {
    const account = await prisma.oAuthAccount.update({
      where: { id },
      data: {
        ...(data.email !== undefined && { email: data.email }),
        ...(data.displayName !== undefined && { displayName: data.displayName }),
        ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
      },
    });

    return this.mapToEntity(account);
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.oAuthAccount.delete({
        where: { id },
      });
      return true;
    } catch {
      return false;
    }
  }

  async deleteByUserIdAndProvider(
    userId: string,
    provider: OAuthProvider
  ): Promise<boolean> {
    try {
      const result = await prisma.oAuthAccount.deleteMany({
        where: {
          userId,
          provider: provider.toLowerCase() as any,
        },
      });
      return result.count > 0;
    } catch {
      return false;
    }
  }

  private mapToEntity(account: any): IOAuthAccount {
    return {
      id: account.id,
      userId: account.userId,
      provider: account.provider.toUpperCase() as OAuthProvider,
      providerAccountId: account.providerAccountId,
      email: account.email,
      displayName: account.displayName,
      avatarUrl: account.avatarUrl,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  }
}
