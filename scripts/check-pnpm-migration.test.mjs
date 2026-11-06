import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const REQUIRED_PNPM_PACKAGES = [
  'apps/web-frontend',
  'apps/restaurant-frontend',
  'apps/pharmacy-frontend',
  'apps/desktop-electron',
  'apps/restaurant-desktop',
  'apps/pharmacy-desktop',
  'bots/telegram-support-bot',
  'bots/telegram-web-support-bot',
];

const REQUIRED_WORKSPACES = [
  'apps/web-frontend',
  'apps/restaurant-frontend',
  'apps/pharmacy-frontend',
  'apps/desktop-electron',
  'apps/restaurant-desktop',
  'apps/pharmacy-desktop',
];

const DOCKERFILES = [
  'apps/web-frontend/Dockerfile',
  'apps/restaurant-frontend/Dockerfile',
  'apps/pharmacy-frontend/Dockerfile',
  'bots/telegram-support-bot/Dockerfile',
  'bots/telegram-web-support-bot/Dockerfile',
];

const WORKFLOW_FILES = [
  '.github/workflows/release-desktop.yml',
  '.github/workflows/release-restaurant-desktop.yml',
];

describe('Repository PNPM Migration Integrity', () => {
  it('no obsolete package-lock.json files exist in any project directory', () => {
    function findPackageLocks(dir) {
      const results = [];
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'target') {
          continue;
        }
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          results.push(...findPackageLocks(fullPath));
        } else if (entry.name === 'package-lock.json') {
          results.push(fullPath);
        }
      }
      return results;
    }

    const locks = findPackageLocks(rootDir);
    assert.deepEqual(locks, [], `Found stale package-lock.json files: ${locks.join(', ')}`);
  });

  it('all required Node.js subprojects have pnpm-lock.yaml', () => {
    for (const pkg of REQUIRED_PNPM_PACKAGES) {
      const lockPath = path.join(rootDir, pkg, 'pnpm-lock.yaml');
      assert.ok(fs.existsSync(lockPath), `Missing pnpm-lock.yaml in ${pkg}`);
      const stat = fs.statSync(lockPath);
      assert.ok(stat.size > 0, `pnpm-lock.yaml in ${pkg} must not be empty`);
    }
  });

  it('native subprojects have pnpm-workspace.yaml with allowBuilds configuration', () => {
    for (const pkg of REQUIRED_WORKSPACES) {
      const workspacePath = path.join(rootDir, pkg, 'pnpm-workspace.yaml');
      assert.ok(fs.existsSync(workspacePath), `Missing pnpm-workspace.yaml in ${pkg}`);
      const content = fs.readFileSync(workspacePath, 'utf8');
      assert.match(content, /allowBuilds:/, `${pkg}/pnpm-workspace.yaml must contain allowBuilds`);
    }
  });

  it('all Dockerfiles use corepack and pnpm --frozen-lockfile', () => {
    for (const relPath of DOCKERFILES) {
      const fullPath = path.join(rootDir, relPath);
      assert.ok(fs.existsSync(fullPath), `Dockerfile not found: ${relPath}`);
      const content = fs.readFileSync(fullPath, 'utf8');
      assert.match(content, /corepack\s+enable/, `${relPath} must enable corepack`);
      assert.match(content, /pnpm\s+install/i, `${relPath} must run pnpm install`);
      assert.match(content, /--frozen-lockfile/, `${relPath} must use --frozen-lockfile`);
      assert.doesNotMatch(content, /\bnpm\s+(install|ci)\b/, `${relPath} must not contain npm install/ci`);
    }
  });

  it('GitHub Actions release workflows only use pnpm and do not reference package-lock.json', () => {
    for (const relPath of WORKFLOW_FILES) {
      const fullPath = path.join(rootDir, relPath);
      assert.ok(fs.existsSync(fullPath), `Workflow not found: ${relPath}`);
      const content = fs.readFileSync(fullPath, 'utf8');
      assert.match(content, /pnpm\/action-setup/, `${relPath} must use pnpm action setup`);
      assert.match(content, /pnpm-lock\.yaml/, `${relPath} must cache pnpm-lock.yaml`);
      assert.doesNotMatch(content, /package-lock\.json/, `${relPath} must not reference package-lock.json`);
      assert.doesNotMatch(content, /\bnpm\s+ci\b/, `${relPath} must not run npm ci`);
    }
  });

  it('.gitignore includes pnpm-debug.log*', () => {
    const gitignorePath = path.join(rootDir, '.gitignore');
    const content = fs.readFileSync(gitignorePath, 'utf8');
    assert.match(content, /pnpm-debug\.log\*/, '.gitignore must include pnpm-debug.log*');
  });
});
