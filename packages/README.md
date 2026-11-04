# Shared packages (`@aurent/*`)

Active **pnpm workspace** (root `pnpm-workspace.yaml`). Apps depend via `"workspace:*"`.

Vite also resolves via `packages/aurentAliases.mjs` (Docker + local).

## Live packages

| Package | Contents |
|---------|----------|
| `@aurent/shared-auth` | Identity one-time handoff (no JWT in URL) |
| `@aurent/shared-api` | Idempotency + network error helpers |
| `@aurent/shared-offline` | Sync phases + `drainPagedFeed` transport loop |
| `@aurent/shared-marking` | Technical KM / GTIN parse |
| `@aurent/shared-fiscal` | Pure OFD helpers (label, money, package code) |
| `@aurent/shared-types` | `BUSINESS_TYPE`, `FISCAL_PROVIDER`, … |
| `@aurent/shared-tenant` | Pharmacy/restaurant tenant scope helpers |
| `@aurent/shared-ui` | `uiClasses` + `BaseInput` only |

## Rules

1. Extract only when **≥2 apps** need the same module.
2. Vertical business rules stay in the app (pharmacy marking sold-gate, grocery POS, cart fiscal expand).
3. Prefer: duplicate → extract → re-export thin shim in the old path.
4. Do **not** put screens / Spinner / BaseButton (app-coupled) into `shared-ui` yet.
5. `pharmacy-frontend` `sync:from-main` remains a temporary bridge for non-extracted modules.

## Install

```bash
# from repo root
pnpm install
```

SPA apps live under `apps/` (see `apps/README.md`).
