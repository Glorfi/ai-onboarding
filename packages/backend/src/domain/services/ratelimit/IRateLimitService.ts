export interface IRateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  limitType: 'session' | 'ip';
}

export interface IRateLimitService {
  checkSessionLimit(sessionId: string, siteId: string): Promise<IRateLimitResult>;
  checkIpLimit(ipAddress: string): Promise<IRateLimitResult>;
  incrementSession(sessionId: string, siteId: string): Promise<void>;
  incrementIp(ipAddress: string): Promise<void>;
  getRemainingQuota(sessionId: string, siteId: string): Promise<number>;
}
