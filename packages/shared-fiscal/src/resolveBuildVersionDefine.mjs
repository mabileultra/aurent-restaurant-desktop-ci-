import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { formatVersionWithHash } from './appVersion.js';

/**
 * Safely reads short git commit hash (`git rev-parse --short HEAD`).
 * Returns empty string when git is unavailable or in archive/CI builds without .git.
 * @param {{ exec?: (cmd: string) => string | Buffer }} [options]
 * @returns {string}
 */
export function resolveGitShortHash(options = {}) {
  try {
    const run = options.exec || ((cmd) => execSync(cmd, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }));
    const raw = String(run('git rev-parse --short HEAD') || '').trim();
    return /^[0-9a-f]{6,40}$/i.test(raw) ? raw : '';
  } catch {
    return '';
  }
}

/**
 * Builds Vite `define` map for `__APP_VERSION__` (with short git hash if available) and `__APP_GIT_HASH__`.
 * @param {URL | string} packageJsonUrl
 * @param {{ exec?: (cmd: string) => string | Buffer }} [options]
 * @returns {{ __APP_VERSION__: string, __APP_GIT_HASH__: string }}
 */
export function buildAppVersionDefine(packageJsonUrl, options = {}) {
  const pkg = JSON.parse(fs.readFileSync(packageJsonUrl, 'utf8'));
  const baseVersion = String(pkg?.version || '').trim();
  const gitHash = resolveGitShortHash(options);
  const fullVersion = formatVersionWithHash(baseVersion, gitHash);
  return {
    __APP_VERSION__: JSON.stringify(fullVersion),
    __APP_GIT_HASH__: JSON.stringify(gitHash),
  };
}
