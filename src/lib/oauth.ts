/* ============================================================
   蛋糕日 CakeDay — OAuth（纯浏览器，authorization_code）
   ============================================================ */
import { AUTHORIZE_URL, CLIENT_ID, SCOPE, TOKEN_PROXY_URL, redirectUri } from './config';

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

// token 交换/刷新经同域 Cloudflare Pages Function 代理（TOKEN_PROXY_URL='/oauth/token'，
// 见 functions/oauth/token.js）：gitcode.com/oauth/token 的实际响应不带 CORS 头，纯浏览器读
// 不到；函数在服务端补 client_id/client_secret 调 GitCode 再原样回传。因与前端同源，无 CORS
// 问题；前端只发公开参数，secret 不进前端包。
async function postToken(op: string, body: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch(TOKEN_PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`${op}失败：HTTP ${res.status}${detail ? ` — ${detail}` : ''}`);
  }
  return (await res.json()) as TokenResponse;
}

export async function exchangeCodeForToken(code: string): Promise<TokenResponse> {
  return postToken('换取 token', {
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri(),
  });
}

/** 用 refresh_token 刷新 access_token */
export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  return postToken('刷新 token', {
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });
}
