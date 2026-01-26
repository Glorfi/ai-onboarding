import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { BusinessError } from '@/domain/errors';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (err instanceof BusinessError) {
    res.status(err.statusCode).json({
      message: err.message,
      code: err.code,
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    res.status(401).json({
      message: 'Invalid or expired token',
      code: 'UNAUTHORIZED',
    });
    return;
  }

  console.error('Unexpected error:', err);
  res.status(500).json({
    message: 'Internal server error',
    code: 'INTERNAL_ERROR',
  });
}
