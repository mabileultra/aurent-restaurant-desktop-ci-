import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { aurentPackageAliases } from '../../packages/aurentAliases.mjs';
import { buildAppVersionDefine } from '../../packages/shared-fiscal/src/resolveBuildVersionDefine.mjs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const appRoot = path.dirname(fileURLToPath(import.meta.url));
const appVersionDefine = buildAppVersionDefine(new URL('./package.json', import.meta.url));

/**
 * Local stack mirrors restaurant/web:
 * identity 8081 · pharmacy 8089 · gateway 8080/18080
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const identity = env.VITE_DEV_IDENTITY_PROXY || 'http://127.0.0.1:8081';
  const pharmacy = env.VITE_DEV_PHARMACY_PROXY || 'http://127.0.0.1:8089';
  const api = env.VITE_DEV_API_PROXY || 'http://127.0.0.1:18080';

  return {
    plugins: [react()],
    css: {
      postcss: appRoot,
    },
    resolve: {
      alias: aurentPackageAliases(),
    },
    define: {
      ...appVersionDefine,
    },
    server: {
      port: 5175,
      proxy: {
        '/api/v1/auth': {
          target: identity,
          changeOrigin: true,
        },
        '/api/v1/users': {
          target: identity,
          changeOrigin: true,
        },
        '/api/v1/pharmacy': {
          target: pharmacy,
          changeOrigin: true,
        },
        '/api': {
          target: api,
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
    test: {
      environment: 'node',
      include: ['src/**/*.test.js'],
    },
  };
});
