# Shared packages (`@aurent/*`)

Scaffold only — **no big-bang move** from `web-frontend`. Apps keep working as today; `pharmacy-frontend` still uses `sync:from-main` until real extracts land.

## Packages

| Package | Scope |
|---------|--------|
| `@aurent/shared-auth` | Handoff / session helpers (no JWT in URL) |
| `@aurent/shared-api` | Axios patterns, idempotency, error envelope |
| `@aurent/shared-ui` | Base* primitives only — not screens |
| `@aurent/shared-fiscal` | Fiscal / OFD transport |
| `@aurent/shared-marking` | Technical KM helpers; pharmacy rules stay in app |
| `@aurent/shared-offline` | Sync transport / queue plumbing; sale rules stay in app |
| `@aurent/shared-tenant` | Company / store scope helpers |
| `@aurent/shared-types` | Shared DTOs / constants |

## Rules

1. Extract only when **≥2 apps** need the same module.
2. Vertical business rules (pharmacy marking, pharmacy offline sales, grocery POS) stay in the app.
3. Prefer: duplicate briefly → extract → delete the bridge copy.
4. Do not put grocery UI into `shared-ui`.

## Wire an app (later)

```json
{
  "dependencies": {
    "@aurent/shared-auth": "workspace:*"
  }
}
```

```js
import { /* … */ } from '@aurent/shared-auth';
```

From repo root: `pnpm install` (after first extract that apps actually import).

## Workspace activation

Do **not** enable a root `pnpm-workspace.yaml` until the first real extract + Docker COPY of `packages/` is ready.
Local app installs (`cd web-frontend && pnpm i`) currently stay isolated.

When ready: copy `pnpm-workspace.example.yaml` → `pnpm-workspace.yaml`, then add `"@aurent/…": "workspace:*"` in apps and update Dockerfiles to include `packages/`.

