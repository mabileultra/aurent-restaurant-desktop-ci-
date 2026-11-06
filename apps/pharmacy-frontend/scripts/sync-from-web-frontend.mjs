#!/usr/bin/env node
/**
 * Copy pharmacy entrypoints + transitive relative imports from web-frontend into this app.
 * Re-run after adding seeds. Does not rewrite business logic.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PHARM_ROOT = path.resolve(__dirname, '..');
const WEB_SRC = path.resolve(PHARM_ROOT, '../web-frontend/src');
const OUT_SRC = path.resolve(PHARM_ROOT, 'src');

const SEEDS = [
  'features/pharmacy-cashier/pages/PharmacyPosPage.jsx',
  'features/pharmacy-stock/pages/PharmacyProductsPage.jsx',
  'features/pharmacy-stock/pages/PharmacyReceiptsPage.jsx',
  'features/pharmacy-stock/pages/PharmacyReceiptDocumentPage.jsx',
  'features/pharmacy-stock/pages/PharmacyReceiptPickPage.jsx',
  'features/pharmacy-stock/pages/PharmacyAslWithdrawMonitorPage.jsx',
  'features/pharmacy-stock/pages/PharmacyAslRequestLogPage.jsx',
  'features/sales/pages/ReturnsPage.jsx',
  'features/sales/pages/SalesLedgerPage.jsx',
  'features/dashboard/pages/DashboardPage.jsx',
  'pharmacy/errors/resolvePharmacyApiError.js',
  'pharmacy/errors/isPharmacyErrorCode.js',
  'api/pharmacyWarehouse.api.js',
  'api/pharmacySales.api.js',
  'api/pharmacyShift.api.js',
  'api/pharmacyStockMarks.api.js',
  'api/pharmacyIntegration.api.js',
  'locales/pharmacyErrors.ru.json',
  'locales/pharmacyErrors.uz.json',
  'locales/ru.json',
  'locales/uz.json',
  'components/layout/CashierLayout.jsx',
];

const SKIP_PREFIXES = [
  'features/platform/',
  'features/public-site/',
  'features/restaurant/',
  'restaurant/',
];

/** Keep pharmacy SPA bootstrap / Sprint-2 auth (do not clobber). */
const PROTECT = new Set([
  'App.jsx',
  'main.jsx',
  'index.css',
  'config/env.js',
  'store/authStore.js',
  'api/client.js',
  'api/auth.api.js',
  'pharmacy/app/PharmacyRoutes.jsx',
  'pharmacy/app/PharmacyAuthGuard.jsx',
  'pharmacy/app/PharmacyFoundationPage.jsx',
  'pharmacy/app/pharmacyPaths.js',
  'features/auth/pages/AuthAcceptPage.jsx',
  'features/auth/pages/LoginPage.jsx',
  'features/auth/utils/mapAuthResponseToUser.js',
  'utils/sessionHandoff.js',
  'utils/sessionHandoff.test.js',
]);

const IMPORT_RE = /(?:import|export)\s+(?:type\s+)?(?:[^'"\n]+?\s+from\s+)?['"](\.[^'"]+)['"]|import\s*\(\s*['"](\.[^'"]+)['"]\s*\)/g;

const EXTENSIONS = ['', '.js', '.jsx', '.json', '/index.js', '/index.jsx'];

function shouldSkip(relPosix) {
  return SKIP_PREFIXES.some((p) => relPosix.startsWith(p));
}

function resolveImport(fromFile, spec) {
  const base = path.resolve(path.dirname(fromFile), spec);
  for (const ext of EXTENSIONS) {
    const candidate = base + ext;
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }
  return null;
}

function toWebRel(abs) {
  return path.relative(WEB_SRC, abs).split(path.sep).join('/');
}

function collectImports(absFile) {
  const text = fs.readFileSync(absFile, 'utf8');
  const specs = [];
  IMPORT_RE.lastIndex = 0;
  let m;
  while ((m = IMPORT_RE.exec(text))) {
    specs.push(m[1] || m[2]);
  }
  // side-effect CSS imports
  const cssRe = /import\s+['"](\.[^'"]+\.css)['"]/g;
  while ((m = cssRe.exec(text))) {
    specs.push(m[1]);
  }
  return specs;
}

function ensureCopied(absWebFile, queue, seen) {
  const rel = toWebRel(absWebFile);
  if (!rel || rel.startsWith('..') || shouldSkip(rel)) return;
  if (seen.has(rel)) return;
  seen.add(rel);

  const dest = path.join(OUT_SRC, rel);
  if (PROTECT.has(rel) && fs.existsSync(dest)) {
    // Still walk imports from the web version for closure, without overwriting.
    if (/\.(js|jsx)$/.test(absWebFile)) {
      for (const spec of collectImports(absWebFile)) {
        const resolved = resolveImport(absWebFile, spec);
        if (resolved && resolved.startsWith(WEB_SRC)) queue.push(resolved);
      }
    }
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(absWebFile, dest);

  if (/\.(js|jsx)$/.test(absWebFile)) {
    for (const spec of collectImports(absWebFile)) {
      const resolved = resolveImport(absWebFile, spec);
      if (!resolved) {
        console.warn(`MISSING import ${spec} from ${rel}`);
        continue;
      }
      // Only pull from web-frontend/src
      if (!resolved.startsWith(WEB_SRC)) continue;
      queue.push(resolved);
    }
  }
}

function main() {
  const queue = [];
  const seen = new Set();

  for (const seed of SEEDS) {
    const abs = path.join(WEB_SRC, seed);
    if (!fs.existsSync(abs)) {
      console.warn(`SEED missing: ${seed}`);
      continue;
    }
    queue.push(abs);
  }

  while (queue.length) {
    ensureCopied(queue.shift(), queue, seen);
  }

  console.log(`Copied ${seen.size} files into pharmacy-frontend/src`);
}

main();
