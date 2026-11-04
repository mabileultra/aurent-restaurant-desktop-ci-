import path from 'node:path';
import { defineConfig } from 'vitest/config';
import { aurentPackageAliases } from '../packages/aurentAliases.mjs';

/**
 * Prefer new tests under /test (mirror of src).
 * Legacy co-located src tests still run until migrated.
 */
export default defineConfig({
  resolve: {
    alias: aurentPackageAliases(),
  },
  test: {
    environment: 'node',
    include: [
      'test/**/*.test.js',
      'src/**/*.test.js',
      '../packages/*/src/**/*.test.js',
    ],
    exclude: ['node_modules', 'dist'],
  },
});
