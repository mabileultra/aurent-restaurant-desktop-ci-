const { parseScaleLine } = require('./scale-parser.cjs');
const { tryLoadSerialPort, listSerialPorts } = require('./scale-serial-port.cjs');
const { createMockReader } = require('./scale-mock.cjs');
const { readScaleSettings } = require('./scale-config.cjs');
const { autoDetectPort } = require('./scale-auto-detect.cjs');
const { createEthernetReader } = require('./scale-ethernet.cjs');

let portInstance = null;
let parser = null;
let mockReader = null;
let ethernetReader = null;
let lastReading = null;
let broadcastFn = null;
let listening = false;

function setBroadcast(fn) {
  broadcastFn = fn;
}

function emitReading(reading) {
  if (!reading || reading.kg == null) return;
  lastReading = {
    kg: reading.kg,
    stable: Boolean(reading.stable),
    raw: reading.raw || '',
    at: Date.now(),
  };
  if (typeof broadcastFn === 'function') {
    broadcastFn(lastReading);
  }
}

async function startListening() {
  if (listening) return { ok: true, mode: lastReading?.mode || 'active' };

  const settings = readScaleSettings();
  const useMock = process.env.POS_SCALE_MOCK === '1' || settings.mock === true;

  if (useMock) {
    mockReader = createMockReader(emitReading);
    mockReader.start();
    listening = true;
    return { ok: true, mode: 'mock', message: 'Mock scale' };
  }

  // Ethernet (ШТРИХ-ПРИНТ и т.п.)
  if (settings.transport === 'ethernet') {
    let host = settings.host;
    let tcpPort = settings.tcpPort || 1001;
    if (!host) {
      const detected = await autoDetectPort({ save: true, prefer: 'ethernet' });
      if (detected.ok && detected.host) {
        host = detected.host;
        tcpPort = detected.tcpPort || 1001;
      } else {
        return {
          ok: false,
          mode: 'no-host',
          message: detected.error || 'Ethernet-весы не найдены. Нажмите «Автопоиск».',
          suggestPicker: true,
        };
      }
    }
    ethernetReader = createEthernetReader(host, tcpPort, emitReading);
    listening = true;
    return { ok: true, mode: 'ethernet', host, tcpPort, family: settings.family };
  }

  // COM / USB
  const { SerialPort, ReadlineParser, error: serialError } = tryLoadSerialPort();
  if (serialError) {
    // Нет serialport — пробуем Ethernet как запасной путь.
    const eth = await autoDetectPort({ save: true, prefer: 'ethernet' });
    if (eth.ok && eth.host) {
      ethernetReader = createEthernetReader(eth.host, eth.tcpPort || 1001, emitReading);
      listening = true;
      return { ok: true, mode: 'ethernet', host: eth.host, tcpPort: eth.tcpPort, family: 'family-shtrih-print' };
    }
    return { ok: false, mode: 'unavailable', message: serialError };
  }

  let path = settings.port || process.env.POS_SCALE_PORT;
  if (!path) {
    const detected = await autoDetectPort({ save: true });
    if (detected.ok && detected.transport === 'ethernet' && detected.host) {
      ethernetReader = createEthernetReader(detected.host, detected.tcpPort || 1001, emitReading);
      listening = true;
      return {
        ok: true,
        mode: 'ethernet',
        host: detected.host,
        tcpPort: detected.tcpPort,
        family: detected.family || 'family-shtrih-print',
      };
    }
    if (detected.ok && detected.port) {
      path = detected.port;
    } else {
      return {
        ok: false,
        mode: 'no-port',
        message:
          detected.error ||
          'Весы не найдены. Меню Aurent → «Весы» или «Автопоиск» (COM и Ethernet).',
        suggestPicker: true,
        ports: detected.ports || [],
      };
    }
  }

  const baudRate = Number(settings.baudRate || process.env.POS_SCALE_BAUD || 9600);

  try {
    await stopListening();
    portInstance = new SerialPort({ path, baudRate, autoOpen: false });
    parser = portInstance.pipe(new ReadlineParser({ delimiter: '\r\n' }));

    parser.on('data', (line) => {
      const parsed = parseScaleLine(line);
      if (parsed) emitReading(parsed);
    });

    portInstance.on('error', (err) => {
      emitReading({ kg: lastReading?.kg ?? 0, stable: false, raw: err?.message || 'serial error' });
    });

    await new Promise((resolve, reject) => {
      portInstance.open((err) => (err ? reject(err) : resolve()));
    });

    listening = true;
    return { ok: true, mode: 'serial', port: path, baudRate };
  } catch (err) {
    await stopListening();
    return { ok: false, mode: 'error', message: err?.message || String(err) };
  }
}

async function stopListening() {
  listening = false;
  if (mockReader) {
    mockReader.stop();
    mockReader = null;
  }
  if (ethernetReader) {
    ethernetReader.stop();
    ethernetReader = null;
  }
  if (portInstance?.isOpen) {
    await new Promise((resolve) => {
      portInstance.close(() => resolve());
    });
  }
  portInstance = null;
  parser = null;
}

function getLastReading() {
  return lastReading;
}

function captureStable() {
  if (!lastReading) return null;
  if (!lastReading.stable) return { ...lastReading, error: 'unstable' };
  return { kg: lastReading.kg, stable: true, raw: lastReading.raw };
}

async function getStatus() {
  const settings = readScaleSettings();
  const { error: serialError } = tryLoadSerialPort();
  const ports = await listSerialPorts();
  return {
    listening,
    lastReading,
    settings,
    serialModuleLoaded: !serialError,
    serialModuleError: serialError || null,
    ports: ports.ports,
    mockEnv: process.env.POS_SCALE_MOCK === '1',
  };
}

module.exports = {
  setBroadcast,
  startListening,
  stopListening,
  getLastReading,
  captureStable,
  getStatus,
  listSerialPorts,
};
