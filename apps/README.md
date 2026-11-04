# Apps

| Path | Product |
|------|---------|
| `web-frontend/` | aurent.uz — platform + grocery |
| `restaurant-frontend/` | r-aurent.uz |
| `pharmacy-frontend/` | p-aurent.uz |
| `desktop-electron/` | Electron grocery / main cashier |
| `restaurant-desktop/` | Electron restaurant edge |
| `pharmacy-desktop/` | Electron pharmacy (p-aurent shell) |

Shared libs: `../packages/@aurent/*`.  
Desktops keep their own `pnpm-lock.yaml` (not root workspace members).

```bash
pnpm install                 # root → SPA + packages
cd apps/pharmacy-frontend && pnpm dev
cd apps/pharmacy-desktop && pnpm start
```
