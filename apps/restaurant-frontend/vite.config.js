import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Local stack (same split as web-frontend):
 * identity 8081 · platform 8084 · restaurant 8087 · gateway 8080
 * Override via .env.development.local:
 *   VITE_DEV_*_PROXY=https://r-aurent.uz  → UI local, API from server
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const identity = env.VITE_DEV_IDENTITY_PROXY || 'http://127.0.0.1:8081';
  const platform = env.VITE_DEV_PLATFORM_PROXY || 'http://127.0.0.1:8084';
  const restaurant = env.VITE_DEV_RESTAURANT_PROXY || 'http://127.0.0.1:8087';
  const api = env.VITE_DEV_API_PROXY || 'http://127.0.0.1:18080';
  const downloads = env.VITE_DOWNLOADS_PROXY || 'https://aurent.uz';

  return {
    plugins: [react()],
    server: {
      port: 5174,
      proxy: {
        '/downloads': {
          target: downloads,
          changeOrigin: true,
          secure: true,
        },
        '/api/v1/auth': {
          target: identity,
          changeOrigin: true,
          secure: true,
        },
        '/api/v1/users': {
          target: identity,
          changeOrigin: true,
          secure: true,
        },
        '/api/v1/platform/module-access': {
          target: identity,
          changeOrigin: true,
          secure: true,
        },
        '/api/v1/platform/security': {
          target: identity,
          changeOrigin: true,
          secure: true,
        },
        '/api/v1/platform/account': {
          target: identity,
          changeOrigin: true,
          secure: true,
        },
        '/api/v1/companies': {
          target: platform,
          changeOrigin: true,
          secure: true,
        },
        '/api/v1/platform': {
          target: platform,
          changeOrigin: true,
          secure: true,
        },
        '/api/v1/billing': {
          target: platform,
          changeOrigin: true,
          secure: true,
        },
        '/api/v1/rst': {
          target: restaurant,
          changeOrigin: true,
          secure: true,
        },
        '/api': {
          target: api,
          changeOrigin: true,
          secure: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
  };
});
