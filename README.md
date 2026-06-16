# 蛋糕日 · CakeDay

给 Cangjie 的高龄 issue 送生日蛋糕 🎂

用 GitCode 账号登录后，找出你在 [Cangjie](https://gitcode.com/Cangjie) 组织里亲手提的、仍未关闭、且已经满 1 岁的老 issue，给每条标注「N 周岁」，并能一键在该 issue 下送上一条迟到的生日祝福。还没满 1 岁的也会列出来，顺便看看离生日还有几天。

服务地址：<https://birthday.cj.zxilly.dev>

## 技术形态

纯前端（React 19 + TS + Vite 7 + Tailwind v4）静态站，部署在 **Cloudflare Pages**。
唯一的服务端代码是一个同域 **Pages Function** `functions/oauth/token.js`（路由 `/oauth/token`），
仅用于 OAuth 的 token 交换/刷新——因为 `gitcode.com/oauth/token` 的响应不带 CORS 头、纯浏览器
读不到，且强制要 `client_secret`（必须留在服务端）。列 issue、发评论等读写则由前端直连
`api.gitcode.com`（其响应带 CORS 头）。

## 本地开发

```sh
pnpm install
cp .dev.vars.example .dev.vars   # 填入 GITCODE_CLIENT_SECRET（仅本地，已 gitignore）
pnpm dev:browser                 # 见下
```

- `pnpm dev:browser`：起 HTTPS 的 Vite dev server（原生 HMR）+ 一个「只跑函数」的
  `wrangler pages dev`（本地执行 `/oauth/token`，从 `.dev.vars` 读 secret、从 `wrangler.toml`
  读 client_id），Vite 仅把 `/oauth/token` 反代到它；再拉起一个把 `birthday.cj.zxilly.dev`
  劫持到本地的 Chrome，使本地与生产**复用同一 redirect_uri**，GitCode OAuth 应用只需登记
  一次回调（`https://birthday.cj.zxilly.dev/callback`）。
- `pnpm dev`：仅 Vite（纯 UI 开发；不含 `/oauth/token`，登录不可用）。

## 部署

Cloudflare Pages。`client_id` 是非机密、写在 `wrangler.toml` 的 `[vars]`；`client_secret`
经 `wrangler pages secret put GITCODE_CLIENT_SECRET` 设为项目 Secret（不进仓库、不进前端包）。

- 自动：push 到 `main` → GitHub Actions（`cloudflare/wrangler-action`）跑 `wrangler pages deploy`。
  CI 仅需仓库 secret `CLOUDFLARE_API_TOKEN`。
- 手动：`pnpm build && npx wrangler pages deploy`（会一并上传 `functions/`）。
