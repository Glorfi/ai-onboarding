import type { Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';

import type { IApiKeyRepository } from '@/domain/repositories';
import { Errors } from '@/domain/errors';
import { IApiKey } from '@ai-onboarding/shared';
import { getRedisClient } from '@/infrastructure/cache/RedisClient';

const CACHE_KEY_PREFIX = 'apikey:';
const CACHE_TTL_SECONDS = 5 * 60; // 5 minutes

export interface IWidgetRequest extends Request {
  apiKey?: IApiKey;
}

async function getCachedApiKey(key: string): Promise<IApiKey | null> {
  const redis = getRedisClient();
  const cached = await redis.get(`${CACHE_KEY_PREFIX}${key}`);
  if (cached) {
    return JSON.parse(cached) as IApiKey;
  }
  return null;
}

async function cacheApiKey(key: string, apiKey: IApiKey): Promise<void> {
  const redis = getRedisClient();
  await redis.setex(
    `${CACHE_KEY_PREFIX}${key}`,
    CACHE_TTL_SECONDS,
    JSON.stringify(apiKey)
  );
}

export async function apiKeyMiddleware(
  req: IWidgetRequest,
  _res: Response,
  next: NextFunction,
) {
  try {
    const apiKeyValue = req.headers['x-api-key'];

    if (!apiKeyValue || typeof apiKeyValue !== 'string') {
      throw Errors.widgetApiKeyInvalid();
    }

    // Try cache first
    let apiKey = await getCachedApiKey(apiKeyValue);

    if (!apiKey) {
      // Cache miss - fetch from DB
      const apiKeyRepo =
        container.resolve<IApiKeyRepository>('IApiKeyRepository');

      apiKey = await apiKeyRepo.findByKey(apiKeyValue);

      if (!apiKey) {
        throw Errors.widgetApiKeyInvalid();
      }

      // Cache the result
      await cacheApiKey(apiKeyValue, apiKey);
    }

    if (!apiKey.isActive) {
      throw Errors.widgetApiKeyInactive();
    }

    req.apiKey = apiKey;

    next();
  } catch (error) {
    next(error);
  }
}
