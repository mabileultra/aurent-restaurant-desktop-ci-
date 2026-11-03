/**
 * Full local tenant reset for company switch on hall PC.
 * Stops edge → wipes Postgres → clears cloud session + company code → restarts stack.
 */
const { stopEdgeService, ensureEdgeService } = require('./edgeStack');
const { wipeEdgeDataDir } = require('./edgePostgresWipe');
const { clearLiveCloudSessionMemory } = require('./edgeLiveSync');
const { setCompanyLoginCode } = require('./companyCodeStore');

async function resetEdgeTenant({
  companyLoginCode = '',
  isPackaged = false,
  log = console.log,
  publishStatus,
} = {}) {
  const publish = typeof publishStatus === 'function' ? publishStatus : () => {};
  publish({
    phase: 'service',
    message: 'Смена компании — сброс локальных данных…',
    liveSession: false,
  });
  log('[edge] tenant reset: stop service');
  stopEdgeService();

  await wipeEdgeDataDir({ log });
  clearLiveCloudSessionMemory();
  const code = setCompanyLoginCode(companyLoginCode || '');
  log(`[edge] tenant reset: company code → ${code || '(cleared)'}`);

  publish({ phase: 'service', message: 'Создаём чистую локальную БД…' });
  const started = await ensureEdgeService({ isPackaged, log });
  publish({
    phase: 'ready',
    serviceHealthy: true,
    liveSession: false,
    message: 'Локальная БД сброшена — войдите админом онлайн',
  });
  return {
    ok: true,
    companyLoginCode: code,
    reused: Boolean(started?.reused),
  };
}

module.exports = { resetEdgeTenant };
