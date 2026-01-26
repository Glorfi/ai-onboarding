import * as jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { injectable } from 'tsyringe';

export interface IJwtPayload {
  userId: string;
}

@injectable()
export class JwtService {
  private readonly accessSecret: string;
  private readonly accessExpiresIn: string;
  private readonly refreshSecret: string;
  private readonly refreshExpiresIn: string;

  constructor() {
    this.accessSecret =
      process.env.JWT_ACCESS_SECRET || 'default-secret-change-me';
    this.refreshSecret =
      process.env.JWT_REFRESH_SECRET || 'default-refresh-secret';
    this.accessExpiresIn = process.env.ACCESS_TOKEN_EXPIRES_IN || '7d';
    this.refreshExpiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || '14d';
  }

  /** Парсим строки вроде "7d" или "14d" в миллисекунды */
  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) throw new Error(`Invalid expiresIn format: ${expiresIn}`);

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        throw new Error(`Unknown time unit: ${unit}`);
    }
  }

  /** Публичный метод для получения maxAge токена для куки */
  public getTokenMaxAge(type: 'access' | 'refresh'): number {
    return type === 'access'
      ? this.parseExpiresIn(this.accessExpiresIn)
      : this.parseExpiresIn(this.refreshExpiresIn);
  }

  /** Генерация access токена */
  public generateAccessToken(userId: string): string {
    const payload: IJwtPayload = { userId };
    return jwt.sign(payload, this.accessSecret, {
      expiresIn: this.accessExpiresIn,
    } as SignOptions);
  }

  /** Генерация refresh токена */
  public generateRefreshToken(userId: string): string {
    const payload: IJwtPayload = { userId };
    return jwt.sign(payload, this.refreshSecret, {
      expiresIn: this.refreshExpiresIn,
    } as SignOptions);
  }

  /** Верификация access токена */
  public verifyAccessToken(token: string): IJwtPayload {
    return jwt.verify(token, this.accessSecret) as IJwtPayload;
  }

  /** Верификация refresh токена */
  public verifyRefreshToken(token: string): IJwtPayload {
    return jwt.verify(token, this.refreshSecret) as IJwtPayload;
  }
}
