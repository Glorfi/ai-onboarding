import { injectable } from 'tsyringe';
import { randomBytes } from 'crypto';

interface StateData {
  state: string;
  createdAt: number;
  provider: string;
}

@injectable()
export class OAuthStateService {
  private states: Map<string, StateData> = new Map();
  private readonly STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

  generateState(provider: string): string {
    const state = randomBytes(32).toString('hex');

    this.states.set(state, {
      state,
      createdAt: Date.now(),
      provider,
    });

    this.cleanupExpiredStates();

    return state;
  }

  validateAndConsumeState(state: string, provider: string): boolean {
    const stateData = this.states.get(state);

    if (!stateData) {
      return false;
    }

    if (Date.now() - stateData.createdAt > this.STATE_TTL_MS) {
      this.states.delete(state);
      return false;
    }

    if (stateData.provider !== provider) {
      return false;
    }

    this.states.delete(state);

    return true;
  }

  private cleanupExpiredStates(): void {
    const now = Date.now();
    for (const [state, data] of this.states.entries()) {
      if (now - data.createdAt > this.STATE_TTL_MS) {
        this.states.delete(state);
      }
    }
  }
}
