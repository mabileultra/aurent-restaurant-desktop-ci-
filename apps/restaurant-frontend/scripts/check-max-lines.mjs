#!/usr/bin/env node
/**
 * Fail if any src .js/.jsx (except generated) exceeds MAX_LINES.
 * Usage: node scripts/check-max-lines.mjs
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('../src/', import.meta.url);
const MAX_LINES = 300;
const SKIP = new Set(['node_modules', 'dist']);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(js|jsx)$/.test(name) && !name.includes('.test.')) out.push(p);
  }
  return out;
}

const rootPath = ROOT.pathname;
const files = walk(rootPath);
const bad = [];
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  const lines = text.length ? text.split(/\r?\n/).length : 0;
  if (lines > MAX_LINES) {
    bad.push({ file: relative(join(rootPath, '..'), file), lines });
  }
}

if (bad.length) {
  console.error(`Files over ${MAX_LINES} lines (${bad.length}):`);
  for (const row of bad.sort((a, b) => b.lines - a.lines)) {
    console.error(`  ${row.lines}\t${row.file}`);
  }
  console.error('\nSplit into page / hook / utils / css. See ARCHITECTURE.md');
  process.exit(1);
}

console.log(`OK: all ${files.length} src files ≤ ${MAX_LINES} lines`);
