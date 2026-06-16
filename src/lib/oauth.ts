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

// token 端点的所有参数（含 client_secret）一律走 query、不带 body：GitCode 文档把
// client_secret 标为 JSON body 参数，但实测服务端只从 query 读取它（照文档放 body 会报
// 「client_secret不能为空」，且无 body 也能正常换取/刷新）。
async function postToken(op: string, params: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch(`${TOKEN_URL}?${new URLSearchParams(params).toString()}`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
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
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: redirectUri(),
  });
}

/** 用 refresh_token 刷新 access_token */
export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  return postToken('刷新 token', {
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  });
}
