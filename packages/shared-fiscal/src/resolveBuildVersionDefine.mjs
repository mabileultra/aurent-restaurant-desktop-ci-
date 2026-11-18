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
 * Resolves `VITE_LICENSE_NUMBER` at build/dev config time from a single source of truth:
 * 1. `process.env.VITE_LICENSE_NUMBER` (Docker build ARG/ENV or shell env)
 * 2. Repository root `.env` (`../../.env` from `apps/<app>/package.json`)
 * 3. Repository root `.env.example` (`../../.env.example` from `apps/<app>/package.json`)
 * Never hardcodes the license value in JS code.
 * @param {URL | string} packageJsonUrl
 * @param {{ env?: Record<string, string | undefined> }} [options]
 * @returns {string}
 */
export function resolveBuildLicenseNumber(packageJsonUrl, options = {}) {
  const envObj = options.env || (typeof process !== 'undefined' ? process.env : undefined);
  if (envObj && envObj.VITE_LICENSE_NUMBER !== undefined) {
    return String(envObj.VITE_LICENSE_NUMBER).trim();
  }

  try {
    const baseUrl =
      packageJsonUrl instanceof URL ? packageJsonUrl : new URL(String(packageJsonUrl));
    const candidates = [
      new URL('../../.env', baseUrl),
      new URL('../../.env.example', baseUrl),
    ];
    for (const candidateUrl of candidates) {
      if (!fs.existsSync(candidateUrl)) continue;
      const content = fs.readFileSync(candidateUrl, 'utf8');
      const match = content.match(/^\s*VITE_LICENSE_NUMBER\s*=\s*(.*?)\s*$/m);
      if (match) {
        return match[1].replace(/^['"]|['"]$/g, '').trim();
      }
    }
  } catch {
    // ignore
  }
  return '';
}

/**
 * Builds Vite `define` map for `__APP_VERSION__`, `__APP_COMMIT_DATE__`, and `__APP_GIT_HASH__`,
 * and propagates `VITE_LICENSE_NUMBER` from root `.env` / `.env.example` into `process.env`
 * for local `vite dev`, local `vite build`, and Electron `bundle-ui` builds.
 * @param {URL | string} packageJsonUrl
 * @param {{ exec?: (cmd: string) => string | Buffer, env?: Record<string, string | undefined> }} [options]
 * @returns {{ __APP_VERSION__: string, __APP_COMMIT_DATE__: string, __APP_GIT_HASH__: string }}
 */
export function buildAppVersionDefine(packageJsonUrl, options = {}) {
  const pkg = JSON.parse(fs.readFileSync(packageJsonUrl, 'utf8'));
  const baseVersion = String(pkg?.version || '').trim();
  const commitDate = resolveGitCommitDate(options);
  const gitHash = resolveGitShortHash(options);
  const receiptVersion = formatVersionWithDate(baseVersion, commitDate);

  if (
    typeof process !== 'undefined' &&
    process.env &&
    !process.env.VITEST &&
    process.env.VITE_LICENSE_NUMBER === undefined
  ) {
    const resolvedLicense = resolveBuildLicenseNumber(packageJsonUrl, options);
    if (resolvedLicense) {
      process.env.VITE_LICENSE_NUMBER = resolvedLicense;
    }
  }

  return {
    __APP_VERSION__: JSON.stringify(receiptVersion),
    __APP_COMMIT_DATE__: JSON.stringify(commitDate),
    __APP_GIT_HASH__: JSON.stringify(gitHash),
  };
}
