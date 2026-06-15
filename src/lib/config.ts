/* ============================================================
   蛋糕日 CakeDay — 集中配置（写死的常量）
   ============================================================ */

// ⚠️ 安全说明：这是纯前端应用，下面的 CLIENT_SECRET 会被打包进客户端、
// 对所有访问者公开可见。这是产品设计上接受的权衡（仅适合个人 / 趣味项目），
// 切勿当作真正的机密，也不要用于正式产品。
//
// 填法二选一：
//   1. 复制 .env.example 为 .env，填入 VITE_GITCODE_CLIENT_ID / VITE_GITCODE_CLIENT_SECRET；
//   2. 直接把下面两个占位符替换成真实值。
export const CLIENT_ID =
  import.meta.env.VITE_GITCODE_CLIENT_ID ?? '1da4d36659e04e70bd1719222f9fbb14';
export const CLIENT_SECRET =
  import.meta.env.VITE_GITCODE_CLIENT_SECRET ?? 'ba32bbbb5cb84f0c9bda9454520df06a';

// 目标组织
export const ORG = 'Cangjie';

// OAuth scope：读用户 / 读写 issue / 写评论(note)
export const SCOPE = 'all_user all_issue all_note';

// GitCode OAuth + OpenAPI 端点
export const AUTHORIZE_URL = 'https://gitcode.com/oauth/authorize';
export const TOKEN_URL = 'https://gitcode.com/oauth/token';
export const API_BASE = 'https://api.gitcode.com/api/v5';

// 满 N 周岁才算「高龄 issue」，可送蛋糕
export const AGE_THRESHOLD_YEARS = 1;

// 在 GitCode OAuth 应用里登记的回调地址必须与此**完全一致**。
// 用根路径（而非 /callback）：纯静态 SPA 下根路径一定能被服务到，无需任何
// SPA 回退配置，也就不会 404。回调后 app 从 query 读取 code（与路径无关）再清理 URL。
// 生产：https://birthday.cj.zxilly.dev/
// 本地：`pnpm dev:browser` 会把该域名劫持到本地 dev server，origin 仍为该域名。
export function redirectUri(): string {
  return `${window.location.origin}/`;
}

// 是否已经填入真实凭据
export function isConfigured(): boolean {
  return !CLIENT_ID.startsWith('YOUR_') && !CLIENT_SECRET.startsWith('YOUR_');
}
