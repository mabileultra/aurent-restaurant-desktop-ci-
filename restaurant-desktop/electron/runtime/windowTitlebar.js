/**
 * Windows/Linux: put «Вид» next to app title inside the native caption strip
 * (titleBarOverlay) — no second menu-bar row that lengthens the frame.
 * Classic Menu stays auto-hide (Alt).
 */
const TITLEBAR_HEIGHT = 36;

function usesOverlayTitlebar() {
  return process.platform === 'win32' || process.platform === 'linux';
}

function browserWindowChromeOptions() {
  if (!usesOverlayTitlebar()) {
    return {
      autoHideMenuBar: true,
    };
  }
  return {
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0f172a',
      symbolColor: '#e2e8f0',
      height: TITLEBAR_HEIGHT,
    },
  };
}

function titlebarInjectScript() {
  // Runs in page; opens View menu via preload bridge.
  return `(() => {
    if (window.__aurentTitlebarReady) return;
    window.__aurentTitlebarReady = true;
    const HEIGHT = ${TITLEBAR_HEIGHT};
    const style = document.createElement('style');
    style.textContent = \`
      :root { --aurent-titlebar-h: env(titlebar-area-height, \${HEIGHT}px); }
      #aurent-electron-titlebar {
        position: fixed;
        top: 0;
        left: 0;
        z-index: 2147483646;
        display: flex;
        align-items: center;
        gap: 10px;
        height: var(--aurent-titlebar-h);
        padding: 0 12px;
        padding-left: env(titlebar-area-x, 12px);
        width: env(titlebar-area-width, 100%);
        max-width: 100%;
        box-sizing: border-box;
        color: #e2e8f0;
        font: 600 13px/1 system-ui, Segoe UI, sans-serif;
        letter-spacing: 0.02em;
        pointer-events: none;
        -webkit-app-region: drag;
        app-region: drag;
        user-select: none;
      }
      #aurent-electron-titlebar .aurent-tb-brand {
        pointer-events: none;
        white-space: nowrap;
      }
      #aurent-electron-titlebar .aurent-tb-view {
        pointer-events: auto;
        -webkit-app-region: no-drag;
        app-region: no-drag;
        margin: 0;
        padding: 2px 10px;
        min-height: 24px;
        border: 1px solid rgb(148 163 184 / 0.28);
        border-radius: 6px;
        background: rgb(30 41 59 / 0.85);
        color: #f8fafc;
        font: inherit;
        font-weight: 650;
        font-size: 12px;
        cursor: pointer;
      }
      #aurent-electron-titlebar .aurent-tb-view:hover {
        border-color: rgb(255 122 26 / 0.65);
        background: rgb(51 65 85 / 0.95);
      }
      html.aurent-has-titlebar body {
        padding-top: var(--aurent-titlebar-h) !important;
        box-sizing: border-box;
      }
    \`;
    document.documentElement.classList.add('aurent-has-titlebar');
    document.head.appendChild(style);
    const bar = document.createElement('div');
    bar.id = 'aurent-electron-titlebar';
    bar.innerHTML = '<span class="aurent-tb-brand">Aurent Restaurant</span>'
      + '<button type="button" class="aurent-tb-view" aria-haspopup="menu">Вид</button>';
    const btn = bar.querySelector('.aurent-tb-view');
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const api = window.aurentRestaurant;
      if (api && typeof api.popupViewMenu === 'function') {
        void api.popupViewMenu();
      }
    });
    document.documentElement.appendChild(bar);
  })();`;
}

function attachOverlayTitlebar(win) {
  if (!usesOverlayTitlebar() || !win || win.isDestroyed()) return;
  const inject = () => {
    if (!win || win.isDestroyed()) return;
    win.webContents.executeJavaScript(titlebarInjectScript(), true).catch(() => {});
  };
  win.webContents.on('did-finish-load', inject);
  win.webContents.on('dom-ready', inject);
}

module.exports = {
  TITLEBAR_HEIGHT,
  usesOverlayTitlebar,
  browserWindowChromeOptions,
  attachOverlayTitlebar,
};
