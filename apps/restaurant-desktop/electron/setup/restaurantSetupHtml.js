/** HTML for «Вид → Настройка сервера» (company + cloud only; password gate is separate). */
function buildRestaurantSetupHtml() {
  return `data:text/html;charset=utf-8,${encodeURIComponent(`<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <title>Aurent Restaurant — настройка</title>
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
    input {
      width: 100%; padding: 10px 12px; margin-bottom: 14px;
      border: 1px solid #cbd5e1; border-radius: 8px; font-size: 1rem; background: #fff;
    }
    button {
      width: 100%; padding: 12px; border: none; border-radius: 8px;
      background: #0f766e; color: #fff; font-size: 1rem; font-weight: 600; cursor: pointer;
    }
    button:hover { background: #0d9488; }
    .hint { font-size: 0.75rem; color: #64748b; margin-top: 12px; line-height: 1.4; }
    .err { color: #b91c1c; font-size: 0.85rem; min-height: 1.2em; margin-bottom: 8px; }
  </style>
</head>
<body>
  <h1>Настройка Aurent Restaurant</h1>
  <p>Код компании для PIN и адрес облака (r-aurent). Зал работает локально; облако — sync.</p>
  <form id="f">
    <label for="companyLoginCode">Код компании</label>
    <input id="companyLoginCode" name="companyLoginCode" placeholder="97125" inputmode="numeric" maxlength="5" autocomplete="off" style="letter-spacing:0.08em;font-family:ui-monospace,monospace;" />
    <label for="cloudApiUrl">Cloud API (HTTPS)</label>
    <input id="cloudApiUrl" name="cloudApiUrl" placeholder="https://r-aurent.uz/api/v1" autocomplete="off" />
    <div class="err" id="err"></div>
    <button type="submit">Сохранить</button>
  </form>
  <p class="hint">Пароль доступа к этому окну задаёт супер-админ в «Безопасность» (как у розничной кассы).</p>
  <script>
    const { ipcRenderer } = require('electron');
    const errEl = document.getElementById('err');
    ipcRenderer.invoke('restaurant-setup:get').then((data) => {
      document.getElementById('companyLoginCode').value = data.companyLoginCode || '';
      document.getElementById('cloudApiUrl').value = data.cloudApiUrl || '';
    }).catch(() => {});
    document.getElementById('f').addEventListener('submit', async (e) => {
      e.preventDefault();
      errEl.textContent = '';
      const companyLoginCode = document.getElementById('companyLoginCode').value.replace(/\\D/g, '').slice(0, 5);
      const cloudApiUrl = document.getElementById('cloudApiUrl').value.trim();
      if (companyLoginCode && companyLoginCode.length !== 5) {
        errEl.textContent = 'Код компании — 5 цифр (10000–99999)';
        return;
      }
      try {
        await ipcRenderer.invoke('restaurant-setup:save', { companyLoginCode, cloudApiUrl });
        window.close();
      } catch (err) {
        errEl.textContent = err.message || String(err);
      }
    });
  </script>
</body>
</html>`)}`;
}

module.exports = { buildRestaurantSetupHtml };
