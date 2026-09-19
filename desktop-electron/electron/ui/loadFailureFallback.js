function buildLoadErrorHtml({ url, errorCode, errorDescription }) {
  return `<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8"><title>Aurent Cashier</title>
<style>body{margin:0;font-family:system-ui,sans-serif;background:#e9eef4;color:#1e293b;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px;box-sizing:border-box}
.card{max-width:480px;background:#fff;border-radius:12px;padding:24px;box-shadow:0 8px 32px rgb(15 23 42 / 0.12)}
h1{margin:0 0 12px;font-size:1.25rem}p{margin:0 0 8px;line-height:1.5;color:#475569}code{font-size:.85rem;background:#f1f5f9;padding:2px 6px;border-radius:4px;word-break:break-all}</style></head>
<body><div class="card"><h1>Не удалось загрузить интерфейс</h1>
<p>Проверьте интернет и настройки сервера (Вид → Настройка сервера).</p>
<p>Если включён локальный интерфейс: Вид → Интерфейс с сайта.</p>
<p><code>${String(url || '')}</code></p>
<p>Ошибка ${errorCode}: ${errorDescription}</p></div></body></html>`;
}

function attachLoadFailureFallback(mainWindow, {
  getExpectedUrl,
  getStartSource,
  fallbackToRemote,
}) {
  let fallingBack = false;

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (validatedURL !== getExpectedUrl()) return;

    if (getStartSource() === 'bundled' && !fallingBack && typeof fallbackToRemote === 'function') {
      fallingBack = true;
      Promise.resolve(fallbackToRemote())
        .catch(() => {})
        .finally(() => {
          fallingBack = false;
        });
      return;
    }

    const html = buildLoadErrorHtml({
      url: validatedURL,
      errorCode,
      errorDescription,
    });
    mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  });
}

module.exports = { buildLoadErrorHtml, attachLoadFailureFallback };
