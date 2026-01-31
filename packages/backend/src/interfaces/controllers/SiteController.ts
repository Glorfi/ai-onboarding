import { Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import { IAuthRequest } from '@/infrastructure/http/middlewares/authMiddleware';
import {
  CreateSiteUseCase,
  GetCrawlStatusUseCase,
  RecrawlSiteUseCase,
  GetUserSitesUseCase,
  DeleteSiteUseCase,
} from '@/application/use-cases/site';

export class SiteController {
  static async create(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const useCase = container.resolve(CreateSiteUseCase);
      const result = await useCase.execute(userId, req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getUserSites(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const useCase = container.resolve(GetUserSitesUseCase);
      const result = await useCase.execute(userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getCrawlStatus(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const siteId = req.params.id as string;
      const useCase = container.resolve(GetCrawlStatusUseCase);
      const result = await useCase.execute(userId, siteId);
      res.json(result);
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
