# Весы (фронтенд)

Мост к Electron-модулю `aurent-cashier-desktop/electron/scales/`.

- `scaleBridge.js` — вызовы `window.desktopCashier.*` (любая модель → вес в кг)
- `useScaleWeight.js` — подписка на показания при открытой модалке / станции

В браузере без Electron вкладка «Весы» скрыта / станция показывает «нужна desktop-касса».

## Модуль станции

`features/scales/` — отдельный модуль:

- `/scales/plu` — назначение PLU весовым товарам
- `/scales/station` — PLU → товар → вес → автопечать этикетки (как ценники через `shelfLabelPrint`)

Формат штрихкода: EAN-13 `20 + PLU(5) + граммы(5) + check`.

## Универсальные адаптеры (Desktop)

Много моделей = **семейства** (MASSA-K, CAS, Digi, Rongta…), не файл на каждую модель.

- Контракт: `aurent-cashier-desktop/electron/scales/adapters/`
- Каталог семейств: `GET /scales/sync/adapters`
- Пакет PLU: `GET /scales/sync/export`
- UI: **Коды PLU** → «Выгрузить на умные весы»
- **Сейчас работает:** `weight-generic` (COM/USB → кг) и `family-shtrih-print` (Ethernet UDP 1111 + вес + **выгрузка PLU**)
- **Умные весы (PLU push):** ШТРИХ-ПРИНТ — да; остальные семейства — слоты без протокола

## Настройка в десктопе

Меню **Aurent → Весы** или **«Автопоиск»** на станции: ищет **и COM, и Ethernet**, сохраняет и дальше соединяет само.
