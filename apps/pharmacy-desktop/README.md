# Aurent Pharmacy Desktop

Отдельный Electron-продукт для аптеки (**p-aurent.uz**), рядом с:

- `apps/desktop-electron` — grocery / общая касса (aurent.uz)
- `apps/restaurant-desktop` — ресторан (r-aurent.uz)

## Dev

```bash
# SPA
cd apps/pharmacy-frontend && pnpm dev   # :5175

# Shell
cd apps/pharmacy-desktop && pnpm install && pnpm start
# или из корня:
bash scripts/start-pharmacy-desktop.sh
```

Bundled UI (offline / pack):

```bash
cd apps/pharmacy-desktop && pnpm run bundle-ui
```

Defaults: `https://p-aurent.uz/login`, update feed `https://aurent.uz/downloads/pharmacy-desktop/`.
