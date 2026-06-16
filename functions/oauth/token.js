/**
 * Cloudflare Pages Function —— GitCode OAuth token 交换/刷新（蛋糕日 CakeDay）
 *
 * 路由：POST /oauth/token（与前端同域，无需 CORS）。前端发来 code / refresh_token，
 * 这里在服务端补 client_id / client_secret 调 GitCode，并原样透传其状态码与 body。
 *
 * 为什么需要它：gitcode.com/oauth/token 的实际响应不带 CORS 头，纯浏览器读不到；GitCode
 * 又不支持 PKCE / implicit。放到同域 Function 后，前端→代理是同源调用，彻底无 CORS 问题，
 * 且 client_secret 只存于 Pages 项目 Secret，不进前端包。
 *
 * 环境变量（Pages 项目设置 / wrangler.toml [vars]）：
 *   GITCODE_CLIENT_ID      公开（也用于前端授权 URL）
 *   GITCODE_CLIENT_SECRET  Secret：wrangler pages secret put GITCODE_CLIENT_SECRET
 */
const GITCODE_TOKEN_URL = 'https://gitcode.com/oauth/token';

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 });
  }

  const q = new URLSearchParams();
  q.set('client_id', env.GITCODE_CLIENT_ID);
  q.set('client_secret', env.GITCODE_CLIENT_SECRET);

  if (body.grant_type === 'authorization_code') {
    if (!body.code) return Response.json({ error: 'missing_code' }, { status: 400 });
    q.set('grant_type', 'authorization_code');
    q.set('code', body.code);
    if (body.redirect_uri) q.set('redirect_uri', body.redirect_uri);
  } else if (body.grant_type === 'refresh_token') {
    if (!body.refresh_token) {
      return Response.json({ error: 'missing_refresh_token' }, { status: 400 });
    }
    q.set('grant_type', 'refresh_token');
    q.set('refresh_token', body.refresh_token);
  } else {
    return Response.json({ error: 'unsupported_grant_type' }, { status: 400 });
  }

  // GitCode 要求所有参数走 query、不带 body（实测；文档把 client_secret 标为 body 是错的）。
  const upstream = await fetch(`${GITCODE_TOKEN_URL}?${q.toString()}`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
  });
  return new Response(await upstream.text(), {
    status: upstream.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
