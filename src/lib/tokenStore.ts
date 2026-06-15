/* ============================================================
   蛋糕日 CakeDay — token 持久化 + 自动刷新
   ============================================================ */
import { refreshAccessToken, type TokenResponse } from './oauth';

const KEY = 'cakeday.token';

export interface StoredToken {
  access_token: string;
  refresh_token: string;
  /** 绝对过期时间戳（ms） */
  expires_at: number;
  scope: string;
}

export function saveToken(t: TokenResponse): StoredToken {
  const stored: StoredToken = {
    access_token: t.access_token,
    refresh_token: t.refresh_token,
    expires_at: Date.now() + t.expires_in * 1000,
    scope: t.scope,
  };
  localStorage.setItem(KEY, JSON.stringify(stored));
  return stored;
}

export function loadToken(): StoredToken | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StoredToken) : null;
  } catch {
    return null;
  }
}

export function clearToken(): void {
  localStorage.removeItem(KEY);
}

export function hasToken(): boolean {
  return loadToken() !== null;
}

/**
 * 返回一个仍然有效的 access_token；过期则尝试用 refresh_token 刷新。
 * 无 token / 刷新失败时清除并返回 null（需要重新登录）。
 */
export async function getValidToken(): Promise<string | null> {
  const t = loadToken();
  if (!t) return null;

  // 留 60s 缓冲
  if (Date.now() < t.expires_at - 60_000) return t.access_token;

  if (!t.refresh_token) {
    clearToken();
    return null;
  }
  try {
    const fresh = await refreshAccessToken(t.refresh_token);
    return saveToken(fresh).access_token;
  } catch {
    clearToken();
    return null;
  }
}
