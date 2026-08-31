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

function pickNewest(distDir, pattern) {
  const matched = fs.readdirSync(distDir).filter((name) => pattern.test(name));
  if (matched.length === 0) return null;
  matched.sort((a, b) => {
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
  const pkgPath = path.join(__dirname, '../package.json');
  if (fs.existsSync(pkgPath)) {
    return JSON.parse(fs.readFileSync(pkgPath, 'utf8')).version || '0.0.0';
  }
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

  const winName = pickNewest(dist, /\.exe$/i);
  const macName = pickNewest(dist, /\.dmg$/i);
  const zipName = pickNewest(dist, /\.zip$/i);

  const manifest = {
    version: readVersion(dist),
    releasedAt: new Date().toISOString(),
  };

  if (winName) manifest.windows = buildEntry(dist, winName);
  if (macName) manifest.mac = buildEntry(dist, macName);
  if (zipName) manifest.zip = buildEntry(dist, zipName);

  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  console.log(`manifest → ${out} (v${manifest.version})`);
}

main();
