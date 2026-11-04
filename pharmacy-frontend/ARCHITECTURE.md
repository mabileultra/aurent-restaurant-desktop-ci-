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
- Admin chrome: `src/pharmacy/app/PharmacyAdminShell`.
- Always `catalogKind: 'pharmacy'` on this SPA (`pharmacy/config/vertical.js`).
- `useCompanyBusinessType` / `useCashierStoreProfile` force pharmacy world (no grocery flicker).
- Next: strip grocery-only modules (scales/PLU/grocery grid) from the import graph.

### Запрещено

- Копировать весь `web-frontend`
- Grocery / restaurant / platform-admin UI
- Удалять старый `/pharm` на aurent до offline drain + cutover
- Prod cutover без явного подтверждения

## Offline

Разные origin = разные IndexedDB/SW. Cutover только после синхронизации очереди на старом клиенте.

## Handoff (Sprint 2)

1. Main (authenticated): `POST /api/v1/auth/handoff` `{ "audience": "PHARMACY" }` → `{ code, expiresInSeconds }`.
2. Redirect: `p-aurent.uz/auth/accept?code=…&next=/pos` — **no JWT in URL**.
3. Pharmacy: `POST /api/v1/auth/handoff/exchange` `{ "code" }` → `AuthResponse` (new JWT in SPA storage).
4. Code is one-time, ~60s TTL, audience bound to company `PHARMACY`.

Helper on main: `web-frontend/src/utils/pharmacyAppRedirect.js` (`redirectToPharmacyApp`).
Silent auto-hop / WorldGate cutover — later sprint (flag + offline drain).
