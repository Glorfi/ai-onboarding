import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { BusinessError } from '@/domain/errors';
import {
  ERROR_CODES,
  type IErrorResponse,
  type IValidationErrorResponse,
  type IFieldError,
} from '@ai-onboarding/shared';

/**
 * Преобразует ZodError в структурированный формат ошибок валидации
 */
function formatZodError(zodError: ZodError): IValidationErrorResponse {
  const errors: IFieldError[] = zodError.errors.map((e) => ({
    field: e.path.join('.'),
    message: e.message,
    code: e.code,
  }));

  return {
    message: 'Validation failed',
    code: ERROR_CODES.VALIDATION_ERROR,
    errors,
  };
}

/**
 * Централизованный обработчик ошибок Express
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (err instanceof BusinessError) {
    res.status(err.statusCode).json(err.toResponse());
    return;
  }

  if (err instanceof ZodError) {
    const response = formatZodError(err);
    res.status(400).json(response);
    return;
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    const response: IErrorResponse = {
      message: 'Invalid or expired token',
      code: ERROR_CODES.UNAUTHORIZED,
    };
    res.status(401).json(response);
    return;
  }

  console.error('Unexpected error:', err);

  const response: IErrorResponse = {
    message:
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message || 'Internal server error',
    code: ERROR_CODES.INTERNAL_ERROR,
  };
  res.status(500).json(response);
}
