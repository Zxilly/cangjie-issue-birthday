/* ============================================================
   本地开发：HTTPS Vite dev server +（同域）Pages Function 代理 + host 注入浏览器
   ------------------------------------------------------------
   生产是 Cloudflare Pages：静态前端 + functions/oauth/token.js（路由 /oauth/token）做
   token 交换代理；回调地址是 https://birthday.cj.zxilly.dev/callback（见 config.ts redirectUri()）。

   本脚本在本地复刻这套：
   1) 起一个【只跑函数】的 `wrangler pages dev`（HTTP，127.0.0.1:8788），它从 functions/
      读取 /oauth/token，并注入 wrangler.toml 的 [vars]（GITCODE_CLIENT_ID）和根目录
      .dev.vars 的 GITCODE_CLIENT_SECRET（已 gitignore，见 .dev.vars.example）。
   2) 起 HTTPS 的 Vite dev server（自签证书，原生 HMR），把 /oauth/token 这一条路由
      反向代理到上面的 wrangler。其余静态/HMR 全由 Vite 直接服务，不经 wrangler——
      避免「HMR 走代理」的种种毛病。
   3) 拉起持久 profile 的 Chrome/Edge，用 --host-resolver-rules 把 birthday.cj.zxilly.dev:443
      劫持到本地 Vite，--ignore-certificate-errors 接受自签证书；这样本地与生产复用
      同一 redirect_uri，GitCode OAuth 应用只需登记一次回调。

   没有 .dev.vars 也能跑（UI 开发无妨），只是本地登录的 token 交换会失败。
   ============================================================ */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { connect } from 'node:net';
import { createServer } from 'vite';

const HOST = 'birthday.cj.zxilly.dev';
const PORT = 5173; // Vite（HTTPS，前端 + HMR）
const FUNCTIONS_PORT = 8788; // wrangler pages dev（HTTP，只跑 functions/）
const TARGET = `https://${HOST}/`;
// CDP 远程调试端口：用 `agent-browser --cdp 9222 ...` 连接本浏览器实例。
const CDP_PORT = 9222;
// 持久化的浏览器 profile（项目内、已 gitignore）：登录态跨重启保留，便于反复调试。
const PROFILE_DIR = fileURLToPath(new URL('../.dev-browser-profile/', import.meta.url));
const ROOT_DIR = fileURLToPath(new URL('../', import.meta.url));

function findBrowser() {
  const { platform, env } = process;
  const candidates =
    platform === 'win32'
      ? [
          'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
          'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
          env.LOCALAPPDATA && join(env.LOCALAPPDATA, 'Google\\Chrome\\Application\\chrome.exe'),
          'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
          'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        ]
      : platform === 'darwin'
        ? [
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
          ]
        : [
            '/usr/bin/google-chrome',
            '/usr/bin/google-chrome-stable',
            '/usr/bin/chromium',
            '/usr/bin/chromium-browser',
            '/usr/bin/microsoft-edge',
          ];
  return candidates.filter(Boolean).find((p) => existsSync(p));
}

/** 轮询直到某端口可连（用于等 wrangler 起好），超时返回 false。 */
function waitForPort(port, { timeout = 25000, interval = 300 } = {}) {
  const deadline = Date.now() + timeout;
  return new Promise((resolve) => {
    const tick = () => {
      const sock = connect(port, '127.0.0.1');
      sock.once('connect', () => {
        sock.destroy();
        resolve(true);
      });
      sock.once('error', () => {
        sock.destroy();
        if (Date.now() > deadline) resolve(false);
        else setTimeout(tick, interval);
      });
    };
    tick();
  });
}

// ---- 1) 只跑函数的 wrangler pages dev ----
if (!existsSync(join(ROOT_DIR, '.dev.vars'))) {
  console.warn(
    '[dev-browser] 未找到 .dev.vars —— 本地 /oauth/token 缺少 GITCODE_CLIENT_SECRET，' +
      '登录的 token 交换会失败。复制 .dev.vars.example 为 .dev.vars 并填入 secret。',
  );
}
const isWin = process.platform === 'win32';
const wrangler = spawn(
  'npx',
  [
    'wrangler',
    'pages',
    'dev',
    '--port',
    String(FUNCTIONS_PORT),
    '--ip',
    '127.0.0.1',
    '--show-interactive-dev-session=false',
  ],
  { cwd: ROOT_DIR, stdio: 'inherit', shell: true },
);
console.log(`[dev-browser] 启动 wrangler pages dev（仅函数）→ http://127.0.0.1:${FUNCTIONS_PORT}`);

let cleaning = false;
function killWrangler() {
  if (!wrangler.pid || wrangler.killed) return;
  if (isWin) {
    // shell:true 下 wrangler.pid 是 cmd 的 pid；/T 连同 node、workerd 子进程一起杀。
    try {
      spawn('taskkill', ['/pid', String(wrangler.pid), '/T', '/F'], { stdio: 'ignore' });
    } catch {
      /* noop */
    }
  } else {
    try {
      wrangler.kill('SIGTERM');
    } catch {
      /* noop */
    }
  }
}

// ---- 2) HTTPS Vite dev server，仅把 /oauth/token 代理到 wrangler ----
const server = await createServer({
  // 显式加载 vite.config.ts，确保 basicSsl()（HTTPS）与 allowedHosts 生效
  configFile: join(ROOT_DIR, 'vite.config.ts'),
  server: {
    port: PORT,
    strictPort: true,
    proxy: {
      // token 交换/刷新走真实的 Pages Function（由 wrangler 本地执行）；其余路由仍由 Vite 服务。
      '/oauth/token': { target: `http://127.0.0.1:${FUNCTIONS_PORT}`, changeOrigin: true },
    },
  },
});
await server.listen();
server.printUrls();
console.log(`\n[dev-browser] Vite dev server 已就绪：本地端口 ${PORT}`);

async function cleanup() {
  if (cleaning) return;
  cleaning = true;
  killWrangler();
  try {
    await server.close();
  } catch {
    /* noop */
  }
}

// 等 wrangler 起好（首次会下载 workerd，可能较慢）再开浏览器，确保点登录即可用。
const fnReady = await waitForPort(FUNCTIONS_PORT);
if (!fnReady) {
  console.warn(
    `[dev-browser] wrangler 函数端口 ${FUNCTIONS_PORT} 未在预期时间内就绪；UI 仍可用，` +
      '但登录的 token 交换可能失败。',
  );
}

// ---- 3) 拉起浏览器并注入 host 映射 ----
const browser = findBrowser();
if (!browser) {
  console.warn(
    `[dev-browser] 未找到 Chrome / Edge。请手动打开 ${TARGET}\n` +
      `  并自行把 ${HOST} 指向 127.0.0.1:${PORT}（hosts 文件或启动参数 --host-resolver-rules）。`,
  );
} else {
  mkdirSync(PROFILE_DIR, { recursive: true });
  const args = [
    `--user-data-dir=${PROFILE_DIR}`,
    `--host-resolver-rules=MAP ${HOST}:443 127.0.0.1:${PORT}`,
    '--ignore-certificate-errors',
    // 注意：刻意【不】关闭同源策略。token 交换经同域 Pages Function 代理（同源，无 CORS）、
    // api.gitcode.com 本身带 CORS，整个 app 已是 CORS 干净的；--disable-web-security 反而会
    // 掩盖真实 CORS 行为（它甚至会让跨域请求不发 Origin 头），使 dev 与生产不一致。需临时看
    // 跨域错误体时再单独加。
    // CDP 远程调试：供 agent-browser 连接驱动；--remote-allow-origins 是 Chrome 111+
    // 允许 CDP websocket 连接的必要项。
    `--remote-debugging-port=${CDP_PORT}`,
    '--remote-allow-origins=*',
    '--no-first-run',
    '--no-default-browser-check',
    '--new-window',
    TARGET,
  ];
  console.log(`[dev-browser] 启动浏览器（CDP :${CDP_PORT}，持久 profile）并注入 host 映射 → ${TARGET}`);
  const launchedAt = Date.now();
  const child = spawn(browser, args, { stdio: 'ignore', detached: false });
  child.on('exit', async () => {
    // 用固定持久 profile 时，若已有一个使用同 profile 的 Chrome 在运行，新进程会把"开窗口"
    // 委托给它后立即退出——此时不能误判为"浏览器已关闭"而关掉服务。只有当本次 Chrome
    // 进程存活了一段时间（确实是本次的浏览器实例）才在其退出时关停。
    if (Date.now() - launchedAt < 3000) {
      console.warn(
        '[dev-browser] 浏览器进程很快退出（可能已有使用同 profile 的实例在运行，本次仅新开了窗口）。' +
          ' 服务继续运行，需停止请 Ctrl+C。',
      );
      return;
    }
    await cleanup();
    process.exit(0);
  });
}

async function shutdown() {
  await cleanup();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
