export function setCookie(name: string, value: string, hours: number): void {
  const expires = new Date();
  expires.setTime(expires.getTime() + hours * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

export function getCookie(name: string): string | null {
  const nameEQ = `${name}=`;
  const cookies = document.cookie.split(';');

  for (const raw of cookies) {
    const cookie = raw.trim();
    if (cookie.startsWith(nameEQ)) {
      return decodeURIComponent(cookie.substring(nameEQ.length));
    }
  }

  return null;
}
