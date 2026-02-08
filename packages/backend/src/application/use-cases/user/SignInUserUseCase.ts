import { injectable, inject } from 'tsyringe';
import { IUserRepository } from '@/domain/repositories';
import { PasswordService, JwtService } from '@/domain/services';
import { IUserPublic } from '@/domain/models';
import { Errors } from '@/domain/errors';

export interface ISignInUseCaseInput {
  email: string;
  password: string;
}

export interface ISignInUserOutput {
  user: IUserPublic;
  accessToken: string;
  refreshToken: string;
}

@injectable()
export class SignInUserUseCase {
  constructor(
    @inject('IUserRepository') private userRepo: IUserRepository,
    @inject('PasswordService') private passwordService: PasswordService,
    @inject('JwtService') private jwtService: JwtService,
  ) {}

  async execute(input: ISignInUseCaseInput): Promise<ISignInUserOutput> {
    const user = await this.userRepo.findByEmail(input.email);
    if (!user || !user.passwordHash) {
      throw Errors.invalidCredentials();
    }

    const isValidPassword = await this.passwordService.compare(
      input.password,
      user.passwordHash,
    );
    if (!isValidPassword) {
      throw Errors.invalidCredentials();
    }

    const accessToken = this.jwtService.generateAccessToken(user.id);
    const refreshToken = this.jwtService.generateRefreshToken(user.id);

    const { passwordHash: _, ...userPublic } = user;

    return { user: userPublic, accessToken, refreshToken };
  }
}
