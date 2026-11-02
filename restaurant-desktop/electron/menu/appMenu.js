const { Menu, app } = require('electron');

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

let lastReloadPage = null;
let lastLocale = 'ru';

function viewSubmenu(t, reloadPage) {
  return [
    {
      label: t.reload,
      accelerator: 'CmdOrCtrl+R',
      click: () => {
        if (typeof reloadPage === 'function') {
          Promise.resolve(reloadPage()).catch(() => {});
        }
      },
    },
    { role: 'togglefullscreen', label: t.toggleFullscreen },
    ...(app.isPackaged
      ? []
      : [{ type: 'separator' }, { role: 'toggleDevTools', label: t.toggleDevTools }]),
  ];
}

function buildAppMenu({ locale = 'ru', reloadPage } = {}) {
  lastLocale = normalizeLocale(locale);
  lastReloadPage = typeof reloadPage === 'function' ? reloadPage : lastReloadPage;
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
      submenu: viewSubmenu(t, lastReloadPage),
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

/** Popup «Вид» under the titlebar button — no permanent menu-bar row. */
function popupViewMenu(browserWindow) {
  const t = STRINGS[normalizeLocale(lastLocale)];
  const menu = Menu.buildFromTemplate(viewSubmenu(t, lastReloadPage));
  if (browserWindow && !browserWindow.isDestroyed()) {
    menu.popup({ window: browserWindow });
  } else {
    menu.popup();
  }
}

module.exports = { buildAppMenu, popupViewMenu, normalizeLocale };
