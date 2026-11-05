/**
 * Каталог семейств адаптеров + выгрузка PLU (на все сохранённые Ethernet-весы).
 */
const { readScaleSettings, writeScaleSettings } = require('./scale-config.cjs');
const { pushPluToShtrih, DEFAULT_UDP_PORT } = require('./scale-shtrih-udp.cjs');

const ADAPTERS = [
  {
    id: 'weight-generic',
    name: 'Любые весы (только вес)',
    description: 'COM/USB → кг. Печать этикетки в Aurent.',
    modelsHint: 'RS-232/USB текст',
    family: false,
    readyNow: true,
    capabilities: { weight: true, pluPush: false, builtInPrint: false },
  },
  {
    id: 'family-shtrih-print',
    name: 'ШТРИХ-ПРИНТ',
    description: 'Ethernet UDP (порт 1111): вес + выгрузка PLU на все сохранённые весы.',
    modelsHint: 'ШТРИХ-ПРИНТ М и близкие',
    family: true,
    readyNow: true,
    capabilities: { weight: true, pluPush: true, builtInPrint: true },
  },
];

function listAdapters() {
  return ADAPTERS.map((a) => ({ ...a, capabilities: { ...a.capabilities } }));
}

function getAdapterById(id) {
  return listAdapters().find((a) => a.id === id) || null;
}

function getActiveAdapter() {
  const settings = readScaleSettings();
  const id = settings.family || (settings.transport === 'ethernet' ? 'family-shtrih-print' : 'weight-generic');
  return getAdapterById(id) || getAdapterById('weight-generic');
}

function setActiveAdapter(adapterId) {
  const next = getAdapterById(adapterId);
  if (!next) throw new Error('Неизвестный адаптер: ' + adapterId);
  writeScaleSettings({
    scaleFamily: next.id,
    scaleTransport: next.id === 'family-shtrih-print' ? 'ethernet' : 'com',
  });
  return getActiveAdapter();
}

function resolveShtrihTargets(settings) {
  const fromList = Array.isArray(settings.hosts) ? settings.hosts : [];
  if (fromList.length) {
    return fromList.map((h) => ({
      host: h.host,
      udpPort: Number(h.udpPort) || DEFAULT_UDP_PORT,
      label: h.label || '',
    }));
  }
  const host = String(settings.host || '').trim();
  if (!host) return [];
  return [{ host, udpPort: Number(settings.tcpPort) || DEFAULT_UDP_PORT, label: '' }];
}

/**
 * @param {Array} items — строки из GET /scales/sync/export
 */
async function pushPlu(items) {
  const settings = readScaleSettings();
  const active = getActiveAdapter();

  if (!active?.capabilities?.pluPush) {
    return {
      ok: false,
      message: 'Выберите адаптер «ШТРИХ-ПРИНТ» и сохраните IP весов (Aurent → Весы).',
    };
  }

  if (active.id !== 'family-shtrih-print') {
    return { ok: false, message: 'PLU push для этого адаптера ещё не реализован' };
  }

  const targets = resolveShtrihTargets(settings);
  if (!targets.length) {
    return {
      ok: false,
      message: 'Нет сохранённых Ethernet-весов. Aurent → Весы → добавьте IP (можно несколько).',
    };
  }

  const results = [];
  let okCount = 0;
  let pushedTotal = 0;

  for (const target of targets) {
    const res = await pushPluToShtrih(items, {
      host: target.host,
      udpPort: target.udpPort,
    });
    results.push({
      host: target.host,
      udpPort: target.udpPort,
      label: target.label,
      ok: Boolean(res.ok),
      pushed: res.pushed || 0,
      message: res.message || res.hint || '',
    });
    if (res.ok) {
      okCount += 1;
      pushedTotal = res.pushed || pushedTotal;
    }
  }

  if (okCount === 0) {
    return {
      ok: false,
      message: 'Не удалось выгрузить ни на одни весы: ' + results.map((r) => r.host + ' — ' + r.message).join('; '),
      devices: results,
    };
  }

  const fail = results.filter((r) => !r.ok);
  return {
    ok: true,
    pushed: pushedTotal,
    deviceCount: okCount,
    deviceTotal: targets.length,
    devices: results,
    message: fail.length
      ? `Выгружено на ${okCount} из ${targets.length} весов`
      : `Выгружено на ${okCount} весов`,
  };
}

module.exports = {
  listAdapters,
  getActiveAdapter,
  setActiveAdapter,
  pushPlu,
  resolveShtrihTargets,
};
