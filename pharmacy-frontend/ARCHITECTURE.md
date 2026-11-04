# Pharmacy frontend — архитектура

## Роли продуктов

| Поверхность | Домен | Кто пользуется |
|-------------|-------|----------------|
| `pharmacy-frontend` → **p-aurent.uz** | UI аптеки | кассир, менеджер аптеки |
| `restaurant-frontend` → **r-aurent.uz** | UI заведения | официант, кухня, менеджер |
| `web-frontend` → **aurent.uz** | платформа / grocery / super-admin | платформа, розница |
| Backend services | данные и auth | все фронты |

**Правило:** аптечный UI делаем только здесь. Main фронт для pharmacy после cutover не расширяем — только handoff + platform.

## Границы (Sprint 1+)

### Разрешено

- `src/pharmacy/**` — домен (POS, stock, ASL, returns, dashboard)
- `src/features/pharmacy-cashier/**`, `src/features/pharmacy-stock/**`
- `src/api/**` — HTTP к gateway / pharmacy-service / identity
- Auth bootstrap + безопасный Identity handoff (не JWT в URL)
- Собственный AppShell / router / Docker image

### Sync from main (Sprint 3)

```bash
pnpm run sync:from-main          # seed + transitive copy
node scripts/fix-missing-from-build.mjs   # close Vite graph if needed
```

Do not delete `/pharm` on aurent until offline drain + cutover.

### Phase 4 — product shape (in progress)

- POS chrome: `src/pharmacy/pos/PharmacyPosShell` (not grocery `CashierLayout`).
- Admin chrome: `src/pharmacy/app/PharmacyAdminShell` + `pharmacy-admin-shell.css` / `pharmacyAdminNav.js`.
- Always `catalogKind: 'pharmacy'` on this SPA (`pharmacy/config/vertical.js`).
- `useCompanyBusinessType` / `useCashierStoreProfile` force pharmacy world (no grocery flicker).
- Scale PLU stubbed (`tryResolveWeightPluProduct` → null); pharmacy weight modal has no hardware scales.
- Pharmacy barcodes use local `ean13` (not scales utils).
- Removed dead `scales/`, `features/scales/`, grocery `PosPage` / scale `WeightEntryModal` from this package.

### Запрещено

- Копировать весь `web-frontend`
- Grocery / restaurant / platform-admin UI
- Удалять старый `/pharm` на aurent до offline drain + cutover
- Prod cutover без явного подтверждения

## Offline

Разные origin = разные IndexedDB/SW. Cutover только после синхронизации очереди на старом клиенте.
Handoff gate (main): `pharmacyOfflineDrainGate` — блокирует CTA / `/auth/pharmacy-handoff`, пока `pendingSales > 0` или идёт sync.

## Handoff (Sprint 2)

1. Main (authenticated): `POST /api/v1/auth/handoff` `{ "audience": "PHARMACY" }` → `{ code, expiresInSeconds }`.
2. Redirect: `p-aurent.uz/auth/accept?code=…&next=/pos` — **no JWT in URL**.
3. Pharmacy: `POST /api/v1/auth/handoff/exchange` `{ "code" }` → `AuthResponse` (new JWT in SPA storage).
4. Code is one-time, ~60s TTL, audience bound to company `PHARMACY`.

Helper on main: `web-frontend/src/utils/pharmacyAppRedirect.js` (`redirectToPharmacyApp`).
Explicit UI (no silent hop): `PharmacySpaLaunchButton` on `/pharm` POS topbar + stock layout;
entry URL `/auth/pharmacy-handoff?next=…` (requires aurent session).
WorldGate cutover (block `/pharm` UI) — later, after offline drain + lab flag.

---

## Monorepo shared packages (scaffold)

Scaffold: `packages/@aurent/*` + `pnpm-workspace.example.yaml` (workspace not active yet).  
**First extract:** `@aurent/shared-auth` used by web + pharmacy via Vite alias; Docker context = repo root.

```
packages/
  shared-auth/      # handoff client, session helpers (no JWT-in-URL)
  shared-api/       # axios client patterns, idempotency, error envelope
  shared-ui/        # Base* kit only (buttons/inputs/modals) — not grocery screens
  shared-fiscal/    # fiscal provider transport / shared OFD helpers
  shared-marking/   # technical KM verify client — pharmacy rules stay in pharmacy-frontend
  shared-offline/   # sync transport / queue plumbing — pharmacy sale rules stay in pharmacy
  shared-tenant/    # store/company scope helpers
  shared-types/     # shared DTOs / constants

# workspace members (paths stay flat; logical “apps/”):
web-frontend/         # aurent.uz — platform + grocery
restaurant-frontend/  # r-aurent.uz
pharmacy-frontend/    # p-aurent.uz
```

See `packages/README.md`.

### Rules

1. Extract **only** proven-shared logic — not grocery UI into `shared-ui`.
2. Pharmacy / restaurant **business rules** stay in their apps.
3. Do not block pharmacy cutover / domain on a big-bang package move.
4. Prefer: duplicate briefly → extract when 2+ apps need the same file → then package.
5. `pharmacy-frontend` sync-from-main scripts are a bridge; packages replace that bridge over time.
