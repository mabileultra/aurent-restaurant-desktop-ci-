# Redesign Decisions Log

## Phase 0 (Audit)

1. **Docs path (`apps/pharmacy-frontend/docs/redesign/`)**: Placed `AUDIT.md`, `DECISIONS.md`, and `screenshots/` inside `apps/pharmacy-frontend/docs/redesign/` rather than root `docs/`, keeping all redesign artifacts scoped to the pharmacy frontend package.
2. **ESLint baseline**: `apps/pharmacy-frontend` currently has no `.eslintrc.cjs` (unlike `apps/web-frontend` and `apps/restaurant-frontend`), so `eslint src --ext .js,.jsx` fails with missing config. We will add a minimal `.eslintrc.cjs` matching `apps/web-frontend` in Phase 1 (or verify linting cleanly) and log it here.
3. **Print vs settings panels in `src/shelfLabelPrint/`**: `src/shelfLabelPrint/` mixes actual print DOM output (`ShelfLabelSheet.jsx`, `ShelfLabelBarcode.jsx`, `printShelfLabelDriver.js` — strictly out of scope) with admin settings UI (`ShelfLabelPrintModal.jsx`, `LabelTsplSettingsPanel.jsx`, `ShelfLabelPrintSettingsPanel.jsx`) that contain `dark:` and `violet-*`/`slate-*` classes. We keep print output untouched and will restyle only the modal/settings controls in Phase 5 without touching label rendering or print CSS.
