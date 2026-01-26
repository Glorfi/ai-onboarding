import { injectable, inject } from 'tsyringe';
import { IUserRepository } from '@/domain/repositories';
import { PasswordService } from '@/domain/services';
import { IUser, IUserPublic } from '@/domain/models';
import { Errors } from '@/domain/errors';
import { registerInputSchema, IRegisterInput } from '@ai-onboarding/shared';

export interface IRegisterUserOutput {
  user: IUserPublic;
}

@injectable()
export class RegisterUserUseCase {
  constructor(
    @inject('IUserRepository') private userRepo: IUserRepository,
    @inject('PasswordService') private passwordService: PasswordService
  ) {}

  async execute(input: IRegisterInput): Promise<IRegisterUserOutput> {
    const validated = registerInputSchema.parse(input);

    const existingUser = await this.userRepo.findByEmail(validated.email);
    if (existingUser) {
      throw Errors.emailAlreadyExists();
    }

    const passwordHash = await this.passwordService.hash(validated.password);

    const user = await this.userRepo.create({
      email: validated.email,
      passwordHash,
    });

    const { passwordHash: _, ...userPublic } = user;

    return { user: userPublic };
  }
}
