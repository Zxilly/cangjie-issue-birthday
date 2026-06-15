import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

// The production redirect_uri is the root https://birthday.cj.zxilly.dev/ (see config.ts redirectUri()).
// `pnpm dev:browser` serves this HTTPS dev server and launches a browser that
// maps that host to 127.0.0.1, so local dev reuses the exact same redirect_uri.
export default defineConfig({
  plugins: [react(), tailwindcss(), basicSsl()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    allowedHosts: ['birthday.cj.zxilly.dev', 'localhost'],
  },
});
