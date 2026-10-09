'use client';

const ACCESS_KEY = 'lmms.accessToken';
const REFRESH_KEY = 'lmms.refreshToken';

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(ACCESS_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export async function authedFetch(
  input: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = getAccessToken();
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(input, { ...init, headers });
  if (res.status === 401) {
    const refresh = getRefreshToken();
    if (refresh) {
      const rr = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refresh }),
      });
      if (rr.ok) {
        const data = (await rr.json()) as { accessToken: string; refreshToken: string };
        setTokens(data.accessToken, data.refreshToken);
        const retryHeaders = new Headers(init.headers);
        retryHeaders.set('Authorization', `Bearer ${data.accessToken}`);
        return fetch(input, { ...init, headers: retryHeaders });
      }
    }
    clearTokens();
    if (typeof window !== 'undefined') window.location.href = '/login';
  }
  return res;
}
