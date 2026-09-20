import { defineConfig } from 'vitest/config';

/**
 * Prefer new tests under /test (mirror of src).
 * Legacy co-located src tests still run until migrated.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.js', 'src/**/*.test.js'],
    exclude: ['node_modules', 'dist'],
  },
});
