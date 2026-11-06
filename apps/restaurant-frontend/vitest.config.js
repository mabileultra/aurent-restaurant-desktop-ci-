import { defineConfig } from 'vitest/config';

/** Tests live only under /test (mirror of src). */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.js'],
    exclude: ['node_modules', 'dist'],
  },
});
