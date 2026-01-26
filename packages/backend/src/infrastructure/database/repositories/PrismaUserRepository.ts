import { injectable } from 'tsyringe';
import { IUserRepository } from '@/domain/repositories';
import { IUser, ICreateUserData, IUpdateUserData } from '@/domain/models';
import { prisma } from '../prisma';

@injectable()
export class PrismaUserRepository implements IUserRepository {
  async findById(id: string): Promise<IUser | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    return user;
  }

  async findByEmail(email: string): Promise<IUser | null> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    return user;
  }

  async create(data: ICreateUserData): Promise<IUser> {
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
      },
    });

    return user;
  }

  async update(id: string, data: IUpdateUserData): Promise<IUser> {
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(data.email && { email: data.email }),
        ...(data.passwordHash && { passwordHash: data.passwordHash }),
      },
    });

    return user;
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.user.delete({
        where: { id },
      });
      return true;
    } catch {
      return false;
    }
  }
}
