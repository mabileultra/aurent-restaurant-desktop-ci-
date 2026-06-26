# Весы (фронтенд)

Мост к Electron-модулю `aurent-cashier-desktop/electron/scales/`.

- `scaleBridge.js` — вызовы `window.desktopCashier.*`
- `useScaleWeight.js` — подписка на показания при открытой модалке

В браузере без Electron вкладка «Весы» скрыта.

## Настройка в десктопе

Меню **Aurent → Весы** или кнопка **«Настроить весы…»** в модалке весового товара.

`openScalePicker()` / `scaleAutoDetect()` в `scaleBridge.js`.
