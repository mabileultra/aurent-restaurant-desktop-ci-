import path from 'node:path';
import { defineConfig } from 'vitest/config';

/**
 * Prefer new tests under /test (mirror of src).
 * Legacy co-located src tests still run until migrated.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@aurent/shared-auth': path.resolve(__dirname, '../packages/shared-auth/src/index.js'),
    },
  },
  test: {
    environment: 'node',
    include: [
      'test/**/*.test.js',
      'src/**/*.test.js',
      '../packages/shared-auth/src/**/*.test.js',
    ],
    exclude: ['node_modules', 'dist'],
  },
});
