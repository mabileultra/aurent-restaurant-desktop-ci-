/**
 * Copy platform Postgres binaries into resources/pgsql for Electron extraResources.
 * Avoids asar ENOENT on initdb.exe / postgres.
 *
 *   node scripts/sync-pgsql-native.cjs
 *   node scripts/sync-pgsql-native.cjs win32 x64
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const platform = process.argv[2] || process.platform;
const arch = process.argv[3] || process.arch;

function packageName(plat, cpu) {
  if (plat === 'win32' && cpu === 'x64') return '@embedded-postgres/windows-x64';
  if (plat === 'darwin' && cpu === 'arm64') return '@embedded-postgres/darwin-arm64';
  if (plat === 'darwin' && (cpu === 'x64' || cpu === 'amd64')) return '@embedded-postgres/darwin-x64';
  throw new Error(`Unsupported platform/arch: ${plat}/${cpu}`);
}

const pkg = packageName(platform, arch);
const srcNative = path.join(root, 'node_modules', ...pkg.split('/'), 'native');
const dest = path.join(root, 'resources', 'pgsql');

if (!fs.existsSync(srcNative)) {
  console.error(`[pgsql] missing ${srcNative} — npm install ${pkg} first`);
  process.exit(1);
}

fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(srcNative, dest, { recursive: true });

const binName = platform === 'win32' ? 'initdb.exe' : 'initdb';
const initdb = path.join(dest, 'bin', binName);
if (!fs.existsSync(initdb)) {
  console.error(`[pgsql] copy failed — no ${initdb}`);
  process.exit(1);
}

console.log(`[pgsql] synced ${pkg} → resources/pgsql (${binName} ok)`);
