/**
 * Каталог семейств адаптеров + выгрузка PLU на активный адаптер.
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
    description: 'Ethernet UDP (порт 1111): вес + выгрузка PLU на клавиши весов.',
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

  if (active.id === 'family-shtrih-print') {
    const host = settings.host;
    const udpPort = Number(settings.tcpPort) || DEFAULT_UDP_PORT;
    return pushPluToShtrih(items, { host, udpPort });
  }

  return { ok: false, message: 'PLU push для этого адаптера ещё не реализован' };
}

module.exports = {
  listAdapters,
  getActiveAdapter,
  setActiveAdapter,
  pushPlu,
};
