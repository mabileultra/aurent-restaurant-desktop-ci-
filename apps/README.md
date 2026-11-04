# Apps

| Path | Product |
|------|---------|
| `web-frontend/` | aurent.uz — platform + grocery |
| `restaurant-frontend/` | r-aurent.uz |
| `pharmacy-frontend/` | p-aurent.uz |
| `desktop-electron/` | Electron касса (grocery / pharmacy shell) |
| `restaurant-desktop/` | Electron ресторан (edge) |

Shared libs: `../packages/@aurent/*`.  
Desktops keep their own `pnpm-lock.yaml` (not root workspace members).

```bash
pnpm install                 # root → SPA + packages
cd apps/web-frontend && pnpm dev
cd apps/desktop-electron && pnpm start
```
