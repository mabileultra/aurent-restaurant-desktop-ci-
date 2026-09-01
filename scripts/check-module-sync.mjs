#!/usr/bin/env node
/**
 * Ensures frontend moduleHandbook ids exist in identity-service AdminModule.
 * Exit 1 on drift — run in CI before deploy.
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const handbook = readFileSync(join(root, 'web-frontend/src/config/moduleHandbook.js'), 'utf8');
const adminModule = readFileSync(
  join(root, 'identity-service/src/main/java/com/pos/identity/security/AdminModule.java'),
  'utf8'
);

const frontIds = [
  ...handbook.matchAll(/\{\s*id:\s*'([^']+)'/g),
].map((m) => m[1]);

const backIds = [
  ...adminModule.matchAll(/^\s+\w+\("([a-z][^"]*)",/gm),
].map((m) => m[1]);

const uniqueFront = [...new Set(frontIds)];
const missingInBackend = uniqueFront.filter((id) => !backIds.includes(id));
const extraInBackend = backIds.filter((id) => !uniqueFront.includes(id));

if (missingInBackend.length) {
  console.error('Modules in frontend handbook but missing in AdminModule.java:');
  missingInBackend.forEach((id) => console.error(`  - ${id}`));
}

if (extraInBackend.length) {
  console.warn('Modules in AdminModule.java but not in frontend handbook (info only):');
  extraInBackend.forEach((id) => console.warn(`  - ${id}`));
}

if (missingInBackend.length) {
  process.exit(1);
}

console.log(`Module sync OK (${uniqueFront.length} handbook modules)`);
