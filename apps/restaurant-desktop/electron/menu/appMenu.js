const { Menu, app, dialog, shell } = require('electron');
const fs = require('fs');

const STRINGS = {
  ru: {
    app: 'Aurent Restaurant',
    about: 'О программе',
    quit: 'Выход',
    edit: 'Правка',
    undo: 'Отменить',
    redo: 'Повторить',
    cut: 'Вырезать',
    copy: 'Копировать',
    paste: 'Вставить',
    selectAll: 'Выделить всё',
    view: 'Вид',
    serverSettings: 'Настройка сервера…',
    checkUpdates: 'Проверить обновления…',
    openLogs: 'Папка с логами…',
    reload: 'Обновить',
    toggleFullscreen: 'На весь экран',
    toggleDevTools: 'Инструменты разработчика',
    window: 'Окно',
    minimize: 'Свернуть',
    close: 'Закрыть',
    help: 'Справка',
  },
  uz: {
    app: 'Aurent Restaurant',
    about: 'Dastur haqida',
    quit: 'Chiqish',
    edit: 'Tahrir',
    undo: 'Bekor qilish',
    redo: 'Qaytarish',
    cut: 'Kesish',
    copy: 'Nusxa',
    paste: 'Qo‘yish',
    selectAll: 'Hammasini belgilash',
    view: 'Ko‘rinish',
    serverSettings: 'Server sozlamasi…',
    checkUpdates: 'Yangilanishlarni tekshirish…',
    openLogs: 'Loglar papkasi…',
    reload: 'Yangilash',
    toggleFullscreen: 'To‘liq ekran',
    toggleDevTools: 'Dasturchi vositalari',
    window: 'Oyna',
    minimize: 'Yig‘ish',
    close: 'Yopish',
    help: 'Yordam',
  },
  en: {
    app: 'Aurent Restaurant',
    about: 'About',
    quit: 'Quit',
    edit: 'Edit',
    undo: 'Undo',
    redo: 'Redo',
    cut: 'Cut',
    copy: 'Copy',
    paste: 'Paste',
    selectAll: 'Select All',
    view: 'View',
    serverSettings: 'Server settings…',
    checkUpdates: 'Check for updates…',
    openLogs: 'Open logs folder…',
    reload: 'Reload',
    toggleFullscreen: 'Toggle Full Screen',
    toggleDevTools: 'Toggle Developer Tools',
    window: 'Window',
    minimize: 'Minimize',
    close: 'Close',
    help: 'Help',
  },
};

function normalizeLocale(raw) {
  const code = String(raw || 'ru').toLowerCase().slice(0, 2);
  return STRINGS[code] ? code : 'ru';
}

let lastHandlers = {
  reloadPage: null,
  openServerSettings: null,
  checkForUpdates: null,
};
let lastLocale = 'ru';

function openLogsFolder() {
  const dir = app.getPath('logs');
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  } catch {
    /* ignore */
  }
  return shell.openPath(dir);
}

function viewSubmenu(t) {
  return [
    {
      label: t.serverSettings,
      accelerator: 'CmdOrCtrl+,',
      click: () => {
        if (typeof lastHandlers.openServerSettings === 'function') {
          Promise.resolve(lastHandlers.openServerSettings()).catch(() => {});
        }
      },
    },
    {
      label: t.checkUpdates,
      click: () => {
        if (typeof lastHandlers.checkForUpdates !== 'function') return;
        Promise.resolve(lastHandlers.checkForUpdates())
          .then((result) => {
            if (result?.updateAvailable) {
              return dialog.showMessageBox({
                type: 'info',
                title: 'Aurent Restaurant',
                message: `Доступна версия ${result.version}`,
                detail: 'Загрузка начнётся автоматически. После скачивания перезапустите приложение.',
                buttons: ['OK'],
              });
            }
            if (result?.ok) {
              return dialog.showMessageBox({
                type: 'info',
                title: 'Aurent Restaurant',
                message: 'Установлена последняя версия',
                detail: result?.currentVersion
                  ? `Текущая версия: ${result.currentVersion}`
                  : undefined,
                buttons: ['OK'],
              });
            }
            if (result?.reason !== 'dev') {
              return dialog.showMessageBox({
                type: 'warning',
                title: 'Aurent Restaurant',
                message: 'Не удалось проверить обновления',
                detail: String(result?.error || result?.reason || 'unknown'),
                buttons: ['OK'],
              });
            }
            return undefined;
          })
          .catch((error) => {
            dialog.showMessageBox({
              type: 'warning',
              title: 'Aurent Restaurant',
              message: 'Не удалось проверить обновления',
              detail: String(error?.message || error || 'unknown'),
              buttons: ['OK'],
            }).catch(() => {});
          });
      },
    },
    {
      label: t.openLogs,
      click: () => {
        Promise.resolve(openLogsFolder()).catch(() => {});
      },
    },
    { type: 'separator' },
    {
      label: t.reload,
      accelerator: 'CmdOrCtrl+R',
      click: () => {
        if (typeof lastHandlers.reloadPage === 'function') {
          Promise.resolve(lastHandlers.reloadPage()).catch(() => {});
        }
      },
    },
    { role: 'togglefullscreen', label: t.toggleFullscreen },
    ...(app.isPackaged
      ? []
      : [{ type: 'separator' }, { role: 'toggleDevTools', label: t.toggleDevTools }]),
  ];
}

function buildAppMenu({
  locale = 'ru',
  reloadPage,
  openServerSettings,
  checkForUpdates,
} = {}) {
  lastLocale = normalizeLocale(locale);
  if (typeof reloadPage === 'function') lastHandlers.reloadPage = reloadPage;
  if (typeof openServerSettings === 'function') lastHandlers.openServerSettings = openServerSettings;
  if (typeof checkForUpdates === 'function') lastHandlers.checkForUpdates = checkForUpdates;
  const t = STRINGS[lastLocale];
  const isMac = process.platform === 'darwin';

  const template = [
    {
      label: t.app,
      submenu: [
        ...(isMac ? [{ role: 'about', label: t.about }] : []),
        { role: 'quit', label: t.quit },
      ],
    },
    {
      label: t.edit,
      submenu: [
        { role: 'undo', label: t.undo },
        { role: 'redo', label: t.redo },
        { type: 'separator' },
        { role: 'cut', label: t.cut },
        { role: 'copy', label: t.copy },
        { role: 'paste', label: t.paste },
        { role: 'selectAll', label: t.selectAll },
      ],
    },
    {
      label: t.view,
      submenu: viewSubmenu(t),
    },
    {
      label: t.window,
      submenu: [
        { role: 'minimize', label: t.minimize },
        { role: 'close', label: t.close },
      ],
    },
    {
      label: t.help,
      submenu: [
        { role: 'about', label: t.about },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function popupViewMenu(browserWindow) {
  const t = STRINGS[normalizeLocale(lastLocale)];
  const menu = Menu.buildFromTemplate(viewSubmenu(t));
  if (browserWindow && !browserWindow.isDestroyed()) {
    menu.popup({ window: browserWindow });
  } else {
    menu.popup();
  }
}

module.exports = { buildAppMenu, popupViewMenu, normalizeLocale };
