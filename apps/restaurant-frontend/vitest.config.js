import { defineConfig } from 'vitest/config';
import { aurentPackageAliases } from '../../packages/aurentAliases.mjs';

/** Tests live only under /test (mirror of src). */
export default defineConfig({
  resolve: {
    alias: aurentPackageAliases(),
  },
  test: {
    environment: 'node',
    include: ['test/**/*.test.js'],
    exclude: ['node_modules', 'dist'],
  },
});
