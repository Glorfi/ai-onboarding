import { Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import { JwtService } from '@/domain/services';

export interface IAuthRequest extends Request {
  userId?: string;
}

export function authMiddleware(
  req: IAuthRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const jwtService = container.resolve(JwtService);

    let token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      token = req.cookies?.accessToken;
    }

    if (!token) {
      res.status(401).json({
        message: 'Access token not provided',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    const payload = jwtService.verifyAccessToken(token);
    req.userId = payload.userId;

    next();
  } catch (error) {
    res.status(401).json({
      message: 'Invalid or expired token',
      code: 'UNAUTHORIZED',
    });
  }
}
