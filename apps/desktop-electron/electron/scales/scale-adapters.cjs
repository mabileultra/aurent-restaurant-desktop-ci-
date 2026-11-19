'use strict';
/**
 * Каталог семейств + выгрузка PLU + проверка связи по сохранённым весам.
 */
const { readScaleSettings, writeScaleSettings } = require('./scale-config.cjs');
const { pushPluToShtrih, probeShtrihUdp, DEFAULT_UDP_PORT, DEFAULT_PASSWORD } = require('./scale-shtrih-udp.cjs');

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
    description: 'Ethernet UDP 1111 (ПК→порт 2000): вес + PLU на все сохранённые весы.',
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

function mockUdpEnabled() {
  return process.env.POS_SCALE_MOCK_UDP === '1' || process.env.POS_SCALE_MOCK === 'udp';
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
  if (host) {
    return [{ host, udpPort: Number(settings.tcpPort) || DEFAULT_UDP_PORT, label: '' }];
  }
  if (mockUdpEnabled()) {
    return [{
      host: String(process.env.POS_SCALE_HOST || '127.0.0.1').trim(),
      udpPort: Number(process.env.POS_SCALE_MOCK_PORT || DEFAULT_UDP_PORT) || DEFAULT_UDP_PORT,
      label: 'mock-udp',
    }];
  }
  return [];
}

function resolvePassword(settings) {
  return String(
    process.env.POS_SCALE_PASSWORD
    || settings.password
    || DEFAULT_PASSWORD
  ).replace(/\D/g, '').padStart(4, '0').slice(-4);
}

/** Проверка связи 0x11 по всем сохранённым Ethernet-весам. */
async function probeDevices() {
  const settings = readScaleSettings();
  const targets = resolveShtrihTargets(settings);
  if (!targets.length) {
    return {
      ok: false,
      message: 'Нет сохранённых весов. Aurent → Весы → добавьте IP или «Найти в сети».',
      devices: [],
    };
  }
  const devices = [];
  for (const target of targets) {
    const res = await probeShtrihUdp(target.host, target.udpPort, 900);
    devices.push({
      host: target.host,
      udpPort: target.udpPort,
      label: target.label,
      ok: Boolean(res.ok),
      result: res.result,
      error: res.error || '',
      localPort: res.localPort,
    });
  }
  const online = devices.filter((d) => d.ok).length;
  return {
    ok: online > 0,
    online,
    total: devices.length,
    devices,
    message: online
      ? `Онлайн: ${online} из ${devices.length}`
      : 'Ни одни весы не ответили (UDP 1111 / firewall / IP)',
  };
}

/**
 * @param {Array} items — строки из GET /scales/sync/export
 */
async function pushPlu(items) {
  const settings = readScaleSettings();
  const active = getActiveAdapter();
  const password = resolvePassword(settings);

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

  const health = await probeDevices();
  const onlineHosts = new Set((health.devices || []).filter((d) => d.ok).map((d) => `${d.host}:${d.udpPort}`));
  if (!onlineHosts.size) {
    return {
      ok: false,
      message: health.message || 'Нет связи с весами — выгрузка отменена',
      devices: health.devices,
    };
  }

  const results = [];
  let okCount = 0;
  let pushedTotal = 0;

  for (const target of targets) {
    const key = `${target.host}:${target.udpPort}`;
    if (!onlineHosts.has(key)) {
      results.push({
        host: target.host,
        udpPort: target.udpPort,
        label: target.label,
        ok: false,
        pushed: 0,
        message: 'Пропуск: нет связи',
      });
      continue;
    }
    const res = await pushPluToShtrih(items, {
      host: target.host,
      udpPort: target.udpPort,
      password,
      requireOnline: false,
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
  const syncedAt = new Date().toISOString();
  writeScaleSettings({
    scaleLastPluSyncAt: syncedAt,
    scaleLastPluSyncPushed: pushedTotal,
    scaleLastPluSyncDevices: okCount,
  });
  return {
    ok: true,
    pushed: pushedTotal,
    deviceCount: okCount,
    deviceTotal: targets.length,
    devices: results,
    syncedAt,
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
  probeDevices,
  resolveShtrihTargets,
  mockUdpEnabled,
};
