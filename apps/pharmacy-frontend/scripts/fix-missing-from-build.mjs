#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const WEB_SRC = path.resolve(ROOT, '../web-frontend/src');
const OUT_SRC = path.join(ROOT, 'src');
const EXT = ['', '.js', '.jsx', '.css', '.json', '/index.js', '/index.jsx'];

function resolveFrom(importerAbs, spec) {
  const base = path.resolve(path.dirname(importerAbs), spec);
  for (const e of EXT) {
    const c = base + e;
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  }
  return null;
}

function runBuild() {
  return spawnSync('pnpm', ['run', 'build'], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
}

const ERR_RE = /Could not resolve "([^"]+)" from "([^"]+)"/;

let copied = 0;
for (let i = 0; i < 200; i += 1) {
  const res = runBuild();
  const out = `${res.stdout || ''}\n${res.stderr || ''}`;
  if (res.status === 0) {
    console.log(`BUILD_OK after ${copied} copies`);
    process.exit(0);
  }
  const m = out.match(ERR_RE);
  if (!m) {
    console.log(out.slice(-2500));
    console.error('No resolvable missing-import error; stopping');
    process.exit(1);
  }
  const [, spec, fromRel] = m;
  const importerInPharm = path.join(ROOT, fromRel);
  const importerInWeb = path.join(WEB_SRC, path.relative(OUT_SRC, importerInPharm));
  const resolved = resolveFrom(importerInWeb, spec);
  if (!resolved) {
    console.error(`UNRESOLVED ${spec} from ${fromRel}`);
    process.exit(1);
  }
  const rel = path.relative(WEB_SRC, resolved);
  const dest = path.join(OUT_SRC, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(resolved, dest);
  copied += 1;
  console.log(`COPIED ${rel}`);
}
console.error('Too many iterations');
process.exit(1);
