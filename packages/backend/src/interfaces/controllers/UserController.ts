import { Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import {
  RegisterUserUseCase,
  SignInUserUseCase,
} from '@/application/use-cases';
import { Errors, JwtService } from '@/domain';
import { RefreshUserTokenUseCase } from '@/application/use-cases/user/RefreshUserTokenUseCase';
import { GetCurrentUserUseCase } from '@/application/use-cases/user/GetCurrentUserUseCase';
import {
  registerInputSchema,
  signInInputSchema,
} from '@ai-onboarding/shared';
import {
  toUserDTO,
  toSignInResponse,
  toCurrentUserResponse,
} from '@/interfaces/mappers';

export class UserController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = registerInputSchema.parse(req.body);
      const useCase = container.resolve(RegisterUserUseCase);
      const { user } = await useCase.execute(validated);
      res.status(201).json(toUserDTO(user));
    } catch (error) {
      next(error);
    }
  }

  static async signIn(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = signInInputSchema.parse(req.body);
      const useCase = container.resolve(SignInUserUseCase);
      const jwtService = container.resolve(JwtService);
      const { user, accessToken, refreshToken } = await useCase.execute(validated);
      const cookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: 'none' as const,
      };

      res
        .status(200)
        .cookie('accessToken', accessToken, {
          ...cookieOptions,
          maxAge: jwtService.getTokenMaxAge('access'),
        })
        .cookie('refreshToken', refreshToken, {
          ...cookieOptions,
          maxAge: jwtService.getTokenMaxAge('refresh'),
        })
        .json(toSignInResponse(user, accessToken, refreshToken));
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies?.refreshToken;
      if (!refreshToken)
        throw Errors.unauthorized('Refresh Token is not provided');
      const useCase = container.resolve(RefreshUserTokenUseCase);
      const jwtService = container.resolve(JwtService);

      const cookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: 'none' as const,
      };

      const { refreshToken: newRefreshToken, accessToken } =
        await useCase.execute(refreshToken);
      res
        .status(200)
        .cookie('accessToken', accessToken, {
          ...cookieOptions,
          maxAge: jwtService.getTokenMaxAge('access'),
        })
        .cookie('refreshToken', newRefreshToken, {
          ...cookieOptions,
          maxAge: jwtService.getTokenMaxAge('refresh'),
        })
        .json({ refreshToken: newRefreshToken, accessToken });
    } catch (error) {
      next(error);
    }
  }

  static async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
      const accessToken = req.cookies?.accessToken;
      if (!accessToken) {
        throw Errors.unauthorized('Access Token is not provided');
      }
      const useCase = container.resolve(GetCurrentUserUseCase);
      const { user, userAccount } = await useCase.execute(accessToken);
      res.json(toCurrentUserResponse(user, userAccount));
    } catch (error) {
      next(error);
    }
  }
}
