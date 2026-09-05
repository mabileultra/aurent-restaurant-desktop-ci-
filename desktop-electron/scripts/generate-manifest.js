#!/usr/bin/env node
/**
 * Генерирует downloads/desktop/manifest.json для страницы /install.
 * Usage: node scripts/generate-manifest.js --dist ./dist --out ../downloads/desktop/manifest.json
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const args = { dist: path.join(__dirname, '../dist'), out: null };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === '--dist' && argv[i + 1]) {
      args.dist = path.resolve(argv[i + 1]);
      i += 1;
    } else if (argv[i] === '--out' && argv[i + 1]) {
      args.out = path.resolve(argv[i + 1]);
      i += 1;
    }
  }
  if (!args.out) {
    args.out = path.resolve(args.dist, '../manifest.json');
  }
  return args;
}

function sha256File(filePath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

function parseSemver(name) {
  const match = String(name).match(/(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    raw: match[0],
  };
}

function semverScore(v) {
  if (!v) return -1;
  return v.major * 1_000_000 + v.minor * 1_000 + v.patch;
}

function readPackageVersion() {
  const pkgPath = path.join(__dirname, '../package.json');
  if (!fs.existsSync(pkgPath)) return null;
  return JSON.parse(fs.readFileSync(pkgPath, 'utf8')).version || null;
}

/**
 * Prefer: exact package version in name → highest semver in name → newest mtime.
 * Avoids old Setup-*.exe winning after scp flattens mtimes.
 */
function pickBest(distDir, pattern, preferredVersion = null) {
  const matched = fs.readdirSync(distDir).filter((name) => pattern.test(name));
  if (matched.length === 0) return null;

  matched.sort((a, b) => {
    const verA = parseSemver(a);
    const verB = parseSemver(b);
    if (preferredVersion) {
      const prefA = a.includes(preferredVersion) ? 1 : 0;
      const prefB = b.includes(preferredVersion) ? 1 : 0;
      if (prefA !== prefB) return prefB - prefA;
    }
    const scoreDiff = semverScore(verB) - semverScore(verA);
    if (scoreDiff !== 0) return scoreDiff;
    const statA = fs.statSync(path.join(distDir, a));
    const statB = fs.statSync(path.join(distDir, b));
    return statB.mtimeMs - statA.mtimeMs;
  });
  return matched[0];
}

function buildEntry(distDir, fileName) {
  const fullPath = path.join(distDir, fileName);
  const stat = fs.statSync(fullPath);
  return {
    url: `/downloads/desktop/${fileName}`,
    fileName,
    size: stat.size,
    sha256: sha256File(fullPath),
  };
}

function readVersion(distDir) {
  const pkgVersion = readPackageVersion();
  if (pkgVersion) return pkgVersion;
  const yml = fs.readdirSync(distDir).find((name) => name === 'latest.yml');
  if (yml) {
    const content = fs.readFileSync(path.join(distDir, yml), 'utf8');
    const match = content.match(/^version:\s*(.+)$/m);
    if (match) return match[1].trim();
  }
  return '0.0.0';
}

function main() {
  const { dist, out } = parseArgs(process.argv);
  if (!fs.existsSync(dist)) {
    console.error(`dist not found: ${dist}`);
    process.exit(1);
  }

  const preferredVersion = readPackageVersion();
  const winName = pickBest(dist, /\.exe$/i, preferredVersion);
  const macName =
    pickBest(dist, /mac-universal\.dmg$/i, preferredVersion)
    || pickBest(dist, /mac-x64\.dmg$/i, preferredVersion)
    || pickBest(dist, /\.dmg$/i, preferredVersion);
  const zipName = pickBest(dist, /\.zip$/i, preferredVersion);

  const fileVersion =
    parseSemver(winName || '')?.raw
    || parseSemver(macName || '')?.raw
    || parseSemver(zipName || '')?.raw
    || preferredVersion
    || '0.0.0';

  const manifest = {
    version: fileVersion,
    releasedAt: new Date().toISOString(),
  };

  if (winName) manifest.windows = buildEntry(dist, winName);
  if (macName) manifest.mac = buildEntry(dist, macName);
  if (zipName) manifest.zip = buildEntry(dist, zipName);

  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  console.log(`manifest → ${out} (v${manifest.version})`);
  console.log(`  win=${winName || '-'} mac=${macName || '-'} zip=${zipName || '-'}`);
}

main();
