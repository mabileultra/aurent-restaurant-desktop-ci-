import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packagesRoot = path.dirname(fileURLToPath(import.meta.url));

/** Vite/Vitest resolve.alias map for all @aurent/* packages. */
export function aurentPackageAliases() {
  return {
    '@aurent/shared-auth': path.join(packagesRoot, 'shared-auth/src/index.js'),
    '@aurent/shared-api': path.join(packagesRoot, 'shared-api/src/index.js'),
    '@aurent/shared-offline': path.join(packagesRoot, 'shared-offline/src/index.js'),
    '@aurent/shared-marking': path.join(packagesRoot, 'shared-marking/src/index.js'),
    '@aurent/shared-fiscal': path.join(packagesRoot, 'shared-fiscal/src/index.js'),
    '@aurent/shared-types': path.join(packagesRoot, 'shared-types/src/index.js'),
    '@aurent/shared-tenant': path.join(packagesRoot, 'shared-tenant/src/index.js'),
    '@aurent/shared-ui': path.join(packagesRoot, 'shared-ui/src/index.js'),
  };
}
