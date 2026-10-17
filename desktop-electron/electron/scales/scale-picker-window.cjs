const path = require('path');
const { BrowserWindow, ipcMain } = require('electron');
const { listSerialPorts } = require('./scale-serial-port.cjs');
const { readScaleSettings, writeScaleSettings } = require('./scale-config.cjs');
const { autoDetectPort, probePort } = require('./scale-auto-detect.cjs');
const { probeTcpHost, probeWeightOnTcp } = require('./scale-ethernet.cjs');

function buildPickerHtml() {
  const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <title>Aurent — весы</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      margin: 0; padding: 18px 20px 20px;
      background: #f1f5f9; color: #0f172a;
    }
    h1 { font-size: 1.1rem; margin: 0 0 4px; }
    .lead { margin: 0 0 12px; color: #475569; font-size: 0.8rem; line-height: 1.4; }
    .status { padding: 9px 11px; border-radius: 10px; font-size: 0.82rem; margin-bottom: 12px; }
    .status.ok { background: #ecfdf5; color: #047857; }
    .status.err { background: #fef2f2; color: #991b1b; }
    .status.info { background: #eff6ff; color: #1d4ed8; }
    .panels { display: flex; flex-direction: column; gap: 12px; }
    .panel {
      background: #fff; border: 1px solid #cbd5e1; border-radius: 12px;
      padding: 12px 14px 14px;
    }
    .panel h2 {
      margin: 0 0 4px; font-size: 0.95rem; font-weight: 700; color: #0f172a;
    }
    .panel .sub {
      margin: 0 0 10px; font-size: 0.75rem; color: #64748b; line-height: 1.35;
    }
    .list { display: flex; flex-direction: column; gap: 6px; max-height: 140px; overflow-y: auto; }
    .row {
      display: flex; flex-direction: column; gap: 2px;
      padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 8px;
      background: #f8fafc; cursor: pointer; font-size: 0.85rem;
    }
    .row.is-active { border-color: #0f766e; background: #ecfdf5; }
    .row .path { font-weight: 700; font-size: 0.9rem; }
    .row .meta { color: #64748b; font-size: 0.74rem; }
    label.field { display: block; margin: 8px 0 4px; font-size: 0.75rem; font-weight: 600; color: #475569; }
    label.field:first-of-type { margin-top: 0; }
    select, input[type="text"], input[type="number"] {
      width: 100%; padding: 8px 10px; border-radius: 8px;
      border: 1px solid #cbd5e1; font-size: 0.88rem; background: #fff;
    }
    .grid2 { display: grid; grid-template-columns: 1.4fr 1fr; gap: 8px; }
    .actions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
    button {
      flex: 1; min-width: 100px; padding: 9px 8px; border: none; border-radius: 9px;
      font-size: 0.82rem; font-weight: 600; cursor: pointer;
    }
    button.primary { background: #0f766e; color: #fff; }
    button.primary:disabled { background: #94a3b8; cursor: not-allowed; }
    button.secondary { background: #e2e8f0; color: #0f172a; }
    button.accent { background: #0284c7; color: #fff; }
    .footer { margin-top: 12px; }
    .footer button { width: 100%; }
    .hint { font-size: 0.72rem; color: #64748b; margin: 8px 0 0; line-height: 1.35; }
    .empty { color: #991b1b; font-size: 0.82rem; margin: 0; }
  </style>
</head>
<body>
  <h1>Настройка весов</h1>
  <p class="lead">COM и Ethernet — отдельно. Сохраните тот способ, которым подключены весы.</p>
  <div id="status" class="status info">Загрузка…</div>

  <div class="panels">
    <!-- ═══ COM ═══ -->
    <section class="panel" id="panel-com">
      <h2>1. COM / USB</h2>
      <p class="sub">Кабель в ПК → выберите порт и скорость → «Найти COM» или «Сохранить COM».</p>
      <div id="com-list"></div>
      <label class="field" for="baud">Скорость (baud)</label>
      <select id="baud">
        <option value="9600">9600</option>
        <option value="4800">4800</option>
        <option value="2400">2400</option>
        <option value="19200">19200</option>
      </select>
      <div class="actions">
        <button class="accent" id="auto-com" type="button">Найти COM</button>
        <button class="secondary" id="refresh" type="button">Обновить список</button>
        <button class="secondary" id="test-com" type="button">Проверить COM</button>
        <button class="primary" id="save-com" type="button" disabled>Сохранить COM</button>
      </div>
    </section>

    <!-- ═══ Ethernet ═══ -->
    <section class="panel" id="panel-eth">
      <h2>2. Ethernet (LAN)</h2>
      <p class="sub">ПК и весы в одной подсети. Укажите IP весов и TCP-порт (часто 1001) или «Найти Ethernet».</p>
      <div class="grid2">
        <div>
          <label class="field" for="host">IP весов</label>
          <input id="host" type="text" placeholder="192.168.0.203" autocomplete="off" />
        </div>
        <div>
          <label class="field" for="tcpPort">TCP-порт</label>
          <input id="tcpPort" type="number" min="1" max="65535" value="1001" />
        </div>
      </div>
      <div class="actions">
        <button class="accent" id="auto-eth" type="button">Найти Ethernet</button>
        <button class="secondary" id="test-eth" type="button">Проверить Ethernet</button>
        <button class="primary" id="save-eth" type="button">Сохранить Ethernet</button>
      </div>
    </section>
  </div>

  <div class="footer">
    <button class="secondary" id="cancel" type="button">Закрыть</button>
    <p class="hint">После сохранения касса подключается сама при следующем запуске.</p>
  </div>

  <script>
    const statusEl = document.getElementById('status');
    const baudEl = document.getElementById('baud');
    const hostEl = document.getElementById('host');
    const tcpPortEl = document.getElementById('tcpPort');
    const comListEl = document.getElementById('com-list');
    let ports = [];
    let selected = null;

    function setStatus(text, kind) {
      statusEl.textContent = text;
      statusEl.className = 'status ' + (kind || 'info');
    }

    function renderCom() {
      if (!ports.length) {
        comListEl.innerHTML = '<p class="empty">COM-порты не найдены. Подключите USB/COM и нажмите «Обновить список».</p>';
        document.getElementById('save-com').disabled = true;
        return;
      }
      comListEl.innerHTML = '<div class="list">' + ports.map(p => {
        const active = selected === p.path ? ' is-active' : '';
        const meta = [p.manufacturer, p.friendlyName].filter(Boolean).join(' · ') || '—';
        return '<div class="row' + active + '" data-path="' + p.path + '">'
          + '<span class="path">' + p.path + '</span>'
          + '<span class="meta">' + meta + '</span></div>';
      }).join('') + '</div>';
      document.querySelectorAll('#com-list .row').forEach(el => {
        el.onclick = () => {
          selected = el.getAttribute('data-path');
          document.getElementById('save-com').disabled = !selected;
          renderCom();
        };
      });
    }

    async function load() {
      setStatus('Загрузка настроек…', 'info');
      try {
        const data = await window.scalePicker.load();
        ports = data.ports || [];
        selected = data.currentPort || (ports[0] && ports[0].path) || null;
        if (data.baudRate) baudEl.value = String(data.baudRate);
        if (data.host) hostEl.value = data.host;
        if (data.tcpPort) tcpPortEl.value = String(data.tcpPort);
        document.getElementById('save-com').disabled = !selected;

        if (data.serialError) {
          setStatus('Модуль serialport: ' + data.serialError, 'err');
        } else if (data.transport === 'ethernet' && data.host) {
          setStatus('Сейчас: Ethernet ' + data.host + ':' + (data.tcpPort || ''), 'ok');
        } else if (selected) {
          setStatus('Сейчас: COM ' + selected + ' — или настройте Ethernet ниже', 'info');
        } else {
          setStatus('Выберите COM или укажите IP весов', 'info');
        }
        renderCom();
      } catch (e) {
        setStatus('Ошибка: ' + (e?.message || e), 'err');
      }
    }

    document.getElementById('refresh').onclick = () => load();
    document.getElementById('cancel').onclick = () => window.scalePicker.cancel();

    document.getElementById('auto-com').onclick = async () => {
      setStatus('Ищем весы по COM…', 'info');
      try {
        const r = await window.scalePicker.autoDetect({ prefer: 'com' });
        if (r.ok) {
          selected = r.port;
          if (r.baudRate) baudEl.value = String(r.baudRate);
          document.getElementById('save-com').disabled = false;
          setStatus('COM: ' + r.port + (r.reading ? ' (' + r.reading.kg + ' кг)' : '') + ' · сохранено', 'ok');
          await load();
        } else {
          setStatus(r.error || 'COM не найден', 'err');
        }
      } catch (e) {
        setStatus(e?.message || String(e), 'err');
      }
    };

    document.getElementById('auto-eth').onclick = async () => {
      setStatus('Ищем весы в локальной сети (TCP)…', 'info');
      try {
        const r = await window.scalePicker.autoDetect({ prefer: 'ethernet' });
        if (r.ok) {
          hostEl.value = r.host || '';
          if (r.tcpPort) tcpPortEl.value = String(r.tcpPort);
          setStatus(
            'Ethernet: ' + r.host + ':' + (r.tcpPort || '') +
            (r.reading ? ' (' + r.reading.kg + ' кг)' : '') +
            (r.hint ? ' — ' + r.hint : '') +
            ' · сохранено',
            'ok'
          );
        } else {
          setStatus(r.error || 'Ethernet не найден', 'err');
        }
      } catch (e) {
        setStatus(e?.message || String(e), 'err');
      }
    };

    document.getElementById('test-com').onclick = async () => {
      if (!selected) { setStatus('Сначала выберите COM-порт', 'err'); return; }
      setStatus('Проверка ' + selected + '…', 'info');
      try {
        const r = await window.scalePicker.testPort({ port: selected, baudRate: Number(baudEl.value) });
        if (r.ok && r.reading) {
          setStatus('COM вес: ' + r.reading.kg + ' кг (' + (r.reading.stable ? 'стабилен' : 'нестабилен') + ')', 'ok');
        } else if (r.ok) {
          setStatus('COM порт открыт. Положите товар на весы и повторите.', 'ok');
        } else {
          setStatus(r.error || 'Нет данных с COM', 'err');
        }
      } catch (e) {
        setStatus(e?.message || String(e), 'err');
      }
    };

    document.getElementById('test-eth').onclick = async () => {
      const host = String(hostEl.value || '').trim();
      const tcpPort = Number(tcpPortEl.value) || 0;
      if (!host || !tcpPort) { setStatus('Укажите IP и TCP-порт', 'err'); return; }
      setStatus('Проверка ' + host + ':' + tcpPort + '…', 'info');
      try {
        const r = await window.scalePicker.testEthernet({ host, tcpPort });
        if (r.ok && r.reading) {
          setStatus('Ethernet вес: ' + r.reading.kg + ' кг', 'ok');
        } else if (r.ok) {
          setStatus('TCP открыт на ' + host + ':' + tcpPort + '. Положите товар и повторите.', 'ok');
        } else {
          setStatus(r.error || 'TCP недоступен', 'err');
        }
      } catch (e) {
        setStatus(e?.message || String(e), 'err');
      }
    };

    document.getElementById('save-com').onclick = async () => {
      if (!selected) return;
      try {
        await window.scalePicker.save({
          transport: 'com',
          port: selected,
          baudRate: Number(baudEl.value),
        });
      } catch (e) {
        setStatus(e?.message || String(e), 'err');
      }
    };

    document.getElementById('save-eth').onclick = async () => {
      const host = String(hostEl.value || '').trim();
      const tcpPort = Number(tcpPortEl.value) || 0;
      if (!host) { setStatus('Укажите IP весов', 'err'); return; }
      if (!tcpPort) { setStatus('Укажите TCP-порт', 'err'); return; }
      try {
        await window.scalePicker.save({
          transport: 'ethernet',
          host,
          tcpPort,
        });
      } catch (e) {
        setStatus(e?.message || String(e), 'err');
      }
    };

    load();
  </script>
</body>
</html>`;
  return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
}

function showScalePickerWindow(mainWindow) {
  return new Promise((resolve, reject) => {
    const win = new BrowserWindow({
      width: 520,
      height: 720,
      resizable: true,
      title: 'Aurent — весы',
      autoHideMenuBar: true,
      parent: mainWindow && !mainWindow.isDestroyed() ? mainWindow : undefined,
      modal: Boolean(mainWindow && !mainWindow.isDestroyed()),
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        preload: path.join(__dirname, 'scale-picker-preload.cjs'),
      },
    });

    let settled = false;
    const cleanupIpc = () => {
      ipcMain.removeHandler('scale-picker:load');
      ipcMain.removeHandler('scale-picker:save');
      ipcMain.removeHandler('scale-picker:auto-detect');
      ipcMain.removeHandler('scale-picker:test');
      ipcMain.removeHandler('scale-picker:test-ethernet');
      ipcMain.removeAllListeners('scale-picker:cancel');
    };
    const finish = (value) => {
      if (settled) return;
      settled = true;
      cleanupIpc();
      if (!win.isDestroyed()) win.close();
      resolve(value);
    };

    ipcMain.handle('scale-picker:load', async () => {
      const settings = readScaleSettings();
      const listed = await listSerialPorts();
      return {
        ports: listed.ports,
        serialError: listed.error || null,
        transport: settings.transport,
        currentPort: settings.port,
        baudRate: settings.baudRate,
        host: settings.host,
        tcpPort: settings.tcpPort,
      };
    });

    ipcMain.handle('scale-picker:save', (_e, payload) => {
      const transport = String(payload?.transport || '').toLowerCase() === 'ethernet'
        ? 'ethernet'
        : 'com';

      if (transport === 'ethernet') {
        const host = String(payload?.host || '').trim();
        const tcpPort = Number(payload?.tcpPort) || 0;
        if (!host) throw new Error('Укажите IP весов');
        if (!tcpPort) throw new Error('Укажите TCP-порт');
        const saved = writeScaleSettings({
          scaleTransport: 'ethernet',
          scaleHost: host,
          scaleTcpPort: tcpPort,
          scaleFamily: 'family-shtrih-print',
        });
        finish(saved);
        return saved;
      }

      const port = String(payload?.port || '').trim();
      if (!port) throw new Error('Выберите COM-порт');
      const saved = writeScaleSettings({
        scaleTransport: 'com',
        scalePort: port,
        scaleBaudRate: Number(payload?.baudRate) || 9600,
        scaleFamily: 'weight-generic',
      });
      finish(saved);
      return saved;
    });

    ipcMain.handle('scale-picker:auto-detect', async (_e, payload) => {
      const prefer = String(payload?.prefer || '').toLowerCase();
      const baud = Number(readScaleSettings().baudRate) || 9600;
      return autoDetectPort({
        save: true,
        baudRate: baud,
        prefer: prefer === 'com' || prefer === 'ethernet' ? prefer : undefined,
      });
    });

    ipcMain.handle('scale-picker:test', async (_e, payload) => {
      const port = String(payload?.port || '').trim();
      const baudRate = Number(payload?.baudRate) || 9600;
      if (!port) throw new Error('Порт не указан');
      return probePort(port, baudRate, 3500);
    });

    ipcMain.handle('scale-picker:test-ethernet', async (_e, payload) => {
      const host = String(payload?.host || '').trim();
      const tcpPort = Number(payload?.tcpPort) || 0;
      if (!host || !tcpPort) throw new Error('Укажите IP и TCP-порт');
      const open = await probeTcpHost(host, tcpPort, 1200);
      if (!open.ok) {
        return { ok: false, error: 'TCP не отвечает на ' + host + ':' + tcpPort + ' (' + (open.error || 'fail') + ')' };
      }
      const weight = await probeWeightOnTcp(host, tcpPort, 2800);
      if (weight.ok) return weight;
      return { ok: true, host, tcpPort, hint: 'TCP открыт, вес пока не пришёл' };
    });

    ipcMain.on('scale-picker:cancel', () => finish(readScaleSettings()));

    win.on('closed', () => {
      if (!settled) {
        settled = true;
        cleanupIpc();
        resolve(readScaleSettings());
      }
    });

    win.loadURL(buildPickerHtml()).catch((err) => {
      if (!settled) {
        settled = true;
        cleanupIpc();
        reject(err);
      }
    });
  });
}

module.exports = { showScalePickerWindow };
