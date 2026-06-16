/* ============================================================
   本地开发：HTTPS dev server + host 注入浏览器
   ------------------------------------------------------------
   生产回调地址是根路径 https://birthday.cj.zxilly.dev/（与 config.ts redirectUri() 一致，不是 /callback）。
   本脚本启动一个 HTTPS 的 Vite dev server（自签证书），并拉起一个
   全新临时 profile 的 Chrome/Edge，用 --host-resolver-rules 把
   birthday.cj.zxilly.dev:443 劫持到本地 dev server，--ignore-certificate-errors
   接受自签证书。这样本地与生产复用同一个 redirect_uri，只需在 GitCode
   OAuth 应用里登记一次回调地址。
   ============================================================ */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const HOST = 'birthday.cj.zxilly.dev';
const PORT = 5173;
const TARGET = `https://${HOST}/`;
// CDP 远程调试端口：用 `agent-browser --cdp 9222 ...` 连接本浏览器实例。
const CDP_PORT = 9222;
// 持久化的浏览器 profile（项目内、已 gitignore）：登录态跨重启保留，便于反复调试。
const PROFILE_DIR = fileURLToPath(new URL('../.dev-browser-profile/', import.meta.url));

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

const server = await createServer({
  // 显式加载 vite.config.ts，确保 basicSsl()（HTTPS）与 allowedHosts 生效
  configFile: fileURLToPath(new URL('../vite.config.ts', import.meta.url)),
  server: { port: PORT, strictPort: true },
});
await server.listen();
server.printUrls();
console.log(`\n[dev-browser] dev server 已就绪：本地端口 ${PORT}`);

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
    // 关闭同源策略：GitCode token 端点对 200 回显 Origin，但 4xx 错误响应往往不带 CORS 头，
    // 导致浏览器拦截、连错误体都读不到。仅用于本地调试（--disable-web-security 需配合
    // --disable-features=IsolateOrigins,site-per-process 才会真正生效）。
    '--disable-web-security',
    '--disable-features=IsolateOrigins,site-per-process',
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
    // 委托给它后立即退出——此时不能误判为"浏览器已关闭"而关掉 dev server。只有当本次 Chrome
    // 进程存活了一段时间（确实是本次的浏览器实例）才在其退出时关停 server。
    if (Date.now() - launchedAt < 3000) {
      console.warn(
        '[dev-browser] 浏览器进程很快退出（可能已有使用同 profile 的实例在运行，本次仅新开了窗口）。' +
          ' dev server 继续运行，需停止请 Ctrl+C。',
      );
      return;
    }
    await server.close();
    process.exit(0);
  });
}

async function shutdown() {
  try {
    await server.close();
  } catch {
    /* noop */
  }
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
