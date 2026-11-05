/** Логи автопечати чека ESC/POS — консоль + локальный журнал activity-logs. */

const PREFIX = '[Aurent-ESCPOS]';

function appendPersistent(level, step, detail) {
  try {
    const { appendActivityLog } = require('../activity-log/activityLogStore.cjs');
    appendActivityLog({
      category: 'print',
      level,
      message: `ESC/POS ${step}`,
      meta: detail && typeof detail === 'object' ? detail : detail ? { detail: String(detail) } : undefined,
    });
  } catch {
    /* ignore if app path not ready */
  }
}

function logStep(jobId, step, detail) {
  if (detail && Object.keys(detail).length > 0) {
    console.info(PREFIX, jobId, step, detail);
    appendPersistent('info', step, { jobId, ...detail });
    return;
  }
  console.info(PREFIX, jobId, step);
  appendPersistent('info', step, { jobId });
}

function logWarn(jobId, step, detail) {
  if (detail && Object.keys(detail).length > 0) {
    console.warn(PREFIX, jobId, step, detail);
    appendPersistent('warn', step, { jobId, ...detail });
    return;
  }
  console.warn(PREFIX, jobId, step);
  appendPersistent('warn', step, { jobId });
}

function logError(jobId, step, err) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(PREFIX, jobId, step, msg);
  appendPersistent('error', step, { jobId, message: msg });
}

function createJobId() {
  return `escpos-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

module.exports = {
  PREFIX,
  logStep,
  logWarn,
  logError,
  createJobId,
};
