import { injectable, inject } from 'tsyringe';
import {
  IOAuthAccountRepository,
  IUserRepository,
} from '@/domain/repositories';

import { IUserPublic } from '@/domain/models';
import { Errors, JwtService } from '@/domain';
import { IOAuthAccount } from '@ai-onboarding/shared';

export interface GetCurrentUserOutput {
  user: IUserPublic;
  userAccount: IOAuthAccount;
}

@injectable()
export class GetCurrentUserUseCase {
  constructor(
    @inject('IUserRepository') private userRepo: IUserRepository,
    @inject('IOAuthAccountRepository')
    private oauthAccountRepo: IOAuthAccountRepository,
    @inject(JwtService) private jwtService: JwtService,
  ) {}

  async execute(token: string): Promise<GetCurrentUserOutput> {
    const payload = await this.jwtService.verifyAccessToken(token);
    const user = await this.userRepo.findById(payload.userId);
    if (!user) {
      throw Errors.notFound('User not found');
    }
    const accounts = await this.oauthAccountRepo.findByUserId(user.id);
    if (!accounts) {
      throw Errors.notFound('The user used some other shit instead of OAUTH');
    }

    const { passwordHash, ...publicUser } = user;
    return { userAccount: accounts[0], user: publicUser };
  }
}
