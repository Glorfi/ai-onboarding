import { Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import {
  RegisterUserUseCase,
  SignInUserUseCase,
} from '@/application/use-cases';
import { Errors, JwtService } from '@/domain';
import { RefreshUserTokenUseCase } from '@/application/use-cases/user/RefreshUserTokenUseCase';

export class UserController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const useCase = container.resolve(RegisterUserUseCase);

      const result = await useCase.execute(req.body);

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async signIn(req: Request, res: Response, next: NextFunction) {
    try {
      const useCase = container.resolve(SignInUserUseCase);
      const jwtService = container.resolve(JwtService);
      const result = await useCase.execute(req.body);
      const { accessToken, refreshToken } = result;
      const cookieOptions = {
        httpOnly: true,
        secure: true, // включать только в продакшене
        sameSite: 'none' as const, // если фронт на другом домене
      };

      res
        .status(200)
        .cookie('accessToken', accessToken, {
          ...cookieOptions,
          maxAge: jwtService.getTokenMaxAge('access'), // 1 день
        })
        .cookie('refreshToken', refreshToken, {
          ...cookieOptions,
          maxAge: jwtService.getTokenMaxAge('refresh'), // 7 дней
        })
        .json(result);
    } catch (error) {
      next(error);
    }
  }
  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) throw Errors.forbidden('Refresh Token is not provided');
    const useCase = container.resolve(RefreshUserTokenUseCase);
    const jwtService = container.resolve(JwtService);

    const cookieOptions = {
      httpOnly: true,
      secure: true, // включать только в продакшене
      sameSite: 'none' as const, // если фронт на другом домене
    };

    const { refreshToken: newRefreshToken, accessToken } =
      await useCase.execute(refreshToken);
    res
      .status(200)
      .cookie('accessToken', accessToken, {
        ...cookieOptions,
        maxAge: jwtService.getTokenMaxAge('access'), // 1 день
      })
      .cookie('refreshToken', newRefreshToken, {
        ...cookieOptions,
        maxAge: jwtService.getTokenMaxAge('refresh'), // 7 дней
      })
      .json({ refreshToken: newRefreshToken, accessToken });
  }
}
