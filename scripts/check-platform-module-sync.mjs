#!/usr/bin/env node
/**
 * Ensures grantable PLATFORM_ADMIN modules stay in sync:
 * identity PlatformAdminModule keys ↔ frontend platformNav modules.
 * Security must stay SUPER_ADMIN-only; Access is grantable.
 * Exit 1 on drift — run in CI before deploy.
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const backend = readFileSync(
  join(root, 'identity-service/src/main/java/com/pos/identity/security/PlatformAdminModule.java'),
  'utf8'
);
const nav = readFileSync(
  join(root, 'web-frontend/src/features/platform/nav/platformNav.js'),
  'utf8'
);

const backendKeys = [...backend.matchAll(/^\s+\w+\("([a-zA-Z][^"]*)",\s*"platform"\)/gm)].map((m) => m[1]);
const navGrantable = [...nav.matchAll(/module:\s*'([^']+)'/g)].map((m) => m[1]);
const superAdminOnly = [...nav.matchAll(/to:\s*'([^']+)'[^\n]*superAdminOnly:\s*true/g)].map((m) => m[1]);

const missingInNav = backendKeys.filter((id) => !navGrantable.includes(id));
const extraInNav = navGrantable.filter((id) => !backendKeys.includes(id));
const forbidden = navGrantable.filter((id) => id === 'platformSecurity');

let failed = false;

if (missingInNav.length) {
  failed = true;
  console.error('Platform modules in PlatformAdminModule.java missing from platformNav.js:');
  missingInNav.forEach((id) => console.error(`  - ${id}`));
}

if (extraInNav.length) {
  failed = true;
  console.error('platformNav.js grantable modules missing from PlatformAdminModule.java:');
  extraInNav.forEach((id) => console.error(`  - ${id}`));
}

if (forbidden.length) {
  failed = true;
  console.error('Security must not be grantable to PLATFORM_ADMIN:');
  forbidden.forEach((id) => console.error(`  - ${id}`));
}

if (superAdminOnly.length !== 1 || !superAdminOnly.includes('/platform/security')) {
  failed = true;
  console.error('Expected SUPER_ADMIN-only nav: /platform/security, got:', superAdminOnly);
}

if (!navGrantable.includes('platformAccess')) {
  failed = true;
  console.error('platformAccess must be grantable in platformNav.js');
}

if (failed) {
  process.exit(1);
}

console.log(`Platform module sync OK (${backendKeys.length} grantable, ${superAdminOnly.length} super-admin-only)`);
