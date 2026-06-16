# 开发指南

## 架构

纯前端应用（React 19 + TypeScript + Vite + Tailwind CSS v4），以静态资源部署于 Cloudflare Pages。服务端代码仅有一个同源 Pages Function `functions/oauth/token.js`（路由 `/oauth/token`），用于 OAuth 的 token 交换与刷新。

引入该 Function 的原因：`https://gitcode.com/oauth/token` 的响应不包含 CORS 响应头，浏览器无法读取其响应正文，且该端点要求传入 `client_secret`，必须置于服务端。其余接口（列出 issue、发表评论、获取当前用户等）由前端直接调用 `api.gitcode.com`，其响应包含 CORS 头，无需代理。

OAuth 回调地址为 `https://birthday.cj.zxilly.dev/callback`，须与 GitCode OAuth 应用中登记的地址完全一致。该路径无对应静态文件，由 Cloudflare Pages 对未匹配路径回退至 `index.html`（保留原始 URL 与查询参数）实现，前端从查询参数中读取授权码后再清理 URL。

## 环境要求

- Node.js 24
- pnpm（版本见 `package.json` 的 `packageManager` 字段）

## 本地开发

```sh
pnpm install
cp .dev.vars.example .dev.vars   # 填入 GITCODE_CLIENT_SECRET，仅用于本地，已被 gitignore
```

可用脚本：

- `pnpm dev:browser`：启动 HTTPS Vite 开发服务器（含 HMR），同时启动一个仅运行 Functions 的 `wrangler pages dev`（监听 `127.0.0.1:8788`，提供 `/oauth/token`），并由 Vite 将 `/oauth/token` 反向代理至该服务；其余静态资源与 HMR 仍由 Vite 直接服务。脚本还会启动一个把 `birthday.cj.zxilly.dev` 解析至本地的 Chrome，使本地与线上复用同一 redirect_uri。
- `pnpm dev`：仅启动 Vite，用于 UI 开发；不包含 `/oauth/token`，登录不可用。
- `pnpm build`：执行类型检查并构建生产产物至 `dist/`。
- `pnpm typecheck`：仅执行类型检查。

本地的 `/oauth/token` 由 `.dev.vars` 提供 `GITCODE_CLIENT_SECRET`，由 `wrangler.toml` 的 `[vars]` 提供 `GITCODE_CLIENT_ID`。缺少 `.dev.vars` 时仍可进行 UI 开发，但登录的 token 交换会失败。

## 部署

部署目标为 Cloudflare Pages。`client_id` 为非机密信息，配置于 `wrangler.toml` 的 `[vars]`；`client_secret` 通过 `wrangler pages secret put GITCODE_CLIENT_SECRET` 设置为项目 Secret，不进入仓库与前端产物。

- 自动部署：推送至 `main` 分支触发 GitHub Actions（`cloudflare/wrangler-action`）执行 `wrangler pages deploy`。CI 需配置仓库 Secret `CLOUDFLARE_API_TOKEN`。
- 手动部署：`pnpm build && npx wrangler pages deploy`，会一并上传 `functions/`。
