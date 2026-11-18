import { defineConfig } from 'vitest/config';
import { aurentPackageAliases } from '../../packages/aurentAliases.mjs';
import { buildAppVersionDefine } from '../../packages/shared-fiscal/src/resolveBuildVersionDefine.mjs';

const appVersionDefine = buildAppVersionDefine(new URL('./package.json', import.meta.url));

/** Tests live only under /test (mirror of src). */
export default defineConfig({
  resolve: {
    alias: aurentPackageAliases(),
  },
  define: {
    ...appVersionDefine,
  },
  test: {
    environment: 'node',
    include: ['test/**/*.test.js'],
    exclude: ['node_modules', 'dist'],
  },
});
