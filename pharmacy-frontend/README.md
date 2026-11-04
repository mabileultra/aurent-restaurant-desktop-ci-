# pharmacy-frontend

Отдельный SPA аптеки (**p-aurent.uz**). Sprint 1: foundation (Vite + Docker + nginx).

## Dev

```bash
cd pharmacy-frontend
pnpm install
pnpm dev   # http://127.0.0.1:5175
```

Env (optional `.env.development.local`):

- `VITE_MAIN_APP_URL` — ссылка на platform (default `https://aurent.uz`)
- `VITE_DEV_*_PROXY` — см. `vite.config.js`

## Build

```bash
pnpm build
```

Docker: образ поднимается сервисом `pharmacy-frontend` в compose (`PHARMACY_HTTP_PORT`, default `5175`).
