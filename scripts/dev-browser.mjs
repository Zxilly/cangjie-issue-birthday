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
import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const HOST = 'birthday.cj.zxilly.dev';
const PORT = 5173;
const TARGET = `https://${HOST}/`;

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
  const userDataDir = mkdtempSync(join(tmpdir(), 'cakeday-dev-'));
  const args = [
    `--user-data-dir=${userDataDir}`,
    `--host-resolver-rules=MAP ${HOST}:443 127.0.0.1:${PORT}`,
    '--ignore-certificate-errors',
    '--no-first-run',
    '--no-default-browser-check',
    '--new-window',
    TARGET,
  ];
  console.log(`[dev-browser] 启动浏览器并注入 host 映射 → ${TARGET}`);
  const child = spawn(browser, args, { stdio: 'ignore', detached: false });
  child.on('exit', async () => {
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
