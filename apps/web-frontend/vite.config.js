// vite.config.js
import fs from 'node:fs';
import path from 'node:path';
import { aurentPackageAliases } from '../../packages/aurentAliases.mjs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import eslint from 'vite-plugin-eslint2';

function serviceWorkerVersionPlugin() {
  return {
    name: 'sw-cache-version',
    closeBundle() {
      const swDistPath = path.resolve(__dirname, 'dist/sw.js');
      if (fs.existsSync(swDistPath)) {
        const buildVersion = `${new Date().toISOString().slice(0, 10).replace(/-/g, '.')}-${Date.now().toString(36)}`;
        const content = fs.readFileSync(swDistPath, 'utf8');
        fs.writeFileSync(swDistPath, content.replace('__SW_CACHE_VERSION__', buildVersion));
      }
    },
  };
}

const packageJson = JSON.parse(
  fs.readFileSync(new URL('./package.json', import.meta.url), 'utf8')
);

export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const identityProxy = env.VITE_DEV_IDENTITY_PROXY || process.env.VITE_DEV_IDENTITY_PROXY || 'http://127.0.0.1:8081';
  const platformProxy = env.VITE_DEV_PLATFORM_PROXY || process.env.VITE_DEV_PLATFORM_PROXY || 'http://127.0.0.1:8084';
  const apiProxy = env.VITE_DEV_API_PROXY || process.env.VITE_DEV_API_PROXY || 'http://127.0.0.1:8088';

  let visualizerPlugin = null;
  if (env.ANALYZE === 'true' || process.env.ANALYZE === 'true') {
    const { visualizer } = await import('rollup-plugin-visualizer');
    visualizerPlugin = visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
      template: 'treemap',
    });
  }

  const configureProxy = (proxy) => {
    proxy.on('error', (err, req, res) => {
      if (res && !res.headersSent && typeof res.writeHead === 'function') {
        res.writeHead(503, {
          'Content-Type': 'application/json; charset=utf-8',
        });
        res.end(
          JSON.stringify({
            error: 'NETWORK_UNREACHABLE',
            message: 'Internet yoki server bilan aloqa uzildi. Tarmoq ulanishini tekshiring.',
            code: err.code || 'ERR_NETWORK',
          })
        );
      }
    });
  };

  return {
    plugins: [
      react(),
      eslint({
        dev: true,
        build: false,
        cache: true,
        cacheLocation: path.resolve(__dirname, 'node_modules/.cache/.eslintcache'),
      }),
      serviceWorkerVersionPlugin(),
      visualizerPlugin,
    ].filter(Boolean),
    server: {
      port: 5173,
      // Local without api-gateway: mirror docker route split (auth→identity, platform→platform, else→backend).
      proxy: {
        '/api/v1/auth': {
          target: identityProxy,
          changeOrigin: true,
          secure: false,
          configure: configureProxy,
        },
        '/api/v1/users': {
          target: identityProxy,
          changeOrigin: true,
          secure: false,
          configure: configureProxy,
        },
        '/api/v1/platform/module-access': {
          target: identityProxy,
          changeOrigin: true,
          secure: false,
          configure: configureProxy,
        },
        '/api/v1/platform/security': {
          target: identityProxy,
          changeOrigin: true,
          secure: false,
          configure: configureProxy,
        },
        '/api/v1/platform/account': {
          target: identityProxy,
          changeOrigin: true,
          secure: false,
          configure: configureProxy,
        },
        '/api/v1/companies': {
          target: platformProxy,
          changeOrigin: true,
          secure: false,
          configure: configureProxy,
        },
        '/api/v1/platform': {
          target: platformProxy,
          changeOrigin: true,
          secure: false,
          configure: configureProxy,
        },
        '/api/v1/billing': {
          target: platformProxy,
          changeOrigin: true,
          secure: false,
          configure: configureProxy,
        },
        '/api/v1/public': {
          target: platformProxy,
          changeOrigin: true,
          secure: false,
          configure: configureProxy,
        },
        '/api': {
          target: apiProxy,
          changeOrigin: true,
          secure: false,
          configure: configureProxy,
        },
      },
    },
    resolve: {
      alias: aurentPackageAliases(),
      dedupe: ['react', 'react-dom', 'react-router-dom', 'react-i18next'],
    },
    define: {
      __APP_VERSION__: JSON.stringify(packageJson.version),
    },
    esbuild: {
      jsx: 'automatic',
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-dom/client',
        'react-router-dom',
        'react-i18next',
        '@tanstack/react-query',
        'react-hot-toast',
      ],
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Only split node_modules. App-level cashier/cash-registers manualChunks
            // caused production white screens via circular chunk init
            // (createContext undefined / Cannot access before initialization).
            if (!id.includes('node_modules')) return;
            if (/[\\/]clsx[\\/]/.test(id)) return 'vendor';
            if (/recharts|react-smooth|[\\/]d3-|victory-vendor|decimal\.js-light|[\\/]lodash[\\/]|fast-equals|eventemitter3|internmap/.test(id)) return 'charts';
            if (
              /[\\/](react|react-dom|scheduler|react-router|react-router-dom|react-i18next|use-sync-external-store|@remix-run|@tanstack|react-hook-form|@hookform|zod|react-hot-toast)[\\/]/.test(id)
            ) {
              return 'vendor';
            }
          },
        },
      },
    },
};
});
