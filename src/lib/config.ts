/* ============================================================
   蛋糕日 CakeDay — 集中配置（写死的常量）
   ============================================================ */

// CLIENT_ID 是公开值（出现在授权 URL 里），可写死或用 .env 覆盖。
export const CLIENT_ID =
  import.meta.env.VITE_GITCODE_CLIENT_ID ?? '1da4d36659e04e70bd1719222f9fbb14';

// token 交换/刷新经同域的 Cloudflare Pages Function 代理（见 functions/oauth/token.js）。
// 同源相对路径，无需 CORS；client_secret 存于 Pages 项目 Secret，不进前端包。
// 原因：gitcode.com/oauth/token 的实际响应不带 CORS 头，纯浏览器读不到，且 GitCode 不支持
// PKCE/implicit，故 token 交换必须经服务端。
export const TOKEN_PROXY_URL = '/oauth/token';

// 目标组织
export const ORG = 'Cangjie';

// OAuth scope：读用户 / 读写 issue / 写评论(note)
export const SCOPE = 'all_user all_issue all_note';

// GitCode OAuth + OpenAPI 端点（token 端点由 Worker 代理，见 TOKEN_PROXY_URL）
export const AUTHORIZE_URL = 'https://gitcode.com/oauth/authorize';
export const API_BASE = 'https://api.gitcode.com/api/v5';

// 满 N 周岁才算「高龄 issue」，可送蛋糕
export const AGE_THRESHOLD_YEARS = 1;

// 在 GitCode OAuth 应用里登记的回调地址必须与此**完全一致**。
// 用 /callback 专用回调路径：该路径无对应静态文件，Cloudflare Pages 对未匹配到
// 静态资源/函数的路径会回退到 index.html（200，保留原始 URL 与 query），前端再从
// query 读取 code（与路径无关）并 cleanUrl() 收敛回 /。本地 Vite dev server 同样
// 把未知路径回退到 index.html，故本地一致可用。
// 注意：不要用 _redirects 显式把 /callback 重写到 /index.html——Pages 的 clean-URL
// 会把 /index.html 308 重定向到 /，反而丢掉 ?code。直接依赖上述 SPA 回退即可。
// 生产：https://birthday.cj.zxilly.dev/callback
// 本地：`pnpm dev:browser` 会把该域名劫持到本地 dev server，origin 仍为该域名。
export function redirectUri(): string {
  return `${window.location.origin}/callback`;
}

// 是否已填入真实 client_id（token 代理是同域 Function，部署后即存在）
export function isConfigured(): boolean {
  return !CLIENT_ID.startsWith('YOUR_');
}
