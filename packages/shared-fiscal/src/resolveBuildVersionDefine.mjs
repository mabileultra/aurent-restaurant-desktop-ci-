import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { formatVersionWithDate } from './appVersion.js';

function defaultExec(cmd) {
  return execSync(cmd, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
}

/**
 * Safely reads 7-char short git commit hash (`git rev-parse --short=7 HEAD`).
 * Returns empty string when git is unavailable or in archive/CI builds without .git.
 * @param {{ exec?: (cmd: string) => string | Buffer }} [options]
 * @returns {string}
 */
export function resolveGitShortHash(options = {}) {
  try {
    const run = options.exec || defaultExec;
    const raw = String(run('git rev-parse --short=7 HEAD') || '').trim();
    return /^[0-9a-f]{6,40}$/i.test(raw) ? raw.slice(0, 7) : '';
  } catch {
    return '';
  }
}

/**
 * Safely reads last git commit date in YYYY-MM-DD format (`git log -1 --format=%cs`).
 * Returns empty string when git is unavailable or in archive/CI builds without .git.
 * @param {{ exec?: (cmd: string) => string | Buffer }} [options]
 * @returns {string}
 */
export function resolveGitCommitDate(options = {}) {
  try {
    const run = options.exec || defaultExec;
    const raw = String(run('git log -1 --format=%cs') || '').trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : '';
  } catch {
    return '';
  }
}

/**
 * Builds Vite `define` map for `__APP_VERSION__`, `__APP_COMMIT_DATE__`, and `__APP_GIT_HASH__`.
 * @param {URL | string} packageJsonUrl
 * @param {{ exec?: (cmd: string) => string | Buffer }} [options]
 * @returns {{ __APP_VERSION__: string, __APP_COMMIT_DATE__: string, __APP_GIT_HASH__: string }}
 */
export function buildAppVersionDefine(packageJsonUrl, options = {}) {
  const pkg = JSON.parse(fs.readFileSync(packageJsonUrl, 'utf8'));
  const baseVersion = String(pkg?.version || '').trim();
  const commitDate = resolveGitCommitDate(options);
  const gitHash = resolveGitShortHash(options);
  const receiptVersion = formatVersionWithDate(baseVersion, commitDate);
  return {
    __APP_VERSION__: JSON.stringify(receiptVersion),
    __APP_COMMIT_DATE__: JSON.stringify(commitDate),
    __APP_GIT_HASH__: JSON.stringify(gitHash),
  };
}
