# Apps (logical)

SPA apps stay at repo root for Docker/deploy paths:

- `../web-frontend` → aurent.uz
- `../restaurant-frontend` → r-aurent.uz
- `../pharmacy-frontend` → p-aurent.uz

They are **pnpm workspace members** via root `pnpm-workspace.yaml`.
Physical move into `apps/` is optional later; do not do it casually (breaks compose contexts).
