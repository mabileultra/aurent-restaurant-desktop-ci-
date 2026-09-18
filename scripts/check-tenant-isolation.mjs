#!/usr/bin/env node
/**
 * Tenant isolation guardrails for CI.
 * - web-backend JWT filter must use resolveCompanyIdSecure
 * - deprecated resolveCompanyId must not be used outside shared-kernel
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (entry === 'node_modules' || entry === 'target' || entry === '.git') continue;
      walk(full, files);
    } else if (entry.endsWith('.java')) {
      files.push(full);
    }
  }
  return files;
}

const backendFilter = readFileSync(
  join(root, 'web-backend/src/main/java/com/pos/security/JwtAuthenticationFilter.java'),
  'utf8'
);
const usesSharedResolver = backendFilter.includes('RequestActorResolver.resolve');
const usesDirectSecure = backendFilter.includes('resolveCompanyIdSecure');
if (!usesSharedResolver && !usesDirectSecure) {
  errors.push('web-backend JwtAuthenticationFilter must use RequestActorResolver or JwtClaimsExtractor.resolveCompanyIdSecure');
}
if (!backendFilter.includes('TenantHeaders.COMPANY_ID')) {
  errors.push('web-backend JwtAuthenticationFilter must read TenantHeaders.COMPANY_ID');
}

const requestActorResolver = readFileSync(
  join(root, 'shared-kernel/src/main/java/com/pos/shared/gateway/RequestActorResolver.java'),
  'utf8'
);
if (!requestActorResolver.includes('JwtClaimsExtractor.resolveCompanyIdSecure')) {
  errors.push('RequestActorResolver must use JwtClaimsExtractor.resolveCompanyIdSecure');
}

const javaFiles = walk(root);
for (const file of javaFiles) {
  if (file.endsWith('JwtClaimsExtractor.java')) continue;
  const text = readFileSync(file, 'utf8');
  if (text.includes('JwtClaimsExtractor.resolveCompanyId(')) {
    errors.push(`Use resolveCompanyIdSecure instead: ${file.replace(root + '/', '')}`);
  }
}

if (errors.length) {
  console.error('Tenant isolation check failed:\n');
  errors.forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
}

console.log('Tenant isolation checks passed');
