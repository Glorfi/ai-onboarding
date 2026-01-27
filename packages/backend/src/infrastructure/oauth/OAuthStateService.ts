import { injectable } from 'tsyringe';
import { randomBytes, createHmac, timingSafeEqual } from 'crypto';

interface OAuthStatePayload {
  nonce: string;
  provider: string;
  createdAt: number;
}

export interface IStateValidationResult {
  valid: boolean;
  error?: string;
}

@injectable()
export class OAuthStateService {
  private readonly STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes
  private readonly secret: string;

  constructor() {
    this.secret =
      process.env.OAUTH_STATE_SECRET ||
      process.env.JWT_ACCESS_SECRET ||
      'default-secret-change-me';

    if (this.secret === 'default-secret-change-me') {
      console.warn(
        'WARNING: Using default OAuth state secret. Set OAUTH_STATE_SECRET in production.'
      );
    }
  }

  /**
   * Generates a signed state parameter that contains all validation data.
   * No cookies needed - everything is encoded in the state itself.
   * Format: base64url(payload).signature
   */
  generateState(provider: string): string {
    const payload: OAuthStatePayload = {
      nonce: randomBytes(16).toString('hex'),
      provider,
      createdAt: Date.now(),
    };

    return this.signPayload(payload);
  }

  /**
   * Validates the signed state parameter returned from OAuth provider.
   * Verifies signature, TTL, and provider match.
   */
  validateState(state: string, provider: string): IStateValidationResult {
    if (!state) {
      return { valid: false, error: 'OAuth state not provided' };
    }

    const payload = this.verifyAndExtractPayload(state);
    if (!payload) {
      return { valid: false, error: 'Invalid OAuth state signature' };
    }

    if (Date.now() - payload.createdAt > this.STATE_TTL_MS) {
      return { valid: false, error: 'OAuth state expired' };
    }

    if (payload.provider !== provider) {
      return { valid: false, error: 'OAuth provider mismatch' };
    }

    return { valid: true };
  }

  private signPayload(payload: OAuthStatePayload): string {
    const payloadStr = JSON.stringify(payload);
    const payloadB64 = Buffer.from(payloadStr).toString('base64url');
    const signature = this.createSignature(payloadB64);

    return `${payloadB64}.${signature}`;
  }

  private verifyAndExtractPayload(state: string): OAuthStatePayload | null {
    const parts = state.split('.');
    if (parts.length !== 2) {
      return null;
    }

    const [payloadB64, signature] = parts;

    const expectedSignature = this.createSignature(payloadB64);
    if (!this.safeCompare(signature, expectedSignature)) {
      return null;
    }

    try {
      const payloadStr = Buffer.from(payloadB64, 'base64url').toString('utf-8');
      return JSON.parse(payloadStr) as OAuthStatePayload;
    } catch {
      return null;
    }
  }

  private createSignature(data: string): string {
    return createHmac('sha256', this.secret).update(data).digest('base64url');
  }

  private safeCompare(a: string, b: string): boolean {
    try {
      const bufA = Buffer.from(a);
      const bufB = Buffer.from(b);

      if (bufA.length !== bufB.length) {
        return false;
      }

      return timingSafeEqual(bufA, bufB);
    } catch {
      return false;
    }
  }
}
