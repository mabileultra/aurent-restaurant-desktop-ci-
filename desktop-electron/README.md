# Aurent Cashier Desktop

Electron-оболочка для кассы и admin (1024×768+, зелёная иконка).

## Запуск

```bash
# из postsystem
bash scripts/start-cashier-desktop.sh

# или
cd desktop-electron
npm install
npm run sync-icons
AURENT_WEB_URL=http://localhost:5173/cashier/login npm start
```

## Сборка Windows / Mac

```bash
npm run dist
```

macOS собирается как **universal** `.dmg` (ручная установка) + `.zip` (автообновление через `electron-updater`). На CI (`macos-latest`) не используйте только `arm64` — Intel Mac не откроет такой установщик.

В `latest-mac.yml` для обновлений должен быть **zip**, не dmg — иначе ошибка `ZIP file not provided`.

В production-сборке (`app.isPackaged`) UI грузится с `https://aurent.uz/cashier/login`, API — `https://aurent.uz/api/v1` (см. `config/desktopUrls.js`).

Иконки генерируются из `web-frontend/public/desktop/icon.svg` (#10B981).

## Окно

- min 1024×768
- zoomFactor 1
- `color-scheme` admin — светлый (см. AdminThemeSync во frontend)
