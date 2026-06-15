/* ============================================================
   蛋糕日 CakeDay — OAuth（纯浏览器，authorization_code）
   ============================================================ */
import {
  AUTHORIZE_URL,
  TOKEN_URL,
  CLIENT_ID,
  CLIENT_SECRET,
  SCOPE,
  redirectUri,
} from './config';

export interface TokenResponse {
  access_token: string;
  token_type?: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  created_at?: string;
}

/** 构造授权页 URL，跳转过去让用户授权 */
export function buildAuthorizeUrl(state: string): string {
  const p = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: redirectUri(),
    response_type: 'code',
    scope: SCOPE,
    state,
  });
  return `${AUTHORIZE_URL}?${p.toString()}`;
}

// GitCode 文档要求 authorization_code 模式必须携带 client_secret。
// 文档把 grant_type/code/client_id 标为 query 参数、client_secret 标为 JSON body；
// 这里按该约定发送，并把 redirect_uri 一并带上（标准要求）。
export async function exchangeCodeForToken(code: string): Promise<TokenResponse> {
  const q = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: CLIENT_ID,
    redirect_uri: redirectUri(),
  });
  const res = await fetch(`${TOKEN_URL}?${q.toString()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ client_secret: CLIENT_SECRET }),
  });
  if (!res.ok) {
    throw new Error(`换取 token 失败：HTTP ${res.status}`);
  }
  return (await res.json()) as TokenResponse;
}

/** 用 refresh_token 刷新 access_token */
export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const q = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: CLIENT_ID,
  });
  const res = await fetch(`${TOKEN_URL}?${q.toString()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ client_secret: CLIENT_SECRET }),
  });
  if (!res.ok) {
    throw new Error(`刷新 token 失败：HTTP ${res.status}`);
  }
  return (await res.json()) as TokenResponse;
}
