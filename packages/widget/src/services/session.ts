import { getCookie, setCookie } from '@/utils/cookies';
import { generateUUID } from '@/utils/uuid';

const SESSION_COOKIE = 'onboarding_session_id';
const SESSION_TTL_HOURS = 24;
const EMAIL_STORAGE_KEY = 'onboarding_user_email';

export function getOrCreateSessionId(): string {
  const existing = getCookie(SESSION_COOKIE);
  if (existing) return existing;

  const sessionId = generateUUID();
  setCookie(SESSION_COOKIE, sessionId, SESSION_TTL_HOURS);
  return sessionId;
}

export function getSavedEmail(): string | null {
  try {
    return localStorage.getItem(EMAIL_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function saveEmail(email: string): void {
  try {
    localStorage.setItem(EMAIL_STORAGE_KEY, email);
  } catch {
    // localStorage may be blocked
  }
}
