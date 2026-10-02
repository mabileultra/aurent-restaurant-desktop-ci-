/** Persistent activity-log lines for restaurant local-first (online + offline). */

const CATEGORY = 'local_first';

function append(level, message, meta) {
  try {
    const { appendActivityLog } = require('../activity-log/activityLogStore.cjs');
    appendActivityLog({
      category: CATEGORY,
      level,
      message: String(message || ''),
      meta: meta && typeof meta === 'object' ? meta : undefined,
    });
  } catch {
    /* app path not ready in unit tests */
  }
  const line = `[rst-local-first] ${message}`;
  if (level === 'error') console.error(line, meta || '');
  else if (level === 'warn') console.warn(line, meta || '');
  else console.info(line, meta || '');
}

function logInfo(message, meta) {
  append('info', message, meta);
}

function logWarn(message, meta) {
  append('warn', message, meta);
}

function logError(message, meta) {
  append('error', message, meta);
}

module.exports = {
  CATEGORY,
  logInfo,
  logWarn,
  logError,
};
