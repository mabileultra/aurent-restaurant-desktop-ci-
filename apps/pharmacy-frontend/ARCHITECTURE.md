# Pharmacy frontend — архитектура

## Роли продуктов

| Поверхность | Домен | Кто пользуется |
|-------------|-------|----------------|
| `pharmacy-frontend` → **p-aurent.uz** | UI аптеки | кассир, менеджер аптеки |
| `restaurant-frontend` → **r-aurent.uz** | UI заведения | официант, кухня, менеджер |
| `web-frontend` → **aurent.uz** | платформа / grocery / super-admin | платформа, розница |
| Backend services | данные и auth | все фронты |

**Правило:** аптечный UI делаем только здесь. Main фронт для pharmacy после cutover не расширяем — только handoff + platform.

## Границы

### Разрешено

- `src/pharmacy/**` — домен (POS, stock, ASL, returns, dashboard)
- `src/features/pharmacy-cashier/**`, `src/features/pharmacy-stock/**`
- `src/api/**` — HTTP к gateway / pharmacy-service / identity
- Auth bootstrap + безопасный Identity handoff (не JWT в URL)
- Собственный AppShell / router / Docker image

### Sync from main (bridge)

```bash
pnpm run sync:from-main
node scripts/fix-missing-from-build.mjs
```

Do not delete `/pharm` on aurent until offline drain + cutover.

### Phase 4 — product shape

- POS: `PharmacyPosShell`; Admin: `PharmacyAdminShell`
- Always `catalogKind: 'pharmacy'`
- No grocery scales / PLU

## Offline / Handoff

- Drain gate on main before hop (`pharmacyOfflineDrainGate`)
- Identity one-time code → `/auth/accept` (no JWT in URL)
- WorldGate cutover of `/pharm` — later, after lab flag

## Monorepo shared packages (active)

Root `pnpm-workspace.yaml` + `packages/@aurent/*`.  
Apps use `workspace:*`; Vite aliases via `packages/aurentAliases.mjs`.

See `packages/README.md` for the live package table and rules.
Layout: `apps/pharmacy-frontend` + desktop shell `apps/pharmacy-desktop`; shared: `packages/@aurent/*`.
