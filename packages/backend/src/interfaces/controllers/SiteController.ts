import { Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import { IAuthRequest } from '@/infrastructure/http/middlewares/authMiddleware';
import {
  CreateSiteUseCase,
  GetCrawlStatusUseCase,
  RecrawlSiteUseCase,
  GetUserSitesUseCase,
  GetSiteApiKeyUseCase,
  DeleteSiteUseCase,
} from '@/application/use-cases/site';
import { createSiteInputSchema } from '@ai-onboarding/shared';
import {
  toSiteWithApiKeyDTO,
  toCrawlStatusResponse,
} from '@/interfaces/mappers';
import type {
  ICreateSiteResponse,
  IGetUserSitesResponse,
  ICrawlStatusResponse,
} from '@ai-onboarding/shared';

export class SiteController {
  static async create(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const validated = createSiteInputSchema.parse(req.body);
      const useCase = container.resolve(CreateSiteUseCase);
      const { site, apiKey } = await useCase.execute(userId, validated);
      const response: ICreateSiteResponse = {
        site: toSiteWithApiKeyDTO(site, apiKey),
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async getUserSites(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const sitesUseCase = container.resolve(GetUserSitesUseCase);
      const apiKeyUseCase = container.resolve(GetSiteApiKeyUseCase);

      const { sites } = await sitesUseCase.execute(userId);
      const sitesWithKeys = await Promise.all(
        sites.map(async (site) => {
          const { apiKey } = await apiKeyUseCase.execute(site.id);
          return toSiteWithApiKeyDTO(site, apiKey);
        }),
      );

      const response: IGetUserSitesResponse = { sites: sitesWithKeys };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  static async getCrawlStatus(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const siteId = req.params.id as string;
      const useCase = container.resolve(GetCrawlStatusUseCase);
      const { site, progress } = await useCase.execute(userId, siteId);
      const response: ICrawlStatusResponse = toCrawlStatusResponse(site, progress);
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  static async recrawl(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const siteId = req.params.id as string;
      const useCase = container.resolve(RecrawlSiteUseCase);
      await useCase.execute(userId, siteId);
      res.status(202).json({ message: 'Recrawl started' });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const siteId = req.params.id as string;
      const useCase = container.resolve(DeleteSiteUseCase);
      await useCase.execute(userId, siteId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
