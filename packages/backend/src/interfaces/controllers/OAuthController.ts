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
import { OAuthStateService } from '@/infrastructure/oauth/OAuthStateService';
import { OAuthProvider } from '@/domain/models';
import { IAuthRequest } from '@/infrastructure/http/middlewares/authMiddleware';

function parseProvider(provider: string): OAuthProvider {
  const lower = provider.toLowerCase();
  if (Object.values(OAuthProvider).includes(lower as OAuthProvider)) {
    return lower as OAuthProvider;
  }
  throw new Error(`Invalid provider: ${provider}`);
}

// Track OAuth codes being processed (prevents duplicate requests)
const processingCodes = new Set<string>();
const CODE_CACHE_TTL = 60000; // 1 minute

export class OAuthController {
  static async getAuthUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const providerParam = req.params.provider as string;
      const provider = parseProvider(providerParam);
      const redirectUriQuery = req.query.redirect_uri;
      const redirectUri =
        (typeof redirectUriQuery === 'string' ? redirectUriQuery : undefined) ||
        `${process.env.API_URL}/api/auth/oauth/${providerParam}/callback`;

      const stateService = container.resolve(OAuthStateService);
      const state = stateService.generateState(provider);

      const useCase = container.resolve(GetOAuthUrlUseCase);
      const result = useCase.execute({ provider, redirectUri, state });

      // If redirect=true query param, redirect directly instead of returning JSON
      if (req.query.redirect === 'true') {
        return res.redirect(result.authorizationUrl);
      }

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
            String(error),
          )}`,
        );
      }

      const codeStr = code as string;

      // Check if this code is already being processed (duplicate request)
      if (processingCodes.has(codeStr)) {
        console.log('[OAuth Callback] Duplicate request detected, redirecting to success page...');
        // Don't wait - just redirect to success page immediately
        // The first request will set cookies, this is just to handle browser's duplicate navigation
        const frontendUrl = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
        return res.redirect(`${frontendUrl}/auth/success`);
      }

      const stateService = container.resolve(OAuthStateService);
      const validation = stateService.validateState(state as string, provider);

      if (!validation.valid) {
        return res.redirect(
          `${process.env.FRONTEND_URL}/auth/error?error=${encodeURIComponent(
            validation.error || 'Invalid OAuth state',
          )}`,
        );
      }

      // Mark code as being processed
      processingCodes.add(codeStr);

      // Cleanup after TTL
      setTimeout(() => {
        processingCodes.delete(codeStr);
      }, CODE_CACHE_TTL);

      const redirectUri = `${process.env.API_URL}/api/auth/oauth/${providerParam}/callback`;
      const useCase = container.resolve(OAuthSignInUseCase);
      const jwtService = container.resolve(JwtService);

      const result = await useCase.execute({
        provider,
        code: codeStr,
        redirectUri,
      });

      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
      };

      res.cookie('accessToken', result.accessToken, {
        ...cookieOptions,
        maxAge: jwtService.getTokenMaxAge('access'),
      });
      res.cookie('refreshToken', result.refreshToken, {
        ...cookieOptions,
        maxAge: jwtService.getTokenMaxAge('refresh'),
      });

      const frontendUrl = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
      res.redirect(`${frontendUrl}/auth/success?isNewUser=${result.isNewUser}`);
    } catch (error) {
      next(error);
    }
  }

  static async linkAccount(
    req: IAuthRequest,
    res: Response,
    next: NextFunction,
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
    next: NextFunction,
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
    next: NextFunction,
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
