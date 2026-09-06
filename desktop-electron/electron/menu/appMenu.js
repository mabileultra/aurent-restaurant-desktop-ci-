const { Menu, dialog } = require('electron');

function buildAppMenu({ openServerSettings, reloadPage, checkForUpdates }) {
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
