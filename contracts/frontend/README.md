# Frontend contracts (for backend CI)

Source of truth for SPA / desktop: **`Timur1019/aurent-frontend`**.

These files are **snapshots** used only by sync checks in this repo
(`scripts/check-module-sync.mjs`, `check-platform-module-sync.mjs`,
`check-platform-security-sync.mjs`) so backend CI can run without the client trees.

When module / platform nav / security UI contracts change in `aurent-frontend`,
update the copies here in the same PR (or a follow-up) that touches identity/platform.
