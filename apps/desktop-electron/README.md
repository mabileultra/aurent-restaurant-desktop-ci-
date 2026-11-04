# Aurent Cashier Desktop

Electron-оболочка для кассы. UI кассы — тот же `web-frontend`.

**По умолчанию касса открывается с сайта, как сейчас у всех клиентов.** Локальный UI — только тестовый режим (меню «Вид»).

## Запуск

```bash
# из postsystem — как у клиентов (сайт)
bash scripts/start-cashier-desktop.sh

# тестовая касса на этой машине (bundled + offlineFirst + native sqlite)
bash scripts/start-cashier-desktop.sh --test
```
# или
cd desktop-electron
pnpm install
pnpm run sync-icons
AURENT_WEB_URL=http://localhost:5173/cashier/login pnpm start
```

## Режим интерфейса

| Режим | Как включить | Поведение |
|---|---|---|
| `remote` (по умолчанию) | ничего / **Вид → Интерфейс с сайта** | окно грузит сайт, как у клиентов |
| `bundled` (тест) | **Вид → Локальный интерфейс (тест)** | окно с диска + прокси `/api` |

Если локальный UI не открылся — автоматически включается `remote`. То же вручную: **Вид → Интерфейс с сайта**.

Переменная `AURENT_UI_MODE=remote|bundled` перекрывает `config.json`.

Пункты меню смены режима **скрыты у клиентов**. Чтобы включить тест:

```bash
AURENT_UI_DEV=1 pnpm start
```

или в `config.json`: `"allowBundledUi": true`.

Сборка локального UI в `desktop-electron/ui/`:

```bash
pnpm run bundle-ui
```

## Офлайн-база

По умолчанию **native SQLite** (быстрее bootstrap/поиск). Если native-модуль не загрузился — автоматически sql.js.

Откат на sql.js:

```bash
AURENT_OFFLINE_ENGINE=sqljs pnpm start
```

или в `config.json`: `"offlineEngine": "sqljs"`.

## Старт без ожидания сайта (фаза 6, тест)

По умолчанию **выключено**: касса сначала считает API онлайн, как сейчас.

Включить:

```bash
AURENT_UI_DEV=1 AURENT_OFFLINE_FIRST=1 pnpm start
```

или `"offlineFirst": true` в `config.json`.

Тогда: короче таймаут продажи, сразу локальный путь если API тупит, полоска offline до первого успешного probe. Откат: `AURENT_OFFLINE_FIRST=0` или **Вид → Ждать сайт**.

## Сборка Windows / Mac

```bash
pnpm run dist
```

Не поднимайте `version` в `package.json`, пока не решите выкладывать установщик клиентам: автообновление разнесёт релиз по всем кассам.

macOS собирается как **universal** `.dmg` (ручная установка) + `.zip` (автообновление через `electron-updater`). На CI (`macos-latest`) не используйте только `arm64` — Intel Mac не откроет такой установщик.

В `latest-mac.yml` для обновлений должен быть **zip**, не dmg — иначе ошибка `ZIP file not provided`.

В production-сборке (`app.isPackaged`) при `uiMode=remote` UI грузится с `https://aurent.uz/cashier/login`, API — `https://aurent.uz/api/v1` (см. `config/desktopUrls.js`).

Иконки генерируются из `web-frontend/public/desktop/icon.svg` (#10B981).

## Окно

- min 1024×768
- zoomFactor 1
- `color-scheme` admin — светлый (см. AdminThemeSync во frontend)
