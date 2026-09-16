// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Local without api-gateway: mirror docker route split (auth→identity, platform→platform, else→backend).
    proxy: {
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
      '/api/v1/public': {
        target: process.env.VITE_DEV_PLATFORM_PROXY || 'http://127.0.0.1:8084',
        changeOrigin: true,
      },
      '/api': {
        target: process.env.VITE_DEV_API_PROXY || 'http://127.0.0.1:8088',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts')) return 'charts';
            if (id.includes('@tanstack/react-query')) return 'query';
            // react-hook-form + zod must stay with React — separate "forms" chunk causes
            // "Cannot access before initialization" in production (circular chunk deps).
            if (
              id.includes('react')
              || id.includes('react-dom')
              || id.includes('react-router')
              || id.includes('react-hook-form')
              || id.includes('zod')
              || id.includes('@hookform')
            ) {
              return 'vendor';
            }
            return;
          }

          // Cashier — split by route concern to avoid one 500kB chunk
          if (id.includes('/src/features/cashier/')) {
            if (
              id.includes('/payment/')
              || id.includes('PosPaymentFlow')
              || id.includes('usePosPaymentFlow')
              || id.includes('PosOrderDiscountModal')
            ) {
              return 'cashier-payment';
            }
            if (
              id.includes('/my-sales/')
              || id.includes('CashierMySales')
              || id.includes('useCashierMySales')
            ) {
              return 'cashier-my-sales';
            }
            if (
              id.includes('WeightEntryModal')
              || id.includes('useWeightEntryModal')
              || id.includes('/weight-entry/')
              || id.includes('/scales/')
            ) {
              return 'cashier-weight';
            }
            return 'cashier-pos';
          }
          if (id.includes('/src/features/cash-registers/')) {
            // Multikassa modal is opened from cashier shell — keep it out of cash-registers
            // chunk or we get "Cannot access before initialization" (circular chunk deps).
            if (
              id.includes('MultikassaSettingsModal')
              || id.includes('useMultikassaSettings')
            ) {
              return 'multikassa-settings';
            }
            return 'cash-registers';
          }

          // catalog, sales, tenant, stock, reports share components/receipt,
          // product-stock, tasnif — keep in default chunks to avoid cycles
        },
      },
    },
  },
});
