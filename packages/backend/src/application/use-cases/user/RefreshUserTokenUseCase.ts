import { injectable, inject } from 'tsyringe';
import { IUserRepository } from '@/domain/repositories';
import { JwtService, PasswordService } from '@/domain/services';
import { IUser, IUserPublic } from '@/domain/models';
import { Errors } from '@/domain/errors';
import { registerInputSchema, IRegisterInput } from '@ai-onboarding/shared';

export interface IRefreshOutput {
  accessToken: string;
  refreshToken: string;
}

@injectable()
export class RefreshUserTokenUseCase {
  constructor(
    @inject('IUserRepository') private userRepo: IUserRepository,
    @inject('JwtService') private jwtService: JwtService,
  ) {}

  async execute(input: string): Promise<IRefreshOutput> {
    const payload = this.jwtService.verifyRefreshToken(input);
    if (!payload) throw Errors.forbidden('Invalid Refresh Token');

    const user = await this.userRepo.findById(payload.userId);
    if (!user) throw Errors.notFound('User not found');

    const accessToken = this.jwtService.generateAccessToken(user.id);
    const refreshToken = this.jwtService.generateRefreshToken(user.id);
    return { accessToken, refreshToken };
  }
}
