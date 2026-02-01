import type { Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import type { IWidgetRequest } from '@/infrastructure/http/middlewares';
import {
  ProcessChatMessageUseCase,
  SaveEmailForUnansweredUseCase,
  RateChatResponseUseCase,
} from '@/application/use-cases/widget';
import { Errors } from '@/domain/errors';

export class WidgetController {
  static async chat(req: IWidgetRequest, res: Response, next: NextFunction) {
    try {
      const siteId = req.apiKey!.siteId;
      const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';

      // Extract domain from Origin header (required for domain validation)
      const origin = req.headers.origin;
      if (!origin) {
        throw Errors.validation('Origin header is required');
      }
      const requestDomain = new URL(origin).hostname;

      const useCase = container.resolve(ProcessChatMessageUseCase);
      const result = await useCase.execute(
        siteId,
        req.body,
        ipAddress,
        requestDomain
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async saveEmail(req: IWidgetRequest, res: Response, next: NextFunction) {
    try {
      const siteId = req.apiKey!.siteId;

      const useCase = container.resolve(SaveEmailForUnansweredUseCase);
      const result = await useCase.execute(siteId, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async rateResponse(req: IWidgetRequest, res: Response, next: NextFunction) {
    try {
      const siteId = req.apiKey!.siteId;

      const useCase = container.resolve(RateChatResponseUseCase);
      const result = await useCase.execute(siteId, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
