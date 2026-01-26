import { Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import {
  GetOAuthUrlUseCase,
  OAuthSignInUseCase,
  LinkOAuthAccountUseCase,
  UnlinkOAuthAccountUseCase,
  GetLinkedAccountsUseCase,
} from '@/application/use-cases/oauth';
import { JwtService } from '@/domain/services';
import { OAuthProvider } from '@ai-onboarding/shared';
import { IAuthRequest } from '@/infrastructure/http/middlewares/authMiddleware';

function parseProvider(provider: string): OAuthProvider {
  const upper = provider.toUpperCase();
  if (Object.values(OAuthProvider).includes(upper as OAuthProvider)) {
    return upper as OAuthProvider;
  }
  throw new Error(`Invalid provider: ${provider}`);
}

export class OAuthController {
  static async getAuthUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const providerParam = req.params.provider as string;
      const provider = parseProvider(providerParam);
      const redirectUriQuery = req.query.redirect_uri;
      const redirectUri =
        (typeof redirectUriQuery === 'string' ? redirectUriQuery : undefined) ||
        `${process.env.API_URL}/api/auth/oauth/${providerParam}/callback`;

      const useCase = container.resolve(GetOAuthUrlUseCase);
      const result = useCase.execute({ provider, redirectUri });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async handleCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const providerParam = req.params.provider as string;
      const provider = parseProvider(providerParam);
      const { code, state, error } = req.query;

      if (error) {
        return res.redirect(
          `${process.env.FRONTEND_URL}/auth/error?error=${encodeURIComponent(
            String(error)
          )}`
        );
      }

      const redirectUri = `${process.env.API_URL}/api/auth/oauth/${providerParam}/callback`;

      const useCase = container.resolve(OAuthSignInUseCase);
      const jwtService = container.resolve(JwtService);

      const result = await useCase.execute({
        provider,
        code: code as string,
        state: state as string,
        redirectUri,
      });

      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
      };

      res
        .cookie('accessToken', result.accessToken, {
          ...cookieOptions,
          maxAge: jwtService.getTokenMaxAge('access'),
        })
        .cookie('refreshToken', result.refreshToken, {
          ...cookieOptions,
          maxAge: jwtService.getTokenMaxAge('refresh'),
        })
        .redirect(
          `${process.env.FRONTEND_URL}/auth/success?isNewUser=${result.isNewUser}`
        );
    } catch (error) {
      next(error);
    }
  }

  static async linkAccount(
    req: IAuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const provider = parseProvider(req.params.provider as string);
      const { code, redirectUri } = req.body;
      const userId = req.userId!;

      const useCase = container.resolve(LinkOAuthAccountUseCase);
      const result = await useCase.execute({
        userId,
        provider,
        code,
        redirectUri,
      });

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async unlinkAccount(
    req: IAuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const provider = parseProvider(req.params.provider as string);
      const userId = req.userId!;

      const useCase = container.resolve(UnlinkOAuthAccountUseCase);
      await useCase.execute({ userId, provider });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  static async getLinkedAccounts(
    req: IAuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.userId!;

      const useCase = container.resolve(GetLinkedAccountsUseCase);
      const result = await useCase.execute(userId);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
