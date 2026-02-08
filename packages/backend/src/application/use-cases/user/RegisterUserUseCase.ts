import { injectable, inject } from 'tsyringe';
import { IUserRepository } from '@/domain/repositories';
import { PasswordService } from '@/domain/services';
import { IUserPublic } from '@/domain/models';
import { Errors } from '@/domain/errors';

export interface IRegisterUseCaseInput {
  email: string;
  password: string;
}

export interface IRegisterUserOutput {
  user: IUserPublic;
}

@injectable()
export class RegisterUserUseCase {
  constructor(
    @inject('IUserRepository') private userRepo: IUserRepository,
    @inject('PasswordService') private passwordService: PasswordService
  ) {}

  async execute(input: IRegisterUseCaseInput): Promise<IRegisterUserOutput> {
    const existingUser = await this.userRepo.findByEmail(input.email);
    if (existingUser) {
      throw Errors.emailAlreadyExists();
    }

    const passwordHash = await this.passwordService.hash(input.password);

    const user = await this.userRepo.create({
      email: input.email,
      passwordHash,
    });

    const { passwordHash: _, ...userPublic } = user;

    return { user: userPublic };
  }
}
