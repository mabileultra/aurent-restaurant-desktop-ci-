import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Local stack (same split as web-frontend):
 * identity 8081 · platform 8084 · restaurant 8087 · gateway 8080
 * Override: VITE_DEV_API_PROXY / VITE_DEV_IDENTITY_PROXY / VITE_DEV_PLATFORM_PROXY
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/downloads': {
        target: process.env.VITE_DOWNLOADS_PROXY || 'https://aurent.uz',
        changeOrigin: true,
        secure: true,
      },
      '/api/v1/auth': {
        target: process.env.VITE_DEV_IDENTITY_PROXY || 'http://127.0.0.1:8081',
        changeOrigin: true,
      },
      '/api/v1/users': {
        target: process.env.VITE_DEV_IDENTITY_PROXY || 'http://127.0.0.1:8081',
        changeOrigin: true,
      },
      '/api/v1/platform/module-access': {
        target: process.env.VITE_DEV_IDENTITY_PROXY || 'http://127.0.0.1:8081',
        changeOrigin: true,
      },
      '/api/v1/platform/security': {
        target: process.env.VITE_DEV_IDENTITY_PROXY || 'http://127.0.0.1:8081',
        changeOrigin: true,
      },
      '/api/v1/platform/account': {
        target: process.env.VITE_DEV_IDENTITY_PROXY || 'http://127.0.0.1:8081',
        changeOrigin: true,
      },
      '/api/v1/companies': {
        target: process.env.VITE_DEV_PLATFORM_PROXY || 'http://127.0.0.1:8084',
        changeOrigin: true,
      },
      '/api/v1/platform': {
        target: process.env.VITE_DEV_PLATFORM_PROXY || 'http://127.0.0.1:8084',
        changeOrigin: true,
      },
      '/api/v1/billing': {
        target: process.env.VITE_DEV_PLATFORM_PROXY || 'http://127.0.0.1:8084',
        changeOrigin: true,
      },
      '/api/v1/rst': {
        target: process.env.VITE_DEV_RESTAURANT_PROXY || 'http://127.0.0.1:8087',
        changeOrigin: true,
      },
      '/api': {
        target: process.env.VITE_DEV_API_PROXY || 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
