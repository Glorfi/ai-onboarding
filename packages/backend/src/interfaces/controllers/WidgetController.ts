import type { Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import type { IWidgetRequest } from '@/infrastructure/http/middlewares';
import {
  ProcessChatMessageUseCase,
  SaveEmailForUnansweredUseCase,
  RateChatResponseUseCase,
} from '@/application/use-cases/widget';
import { Errors } from '@/domain/errors';
import {
  widgetChatRequestSchema,
  widgetEmailRequestSchema,
  widgetRatingRequestSchema,
} from '@ai-onboarding/shared';
import {
  toWidgetChatResponse,
  toWidgetSaveEmailResponse,
  toWidgetRatingResponse,
} from '@/interfaces/mappers';

export class WidgetController {
  static async chat(req: IWidgetRequest, res: Response, next: NextFunction) {
    try {
      const siteId = req.apiKey!.siteId;
      const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';

      const origin = req.headers.origin;
      if (!origin) {
        throw Errors.validation('Origin header is required');
      }
      const requestDomain = new URL(origin).hostname;

      const validated = widgetChatRequestSchema.parse(req.body);
      const useCase = container.resolve(ProcessChatMessageUseCase);
      const result = await useCase.execute(
        siteId,
        validated,
        ipAddress,
        requestDomain,
      );
      res.json(toWidgetChatResponse(result));
    } catch (error) {
      next(error);
    }
  }

  static async saveEmail(req: IWidgetRequest, res: Response, next: NextFunction) {
    try {
      const siteId = req.apiKey!.siteId;
      const validated = widgetEmailRequestSchema.parse(req.body);
      const useCase = container.resolve(SaveEmailForUnansweredUseCase);
      const result = await useCase.execute(siteId, validated);
      res.json(toWidgetSaveEmailResponse(result));
    } catch (error) {
      next(error);
    }
  }

  static async rateResponse(req: IWidgetRequest, res: Response, next: NextFunction) {
    try {
      const siteId = req.apiKey!.siteId;
      const validated = widgetRatingRequestSchema.parse(req.body);
      const useCase = container.resolve(RateChatResponseUseCase);
      const result = await useCase.execute(siteId, validated);
      res.json(toWidgetRatingResponse(result));
    } catch (error) {
      next(error);
    }
  }
}
