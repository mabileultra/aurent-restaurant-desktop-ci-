// vite.config.js
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const identityProxy = env.VITE_DEV_IDENTITY_PROXY || process.env.VITE_DEV_IDENTITY_PROXY || 'http://127.0.0.1:8081';
  const platformProxy = env.VITE_DEV_PLATFORM_PROXY || process.env.VITE_DEV_PLATFORM_PROXY || 'http://127.0.0.1:8084';
  const apiProxy = env.VITE_DEV_API_PROXY || process.env.VITE_DEV_API_PROXY || 'http://127.0.0.1:8088';

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
    plugins: [react()],
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
          if (id.includes('recharts')) return 'charts';
          if (
            id.includes('react')
            || id.includes('react-dom')
            || id.includes('react-router')
            || id.includes('@tanstack/react-query')
            || id.includes('react-hook-form')
            || id.includes('zod')
            || id.includes('@hookform')
          ) {
            return 'vendor';
          }
        },
      },
    },
  },
};
});
