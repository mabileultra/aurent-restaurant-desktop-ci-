const { Menu, dialog } = require('electron');
const { UI_MODE_REMOTE, UI_MODE_BUNDLED } = require('../config/uiMode');

function buildAppMenu({
  openServerSettings,
  reloadPage,
  checkForUpdates,
  uiMode = UI_MODE_REMOTE,
  setUiMode,
  allowBundledUi = false,
  offlineFirst = false,
  setOfflineFirst,
}) {
  const showUiModeMenu = allowBundledUi || uiMode === UI_MODE_BUNDLED || offlineFirst;
  const uiModeItems = showUiModeMenu
    ? [
        {
          label: 'Интерфейс с сайта (как сейчас)',
          type: 'radio',
          checked: uiMode !== UI_MODE_BUNDLED,
          click: () => {
            if (typeof setUiMode === 'function') {
              Promise.resolve(setUiMode(UI_MODE_REMOTE)).catch(() => {});
            }
          },
        },
        {
          label: 'Локальный интерфейс (тест)',
          type: 'radio',
          checked: uiMode === UI_MODE_BUNDLED,
          click: () => {
            if (typeof setUiMode === 'function') {
              Promise.resolve(setUiMode(UI_MODE_BUNDLED)).catch(() => {});
            }
          },
        },
        { type: 'separator' },
        {
          label: 'Ждать сайт (как сейчас)',
          type: 'radio',
          checked: !offlineFirst,
          click: () => {
            if (typeof setOfflineFirst === 'function') {
              Promise.resolve(setOfflineFirst(false)).catch(() => {});
            }
          },
        },
        {
          label: 'Касса без ожидания сайта (тест)',
          type: 'radio',
          checked: Boolean(offlineFirst),
          click: () => {
            if (typeof setOfflineFirst === 'function') {
              Promise.resolve(setOfflineFirst(true)).catch(() => {});
            }
          },
        },
        { type: 'separator' },
      ]
    : [];

  const template = [
    {
      label: 'Aurent',
      submenu: [{ role: 'quit', label: 'Выход' }],
    },
    {
      label: 'Вид',
      submenu: [
        {
          label: 'Настройка сервера…',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            openServerSettings().catch(() => {
              /* cancelled */
            });
          },
        },
        { type: 'separator' },
        ...uiModeItems,
        {
          label: 'Проверить обновления…',
          click: () => {
            checkForUpdates()
              .then((result) => {
                if (result?.updateAvailable) {
                  dialog.showMessageBox({
                    type: 'info',
                    title: 'Aurent — обновление',
                    message: `Доступна версия ${result.version}`,
                    detail: 'Загрузка начнётся автоматически. После скачивания перезапустите кассу.',
                    buttons: ['OK'],
                  }).catch(() => {});
                } else if (result?.ok) {
                  dialog.showMessageBox({
                    type: 'info',
                    title: 'Aurent — обновление',
                    message: 'Установлена последняя версия',
                    detail: result?.currentVersion
                      ? `Текущая версия: ${result.currentVersion}`
                      : undefined,
                    buttons: ['OK'],
                  }).catch(() => {});
                } else if (result?.reason !== 'dev') {
                  dialog.showMessageBox({
                    type: 'warning',
                    title: 'Aurent — обновление',
                    message: 'Не удалось проверить обновления',
                    detail: String(result?.error || result?.reason || 'unknown'),
                    buttons: ['OK'],
                  }).catch(() => {});
                }
              })
              .catch((error) => {
                dialog.showMessageBox({
                  type: 'warning',
                  title: 'Aurent — обновление',
                  message: 'Не удалось проверить обновления',
                  detail: String(error?.message || error || 'unknown'),
                  buttons: ['OK'],
                }).catch(() => {});
              });
          },
        },
        { type: 'separator' },
        {
          label: 'Обновить',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            reloadPage().catch(() => {});
          },
        },
        { role: 'togglefullscreen', label: 'На весь экран' },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

module.exports = { buildAppMenu };
