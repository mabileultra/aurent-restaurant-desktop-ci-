const { Menu, dialog } = require('electron');
const { UI_MODE_REMOTE, UI_MODE_BUNDLED } = require('../config/uiMode');

function buildAppMenu({
  openServerSettings,
  reloadPage,
  checkForUpdates,
  openScalePicker,
  uiMode = UI_MODE_REMOTE,
  setUiMode,
  allowBundledUi = false,
  offlineFirst = false,
  setOfflineFirst,
  appWorld = 'main',
  openActivityLogs,
  openActivityLogFolder,
  openAdminLogin,
}) {
  const isRestaurant = String(appWorld || '').toLowerCase() === 'restaurant'
    || String(appWorld || '').toLowerCase() === 'rst';
  const showUiModeMenu = allowBundledUi
    || uiMode === UI_MODE_BUNDLED
    || offlineFirst;
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
          label: isRestaurant ? 'Локальный UI ресторана (тест)' : 'Локальный интерфейс (тест)',
          type: 'radio',
          checked: uiMode === UI_MODE_BUNDLED,
          click: () => {
            if (typeof setUiMode === 'function') {
              Promise.resolve(setUiMode(UI_MODE_BUNDLED)).catch(() => {});
            }
          },
        },
        { type: 'separator' },
        ...(!isRestaurant
          ? [
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
            ]
          : []),
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
          label: 'Вход в админку',
          click: () => {
            if (typeof openAdminLogin === 'function') {
              Promise.resolve(openAdminLogin()).catch(() => {});
            }
          },
        },
        { type: 'separator' },
        {
          label: 'Настройка сервера…',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            openServerSettings().catch(() => {
              /* cancelled */
            });
          },
        },
        {
          label: 'Весы…',
          click: () => {
            if (typeof openScalePicker === 'function') {
              Promise.resolve(openScalePicker()).catch(() => {});
            }
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
          label: 'Журнал операций…',
          accelerator: 'CmdOrCtrl+L',
          click: () => {
            if (typeof openActivityLogs === 'function') {
              openActivityLogs();
            }
          },
        },
        {
          label: 'Папка с логами…',
          click: () => {
            if (typeof openActivityLogFolder === 'function') {
              Promise.resolve(openActivityLogFolder()).catch(() => {});
            }
          },
        },
        { type: 'separator' },
        {
          label: 'Обновить',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            Promise.resolve(reloadPage())
              .then((result) => {
                if (result?.reason === 'offline') {
                  dialog.showMessageBox({
                    type: 'warning',
                    title: 'Aurent Cashier',
                    message: 'Нет интернета',
                    detail:
                      'Пока нет сети, «Обновить» нельзя — интерфейс загружается с сайта и сбросится. Сначала подключите интернет.',
                    buttons: ['OK'],
                  }).catch(() => {});
                }
              })
              .catch(() => {});
          },
        },
        { role: 'togglefullscreen', label: 'На весь экран' },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

module.exports = { buildAppMenu };
