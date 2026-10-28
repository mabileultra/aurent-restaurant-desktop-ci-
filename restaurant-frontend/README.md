# Restaurant frontend (Aurent)

Отдельный SPA **только для ресторана / столовой**.  
Архитектура и границы: **[ARCHITECTURE.md](./ARCHITECTURE.md)**.

## Стек

- React 18 + Vite
- React Router + TanStack Query + Zustand
- Base UI: `src/components/ui` + BEM CSS в `src/styles/ui`
- Адаптив: `AppViewportSync` → compact / desktop / canonical (1024×768)
- Тесты: только `test/**` · лимит файла: **≤ 300 строк** (`pnpm run check:size`)

## Границы (кратко)

| Здесь | Не здесь |
|-------|----------|
| UI зала / кухни / админки ресторана | Супер-админ (остаётся в `web-frontend`) |
| Свои экраны + backend API | Правки main ради ресторанных страниц |
| `Base*` компоненты | pharmacy / finance / scales |

## Dev

```bash
cd restaurant-frontend
pnpm install
pnpm run dev
```

http://localhost:5174/login · `rstadmin` / `password`

## Prod

**https://r-aurent.uz** — host nginx → Docker `restaurant-frontend` (`127.0.0.1:5174`).

На сервере в `.env` (шаблон: `.env.example`, nginx: `deploy/nginx-host.conf.example`):

```env
VITE_RESTAURANT_APP_URL=https://r-aurent.uz
VITE_MAIN_APP_URL=https://aurent.uz
HTTP_PORT=127.0.0.1:8088
RESTAURANT_HTTP_PORT=127.0.0.1:5174
APP_CORS_ALLOWED_ORIGIN_PATTERNS=https://aurent.uz,https://www.aurent.uz,https://r-aurent.uz,https://www.r-aurent.uz,http://localhost:*,http://127.0.0.1:*
```

После смены `VITE_*` — rebuild `frontend` + `restaurant-frontend`. Подробно: `deploy/README.md` → SSL + dual domain.

## Дальше

1. Допиливать экраны склада/каталога/отчётов на r-aurent (≤300 строк + тесты в `test/`)
2. Backend при нехватке API
