const { BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { PRODUCTION_ORIGIN } = require('../../config/publicUrl');
const { parseServerUrl } = require('../core/serverUrl');
const { saveServerConfig, userConfigPath } = require('../config/desktopConfig');

const DEFAULT_WEB_PORT = '443';
const DEFAULT_API_PORT = '443';

function readExistingForForm(existing) {
  const defaults = parseServerUrl(PRODUCTION_ORIGIN);
  const world = existing?.appWorld === 'restaurant' ? 'restaurant' : 'main';
  let parsed = {
    host: defaults.host,
    webPort: defaults.port || DEFAULT_WEB_PORT,
    apiPort: defaults.port || DEFAULT_API_PORT,
    companyLoginCode: '',
    appWorld: world,
  };

  if (existing?.cashierUrl) {
    const web = parseServerUrl(existing.cashierUrl);
    parsed = {
      host: web.host || parsed.host,
      webPort: existing.webPort || web.port || DEFAULT_WEB_PORT,
      apiPort: existing.apiPort || DEFAULT_API_PORT,
      companyLoginCode: existing.companyLoginCode || '',
      appWorld: world,
    };
  } else if (existing?.backendOrigin) {
    const api = parseServerUrl(existing.backendOrigin);
    parsed = {
      host: api.host || parsed.host,
      webPort: existing.webPort || DEFAULT_WEB_PORT,
      apiPort: existing.apiPort || api.port || DEFAULT_API_PORT,
      companyLoginCode: existing.companyLoginCode || '',
      appWorld: world,
    };
  }

  return parsed;
}

function buildSetupHtml(current) {
  const { host, webPort, apiPort, companyLoginCode, appWorld } = readExistingForForm(current);
  const intro =
    'Укажите адрес сервера и тип кассы. Ресторан открывается на r-aurent без перехода между сайтами.';
  const hint =
    'Порт <strong>443</strong> для HTTPS (www.aurent.uz). Для HTTP в локальной сети — <strong>8081</strong>. Проверка: <strong>/api/v1/actuator/health</strong> → {"status":"UP"}.';

  return `data:text/html;charset=utf-8,${encodeURIComponent(`<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <title>Aurent — настройка сервера</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      margin: 0; padding: 24px;
      background: #f1f5f9; color: #0f172a;
    }
    h1 { font-size: 1.25rem; margin: 0 0 8px; }
    p { margin: 0 0 16px; color: #475569; font-size: 0.9rem; line-height: 1.45; }
    label { display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 6px; color: #334155; }
    input, select {
      width: 100%; padding: 10px 12px; margin-bottom: 14px;
      border: 1px solid #cbd5e1; border-radius: 8px; font-size: 1rem;
      background: #fff;
    }
    button {
      width: 100%; padding: 12px; border: none; border-radius: 8px;
      background: #0f766e; color: #fff; font-size: 1rem; font-weight: 600; cursor: pointer;
    }
    button:hover { background: #0d9488; }
    .hint { font-size: 0.75rem; color: #64748b; margin-top: 12px; line-height: 1.4; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  </style>
</head>
<body>
  <h1>Настройка сервера Aurent</h1>
  <p>${intro}</p>
  <form id="f">
    <label for="appWorld">Тип кассы</label>
    <select id="appWorld" name="appWorld" required>
      <option value="main"${appWorld !== 'restaurant' ? ' selected' : ''}>Магазин / аптека (aurent.uz)</option>
      <option value="restaurant"${appWorld === 'restaurant' ? ' selected' : ''}>Ресторан (r-aurent.uz)</option>
    </select>
    <label for="host">Адрес API-сервера (IP или домен)</label>
    <input id="host" name="host" placeholder="www.aurent.uz или IP сервера" value="${host}" required autocomplete="off" />
    <label for="companyLoginCode">Код компании (для входа кассиров)</label>
    <input id="companyLoginCode" name="companyLoginCode" placeholder="10000" inputmode="numeric" maxlength="5" pattern="[0-9]{5}" value="${companyLoginCode}" required autocomplete="off" style="letter-spacing:0.08em;font-family:ui-monospace,monospace;" />
    <div class="row">
      <div>
        <label for="webPort">Порт сайта</label>
        <input id="webPort" name="webPort" type="number" placeholder="443" value="${webPort}" required />
      </div>
      <div>
        <label for="apiPort">Порт API</label>
        <input id="apiPort" name="apiPort" type="number" placeholder="443" value="${apiPort}" required />
      </div>
    </div>
    <button type="submit">Сохранить и продолжить</button>
  </form>
  <p class="hint">${hint}</p>
  <script>
    document.getElementById('f').addEventListener('submit', (e) => {
      e.preventDefault();
      const host = document.getElementById('host').value.trim();
      const webPort = document.getElementById('webPort').value.trim() || '443';
      const apiPort = document.getElementById('apiPort').value.trim() || webPort;
      const companyLoginCode = document.getElementById('companyLoginCode').value.replace(/\\D/g, '').slice(0, 5);
      const appWorld = document.getElementById('appWorld').value;
      window.setupApi.save({ host, webPort, apiPort, companyLoginCode, appWorld });
    });
  </script>
</body>
</html>`)}`;
}

function showSetupWindow(existing) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const win = new BrowserWindow({
      width: 440,
      height: 620,
      resizable: false,
      center: true,
      show: false,
      title: 'Aurent — настройка сервера',
      autoHideMenuBar: true,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        preload: path.join(__dirname, 'setup-preload.js'),
      },
    });

    ipcMain.once('setup:save', (_event, data) => {
      try {
        const saved = saveServerConfig(data);
        settled = true;
        win.close();
        resolve(saved);
      } catch (err) {
        settled = true;
        reject(err);
      }
    });

    win.once('ready-to-show', () => {
      win.show();
      win.focus();
    });

    win.on('closed', () => {
      ipcMain.removeAllListeners('setup:save');
      if (!settled) {
        reject(new Error('cancelled'));
      }
    });

    win.loadURL(buildSetupHtml(existing));
  });
}

module.exports = { showSetupWindow, userConfigPath };
