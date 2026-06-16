import { WebTokenStorage } from '@shared/auth';

const tokenStorage = typeof window === 'undefined' ? null : new WebTokenStorage();

export function getToken(): string | null {
  return tokenStorage?.getToken() ?? null;
}

export function setToken(token: string): void {
  tokenStorage?.setToken(token);
}

export function removeToken(): void {
  tokenStorage?.removeToken();
}

export function getRefreshToken(): string | null {
  return tokenStorage?.getRefreshToken() ?? null;
}

export function setRefreshToken(token: string): void {
  tokenStorage?.setRefreshToken(token);
}

export function removeRefreshToken(): void {
  tokenStorage?.removeRefreshToken();
}

export function decodeToken(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return true;
  const exp = payload.exp as number;
  const now = Math.floor(Date.now() / 1000);
  return now >= exp;
}

export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;
  return !isTokenExpired(token);
}

export function clearAuth(): void {
  tokenStorage?.clear();
}
