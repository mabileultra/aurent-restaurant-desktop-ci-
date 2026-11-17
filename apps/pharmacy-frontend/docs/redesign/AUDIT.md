# Pharmacy Frontend Redesign Audit (Phase 0 — Read-Only)

> Scope: `apps/pharmacy-frontend` (branch `redizayn`, baseline commit `8c57e253`).
> Total scanned files (`index.html` + `src/**/*.{js,jsx,css}`): **1233**

## Summary

| Category | Count | Notes |
|---|---:|---|
| Bootstrap CSS import | 1 | `src/pharmacy/pos/PharmacyPosShell.jsx` (`bootstrap ^5.3.3` in `package.json`, no Bootstrap JS) |
| JSX files with Bootstrap classes | 21 | Including Tailwind-shared `flex-row`/`mb-0`; pure BS in POS & `CashierLockOverlay` |
| CSS files with `--bs-*` / BS refs | 7 | `src/styles/cashier/**` |
| Files with `dark:` / theme logic | 180 | 1549 line occurrences total |
| Files with hard-coded colors (hex/rgb/TW palette) | 339 | Split below into tokens, print, CSS, JS/JSX |
| Inline `style={{}}` with colors/styles | 2 | `AuthAcceptPage.jsx`, `PharmacyAuthGuard.jsx` |
| Long `className` (>= 8 utilities) | 275 | Candidates for `@apply` (`ui-*`) |
| Repeated `className` (3+ times, >= 4 tokens) | 65 | Candidates for `@apply` (`ui-*`) |
| Shared UI components (`src/components/ui/`) | 14 | + 18 in `src/components/shared/` |
| Modals (`*Modal*.jsx`) | 67 | Across POS, stock, sales, tenant, billing, cash-registers, finance |
| Drawers (`*Drawer*.jsx`) | 10 | Across sales, catalog, cash-registers, tenant |
| `*Page.jsx` files | 49 | ~46 active routed screens + legacy/utility pages |

## 1. Bootstrap Usages

- **Dependency:** `package.json` → `"bootstrap": "^5.3.3"` (and `pnpm-lock.yaml`).
- **Bootstrap JS:** None (`0` imports, `0` `data-bs-*` attributes).
- **CSS import:** `src/pharmacy/pos/PharmacyPosShell.jsx:14` (`import 'bootstrap/dist/css/bootstrap.min.css';`).

### 1.1 JSX Class Usages

| File | Lines & Classes |
|---|---|
| `src/components/shared/TablePagination.jsx` | L50: `flex-row` |
| `src/features/cash-registers/components/CashRegisterSearchField.jsx` | L15: `flex-row` |
| `src/features/cash-registers/components/CashRegistersListFooter.jsx` | L17: `flex-row` |
| `src/features/cash-registers/components/z-reports/ZReportReceiptBody.jsx` | L89: `mb-0` |
| `src/features/cash-registers/pages/CashRegisterConfigPage.jsx` | L19: `flex-row` |
| `src/features/cash-registers/pages/CashRegisterTransferPage.jsx` | L19: `flex-row` |
| `src/features/cash-registers/pages/ZReportsPage.jsx` | L21: `flex-row` |
| `src/features/cashier/components/CashierLockOverlay.jsx` | L163: `w-100`; L175: `form-control`; L183: `btn`, `btn-success`, `w-100` |
| `src/features/cashier/components/my-sales/CashierMySalesWorkspace.jsx` | L24: `text-muted` |
| `src/features/cashier/components/my-sales/CashierSalesFilters.jsx` | L124: `text-muted`, `mb-0` |
| `src/features/cashier/pages/CashierMySalesPage.jsx` | L24: `alert-danger` |
| `src/features/catalog/pages/SuppliersPage.jsx` | L32: `flex-row` |
| `src/features/dashboard/components/DashboardHero.jsx` | L9: `flex-row` |
| `src/features/pharmacy-cashier/pages/PharmacyPosPage.jsx` | L36: `alert-warning`, `mb-0`; L43: `alert-secondary`, `mb-0`; L47: `d-flex`, `flex-column`, `flex-grow-1` |
| `src/features/sales/pages/ReturnsPage.jsx` | L35: `flex-row` |
| `src/features/tenant/components/stores/StoresPageControls.jsx` | L15: `flex-row` |
| `src/features/tenant/components/stores/stores-grouped/StoresGroupedCompanyCard.jsx` | L51: `flex-row` |
| `src/features/tenant/components/stores/stores-grouped/StoresGroupedToolbar.jsx` | L15: `flex-row` |
| `src/features/tenant/pages/UsersPage.jsx` | L83: `flex-row` |
| `src/pharmacy/pos/PharmacyPosShell.jsx` | L24: `d-flex`, `flex-column`, `flex-grow-1`, `min-vw-0`, `w-100`; L40: `flex-grow-1`, `p-lg-3`, `d-flex`, `flex-column` |
| `src/pharmacy/pos/usePharmacyPosShell.js` | L124: `d-flex` |

### 1.2 CSS `--bs-*` & Bootstrap Overrides

| File | Line | Code |
|---|---:|---|
| `src/styles/admin/tables-canonical.css` | 92 | `/* Table Action Menus & Popovers in Dark Mode (overrides any leaked Bootstrap .bg-white !important) */` |
| `src/styles/admin/tables-canonical.css` | 110 | `/* Dark mode shield against leaked Bootstrap .bg-white !important for cards, error states and widgets */` |
| `src/styles/cashier/modals/payment/payment-shift.css` | 27 | `border-color: var(--bs-success);` |
| `src/styles/cashier/modals/payment/payment-shift.css` | 29 | `color: var(--bs-success);` |
| `src/styles/cashier/my-sales/table.css` | 5 | `border: 1px solid var(--bs-border-color, #dee2e6);` |
| `src/styles/cashier/my-sales/table.css` | 12 | `border-bottom: 1px solid var(--bs-border-color, #dee2e6);` |
| `src/styles/cashier/my-sales/table.css` | 34 | `border-bottom: 1px solid var(--bs-border-color, #dee2e6);` |
| `src/styles/cashier/responsive/responsive-my-sales.css` | 161 | `border-top: 1px solid var(--bs-border-color, #dee2e6);` |
| `src/styles/cashier/shell/shell-base.css` | 1 | `/* Cashier shell — bootstrap overrides, topbar */` |
| `src/styles/cashier/shell/shell-base.css` | 10 | `/* Сброс Bootstrap внутри кассы */` |
| `src/styles/cashier/shell/shell-base.css` | 18 | `--bs-btn-bg: var(--pos-green);` |
| `src/styles/cashier/shell/shell-base.css` | 19 | `--bs-btn-border-color: var(--pos-green);` |
| `src/styles/cashier/shell/shell-base.css` | 20 | `--bs-btn-hover-bg: var(--pos-green-hover);` |
| `src/styles/cashier/shell/shell-base.css` | 21 | `--bs-btn-hover-border-color: var(--pos-green-hover);` |
| `src/styles/cashier/terminal-theme/modals-secondary.css` | 15 | `--bs-btn-bg: var(--pos-green);` |
| `src/styles/cashier/terminal-theme/modals-secondary.css` | 16 | `--bs-btn-border-color: var(--pos-green);` |
| `src/styles/cashier/terminal-theme/modals-secondary.css` | 17 | `--bs-btn-color: #0a1218;` |
| `src/styles/cashier/terminal-theme/modals-secondary.css` | 18 | `--bs-btn-hover-bg: var(--pos-green-hover);` |
| `src/styles/cashier/terminal-theme/modals-secondary.css` | 19 | `--bs-btn-hover-border-color: var(--pos-green-hover);` |
| `src/styles/cashier/terminal-theme/modals-secondary.css` | 20 | `--bs-btn-hover-color: #0a1218;` |
| `src/styles/cashier/terminal-theme/modals-secondary.css` | 24 | `--bs-btn-color: var(--pos-muted);` |
| `src/styles/cashier/terminal-theme/modals-secondary.css` | 25 | `--bs-btn-border-color: var(--pos-border);` |
| `src/styles/cashier/terminal-theme/modals-secondary.css` | 26 | `--bs-btn-hover-bg: var(--pos-surface-elevated);` |
| `src/styles/cashier/terminal-theme/modals-secondary.css` | 27 | `--bs-btn-hover-color: var(--pos-text);` |
| `src/styles/cashier/terminal-theme/modals-secondary.css` | 44 | `--bs-table-bg: var(--pos-surface);` |
| `src/styles/cashier/terminal-theme/modals-secondary.css` | 45 | `--bs-table-color: var(--pos-text);` |
| `src/styles/cashier/terminal-theme/modals-secondary.css` | 46 | `--bs-table-border-color: var(--pos-border);` |
| `src/styles/cashier/tokens.css` | 92 | `--bs-primary: var(--pos-green);` |
| `src/styles/cashier/tokens.css` | 93 | `--bs-success: var(--pos-green);` |
| `src/styles/cashier/tokens.css` | 94 | `--bs-body-bg: var(--pos-bg);` |
| `src/styles/cashier/tokens.css` | 95 | `--bs-border-color: var(--pos-border);` |
| `src/styles/cashier/tokens.css` | 96 | `--bs-body-color: var(--pos-text);` |
| `src/styles/cashier/tokens.css` | 133 | `--bs-primary: var(--pos-green);` |
| `src/styles/cashier/tokens.css` | 134 | `--bs-success: var(--pos-green);` |
| `src/styles/cashier/tokens.css` | 135 | `--bs-body-bg: var(--pos-bg);` |
| `src/styles/cashier/tokens.css` | 136 | `--bs-border-color: var(--pos-border);` |
| `src/styles/cashier/tokens.css` | 137 | `--bs-body-color: var(--pos-text);` |

## 2. Dark Mode & Theme Code

### 2.1 Theme Architecture & JS Modules

- `tailwind.config.js`: `darkMode: 'class'`
- `index.html`: `<meta name="theme-color" content="#0f172a" />`
- Theme stores/sync:
  - `src/App.jsx:2` — `import AdminThemeSync from './components/shared/AdminThemeSync';`
  - `src/App.jsx:15` — `<AdminThemeSync />`
  - `src/components/shared/AdminThemeSync.jsx:3` — `import { syncRootTheme } from '../../store/themeStore';`
  - `src/components/shared/AdminThemeSync.jsx:5` — `export default function AdminThemeSync() {`
  - `src/features/pharmacy-stock/styles/pharmacy-import-marks-ask.css:100` — `html.cashier-theme--dark .pharmacy-import-marks-ask__hint {`
  - `src/features/pharmacy-stock/styles/pharmacy-import-marks-ask.css:105` — `html.cashier-theme--dark .pharmacy-import-marks-ask__warn,`
  - `src/features/pharmacy-stock/styles/pharmacy-import-marks-ask.css:107` — `html.cashier-theme--dark .pharmacy-import-marks-ask__rejected-list span {`
  - `src/features/pharmacy-stock/styles/pharmacy-import-marks-ask.css:112` — `html.cashier-theme--dark .pharmacy-import-marks-ask__progress-label,`
  - `src/features/pharmacy-stock/styles/pharmacy-import-marks-ask.css:114` — `html.cashier-theme--dark .pharmacy-import-marks-ask__stats,`
  - `src/features/pharmacy-stock/styles/pharmacy-import-marks-ask.css:116` — `html.cashier-theme--dark .pharmacy-import-marks-ask__rejected-title,`
  - `src/features/pharmacy-stock/styles/pharmacy-import-marks-ask.css:118` — `html.cashier-theme--dark .pharmacy-import-marks-ask__rejected-list code {`
  - `src/features/pharmacy-stock/styles/pharmacy-import-marks-ask.css:123` — `html.cashier-theme--dark .pharmacy-import-marks-ask__bar {`
  - `src/features/pharmacy-stock/styles/pharmacy-import-marks-ask.css:128` — `html.cashier-theme--dark .pharmacy-import-marks-ask__rejected-list {`
  - `src/features/pharmacy-stock/styles/pharmacy-import-marks-ask.css:133` — `html.cashier-theme--dark .pharmacy-import-marks-ask__rejected-list li {`
  - `src/pharmacy/app/usePharmacyAdminShell.js:9` — `import { syncRootTheme } from '../../store/themeStore';`
  - `src/pharmacy/pos/PharmacyPosShell.jsx:37` — `cashierTheme={p.cashierTheme}`
  - `src/pharmacy/pos/PharmacyPosShell.jsx:38` — `toggleCashierTheme={p.toggleCashierTheme}`
  - `src/pharmacy/pos/usePharmacyPosShell.js:5` — `cashierThemeClassName,`
  - `src/pharmacy/pos/usePharmacyPosShell.js:10` — `} from '../../utils/cashierTheme';`
  - `src/pharmacy/pos/usePharmacyPosShell.js:11` — `import { syncRootTheme } from '../../store/themeStore';`
  - `src/pharmacy/pos/usePharmacyPosShell.js:36` — `const [cashierTheme, setCashierTheme] = useState(readCashierTheme);`
  - `src/pharmacy/pos/usePharmacyPosShell.js:46` — `syncCashierThemeDocument(cashierTheme);`
  - `src/pharmacy/pos/usePharmacyPosShell.js:51` — `}, [cashierTheme]);`
  - `src/pharmacy/pos/usePharmacyPosShell.js:99` — `const toggleCashierTheme = () => {`
  - `src/pharmacy/pos/usePharmacyPosShell.js:119` — `const themeClass = cashierThemeClassName(cashierTheme);`
  - `src/pharmacy/pos/usePharmacyPosShell.js:142` — `cashierTheme,`
  - `src/pharmacy/pos/usePharmacyPosShell.js:143` — `toggleCashierTheme,`
  - `src/store/themeStore.js:54` — `'cashier-theme--light',`
  - `src/store/themeStore.js:55` — `'cashier-theme--dark',`
  - `src/store/themeStore.js:98` — `'cashier-theme--light',`
  - `src/store/themeStore.js:99` — `'cashier-theme--dark',`
  - `src/store/themeStore.js:124` — `'cashier-theme--light',`
  - `src/store/themeStore.js:125` — `'cashier-theme--dark',`
  - `src/styles/admin/forms.css:3` — `* html.app-theme--admin выставляет AdminThemeSync / syncRootTheme.`
  - `src/styles/admin/forms.css:189` — `html:not(.cashier-theme--dark):not(.cashier-theme--light):not(.app-theme--cashier):not(.dark) {`
  - `src/styles/cashier/light-theme/discount-modal.css:1` — `/* Light theme — cart discount portal (body portal → html.cashier-theme--light) */`
  - `src/styles/cashier/light-theme/discount-modal.css:2` — `html.cashier-theme--light .pos-pay-modal--discount-terminal {`
  - `src/styles/cashier/light-theme/discount-modal.css:10` — `html.cashier-theme--light .pos-pay-modal--discount-terminal .pos-order-discount-modal__head {`
  - `src/styles/cashier/light-theme/discount-modal.css:15` — `html.cashier-theme--light .pos-pay-modal--discount-terminal .pos-pay-modal__title {`
  - `src/styles/cashier/light-theme/discount-modal.css:19` — `html.cashier-theme--light .pos-pay-modal--discount-terminal .pos-pay-modal__close {`
  - `src/styles/cashier/light-theme/discount-modal.css:29` — `html.cashier-theme--light .pos-pay-modal--discount-terminal .pos-pay-modal__close:hover {`
  - `src/styles/cashier/light-theme/discount-modal.css:35` — `html.cashier-theme--light .pos-pay-modal--discount-terminal .pos-order-discount-modal__base {`
  - `src/styles/cashier/light-theme/discount-modal.css:39` — `html.cashier-theme--light .pos-pay-modal--discount-terminal .pos-order-discount-modal__base strong {`
  - `src/styles/cashier/light-theme/discount-modal.css:43` — `html.cashier-theme--light .pos-pay-modal--discount-terminal .pos-order-discount-modal__mode button,`
  - `src/styles/cashier/light-theme/discount-modal.css:44` — `html.cashier-theme--light .pos-pay-modal--discount-terminal .pos-order-discount-modal__step,`
  - `src/styles/cashier/light-theme/discount-modal.css:45` — `html.cashier-theme--light .pos-pay-modal--discount-terminal .pos-order-discount-modal__input,`
  - `src/styles/cashier/light-theme/discount-modal.css:46` — `html.cashier-theme--light .pos-pay-modal--discount-terminal .pos-order-discount-modal__preset,`
  - `src/styles/cashier/light-theme/discount-modal.css:47` — `html.cashier-theme--light .pos-pay-modal--discount-terminal .pos-order-discount-modal__btn--ghost {`
  - `src/styles/cashier/light-theme/discount-modal.css:55` — `html.cashier-theme--light .pos-pay-modal--discount-terminal .pos-order-discount-modal__mode button.is-active,`
  - `src/styles/cashier/light-theme/discount-modal.css:56` — `html.cashier-theme--light .pos-pay-modal--discount-terminal .pos-order-discount-modal__preset.is-active {`
  - `src/styles/cashier/light-theme/discount-modal.css:63` — `html.cashier-theme--light .pos-pay-modal--discount-terminal .pos-order-discount-modal__step:hover,`
  - `src/styles/cashier/light-theme/discount-modal.css:64` — `html.cashier-theme--light .pos-pay-modal--discount-terminal .pos-order-discount-modal__preset:hover {`
  - `src/styles/cashier/light-theme/discount-modal.css:70` — `html.cashier-theme--light .pos-pay-modal--discount-terminal .pos-order-discount-modal__input {`
  - `src/styles/cashier/light-theme/discount-modal.css:75` — `html.cashier-theme--light .pos-pay-modal--discount-terminal .pos-order-discount-modal__input:focus {`
  - `src/styles/cashier/light-theme/discount-modal.css:81` — `html.cashier-theme--light .pos-pay-modal--discount-terminal .pos-order-discount-modal__suffix {`
  - `src/styles/cashier/light-theme/discount-modal.css:85` — `html.cashier-theme--light .pos-pay-modal--discount-terminal .pos-order-discount-modal__preview {`
  - `src/styles/cashier/light-theme/discount-modal.css:92` — `html.cashier-theme--light .pos-pay-modal--discount-terminal .pos-order-discount-modal__preview strong {`
  - `src/styles/cashier/light-theme/discount-modal.css:96` — `html.cashier-theme--light .pos-pay-modal--discount-terminal .pos-order-discount-modal__preview-total strong {`
  - `src/styles/cashier/light-theme/discount-modal.css:100` — `html.cashier-theme--light .pos-pay-modal--discount-terminal .pos-order-discount-modal__foot {`
  - `src/styles/cashier/light-theme/discount-modal.css:105` — `html.cashier-theme--light .pos-pay-modal--discount-terminal .pos-order-discount-modal__btn--ghost:hover {`
  - `src/styles/cashier/light-theme/discount-modal.css:111` — `html.cashier-theme--light .pos-pay-modal--discount-terminal .pos-order-discount-modal__btn--primary {`
  - `src/styles/cashier/light-theme/discount-modal.css:118` — `html.cashier-theme--light .pos-pay-modal--discount-terminal .pos-order-discount-modal__btn--primary:hover {`
  - `src/styles/cashier/light-theme/pos-slate-ink.css:37` — `.cashier-app.cashier-app--light .cashier-theme-toggle,`
  - `src/styles/cashier/light-theme/return-modal.css:1` — `/* Light theme — return modal portal (body → html.cashier-theme--light) */`
  - `src/styles/cashier/light-theme/return-modal.css:2` — `html.cashier-theme--light .pos-return-modal--terminal {`
  - `src/styles/cashier/light-theme/return-modal.css:12` — `html.cashier-theme--light .pos-return-modal--terminal.pos-return-modal--partial {`
  - `src/styles/cashier/light-theme/return-modal.css:17` — `html.cashier-theme--light .pos-return-modal--terminal .pos-return-modal__header {`
  - `src/styles/cashier/light-theme/return-modal.css:22` — `html.cashier-theme--light .pos-return-modal--terminal .pos-return-modal__header-icon {`
  - `src/styles/cashier/light-theme/return-modal.css:28` — `html.cashier-theme--light .pos-return-modal--terminal .pos-return-modal__title {`
  - `src/styles/cashier/light-theme/return-modal.css:32` — `html.cashier-theme--light .pos-return-modal--terminal .pos-return-modal__hint,`
  - `src/styles/cashier/light-theme/return-modal.css:33` — `html.cashier-theme--light .pos-return-modal--terminal .pos-return-modal__label,`
  - `src/styles/cashier/light-theme/return-modal.css:34` — `html.cashier-theme--light .pos-return-modal--terminal .pos-return-modal__input-icon,`
  - `src/styles/cashier/light-theme/return-modal.css:35` — `html.cashier-theme--light .pos-return-modal--terminal .pos-return-modal__receipt-hint {`
  - `src/styles/cashier/light-theme/return-modal.css:39` — `html.cashier-theme--light .pos-return-modal--terminal .pos-return-modal__body {`
  - `src/styles/cashier/light-theme/return-modal.css:43` — `html.cashier-theme--light .pos-return-modal--terminal .pos-return-modal__input,`
  - `src/styles/cashier/light-theme/return-modal.css:44` — `html.cashier-theme--light .pos-return-modal--terminal .pos-return-modal__textarea {`
  - `src/styles/cashier/light-theme/return-modal.css:51` — `html.cashier-theme--light .pos-return-modal--terminal .pos-return-modal__input::placeholder,`
  - `src/styles/cashier/light-theme/return-modal.css:52` — `html.cashier-theme--light .pos-return-modal--terminal .pos-return-modal__textarea::placeholder {`
  - `src/styles/cashier/light-theme/return-modal.css:56` — `html.cashier-theme--light .pos-return-modal--terminal .pos-return-modal__input:focus,`
  - `src/styles/cashier/light-theme/return-modal.css:57` — `html.cashier-theme--light .pos-return-modal--terminal .pos-return-modal__textarea:focus {`
  - `src/styles/cashier/light-theme/return-modal.css:63` — `html.cashier-theme--light .pos-return-modal--terminal .pos-return-modal__placeholder {`
  - `src/styles/cashier/light-theme/return-modal.css:69` — `html.cashier-theme--light .pos-return-modal--terminal .pos-return-modal__placeholder svg,`
  - `src/styles/cashier/light-theme/return-modal.css:70` — `html.cashier-theme--light .pos-return-modal--terminal .pos-return-modal__placeholder p {`
  - `src/styles/cashier/light-theme/return-modal.css:74` — `html.cashier-theme--light .pos-return-modal--terminal .pos-return-modal__find {`
  - `src/styles/cashier/light-theme/return-modal.css:80` — `html.cashier-theme--light .pos-return-modal--terminal .pos-return-modal__find:hover:not(:disabled) {`
  - `src/styles/cashier/light-theme/return-modal.css:84` — `html.cashier-theme--light .pos-return-modal--terminal .pos-return-modal__close {`
  - `src/styles/cashier/light-theme/return-modal.css:88` — `html.cashier-theme--light .pos-return-modal--terminal .pos-return-modal__close:hover {`
  - `src/styles/cashier/light-theme/return-modal.css:93` — `html.cashier-theme--light .pos-return-modal--terminal .pos-return-modal__receipt-prefix {`
  - `src/styles/cashier/light-theme/return-modal.css:99` — `html.cashier-theme--light .pos-return-modal--terminal .pos-return-modal__input-spinner {`
  - `src/styles/cashier/light-theme/return-modal.css:103` — `html.cashier-theme--light .pos-return-modal--terminal .pos-return-modal__preview {`
  - `src/styles/cashier/light-theme/return-modal.css:108` — `html.cashier-theme--light .pos-return-modal--terminal.pos-return-modal--partial .pos-return-modal__preview-head {`
  - `src/styles/cashier/light-theme/return-modal.css:113` — `html.cashier-theme--light .pos-return-modal--terminal .pos-return-modal__preview-badge {`
  - `src/styles/cashier/light-theme/return-modal.css:118` — `html.cashier-theme--light .pos-return-modal--terminal .pos-return-modal__preview-receipt,`
  - `src/styles/cashier/light-theme/return-modal.css:119` — `html.cashier-theme--light .pos-return-modal--terminal .pos-return-modal__preview-meta,`
  - `src/styles/cashier/light-theme/return-modal.css:120` — `html.cashier-theme--light .pos-return-modal--terminal .pos-return-modal__preview-currency,`
  - `src/styles/cashier/light-theme/return-modal.css:121` — `html.cashier-theme--light .pos-return-modal--terminal .pos-return-modal__preview-total-inline {`
  - `src/styles/cashier/light-theme/return-modal.css:125` — `html.cashier-theme--light .pos-return-modal--terminal .pos-return-modal__preview-total {`
  - `src/styles/cashier/light-theme/return-modal.css:129` — `html.cashier-theme--light .pos-return-modal--terminal .pos-return-modal__select-all {`
  - `src/styles/cashier/light-theme/return-modal.css:135` — `html.cashier-theme--light .pos-return-modal--terminal .pos-return-modal__select-all:hover {`
  - `src/styles/cashier/light-theme/return-modal.css:139` — `html.cashier-theme--light .pos-return-modal--terminal .pos-return-modal__lines--select .pos-return-line-select {`
  - `src/styles/cashier/light-theme/return-modal.css:144` — `html.cashier-theme--light .pos-return-modal--terminal .pos-return-modal__line-name {`
  - `src/styles/cashier/light-theme/return-modal.css:148` — `html.cashier-theme--light .pos-return-modal--terminal .pos-return-line-select__meta {`
  - `src/styles/cashier/light-theme/return-modal.css:152` — `html.cashier-theme--light .pos-return-modal--terminal .pos-return-line-select__sum {`
  - `src/styles/cashier/light-theme/return-modal.css:156` — `html.cashier-theme--light .pos-return-modal--terminal .pos-return-qty-stepper {`
  - `src/styles/cashier/light-theme/return-modal.css:161` — `html.cashier-theme--light .pos-return-modal--terminal .pos-return-qty-stepper__btn {`
  - `src/styles/cashier/light-theme/return-modal.css:167` — `html.cashier-theme--light .pos-return-modal--terminal .pos-return-qty-stepper__btn:hover:not(:disabled) {`
  - `src/styles/cashier/light-theme/return-modal.css:172` — `html.cashier-theme--light .pos-return-modal--terminal .pos-return-qty-stepper__value {`
  - `src/styles/cashier/light-theme/return-modal.css:177` — `html.cashier-theme--light .pos-return-modal--terminal .pos-return-line-select__max {`
  - `src/styles/cashier/light-theme/return-modal.css:183` — `html.cashier-theme--light .pos-return-modal--terminal .pos-return-line-select__max:hover:not(:disabled) {`
  - `src/styles/cashier/light-theme/return-modal.css:188` — `html.cashier-theme--light .pos-return-modal--terminal .pos-return-modal__footer {`
  - `src/styles/cashier/light-theme/return-modal.css:193` — `html.cashier-theme--light .pos-return-modal--terminal .pos-return-modal__cancel {`
  - `src/styles/cashier/light-theme/return-modal.css:199` — `html.cashier-theme--light .pos-return-modal--terminal .pos-return-modal__cancel:hover {`
  - `src/styles/cashier/light-theme/return-modal.css:204` — `html.cashier-theme--light .pos-return-modal--terminal .pos-return-modal__submit {`
  - `src/styles/cashier/light-theme/return-modal.css:211` — `html.cashier-theme--light .pos-return-modal--terminal .pos-return-modal__submit:hover:not(:disabled) {`
  - `src/styles/cashier/light-theme/return-modal.css:215` — `html.cashier-theme--light .pos-return-modal--terminal .pos-return-modal__submit:disabled {`
  - `src/styles/cashier/light-theme/return-modal.css:222` — `html.cashier-theme--light .pos-return-modal--terminal .pos-return-modal__status .is-open {`
  - `src/styles/cashier/light-theme/return-modal.css:226` — `html.cashier-theme--light .pos-pay-overlay {`
  - `src/styles/cashier/light-theme/secondary-pages.css:124` — `.cashier-theme--light .pos-return-modal--terminal .pos-return-line-select__max,`
  - `src/styles/cashier/light-theme/secondary-pages.css:131` — `.cashier-theme--light .pos-return-modal--terminal .pos-return-line-select__max:hover:not(:disabled),`
  - `src/styles/cashier/light-theme/shell.css:67` — `.cashier-app.cashier-app--light .cashier-theme-toggle {`
  - `src/styles/cashier/light-theme/shell.css:72` — `.cashier-app.cashier-app--light .cashier-theme-toggle__opt.is-active {`
  - `src/styles/cashier/light-theme/shift-modal.css:1` — `/* Light theme — shift modal (portal on body → html.cashier-theme--light) */`
  - `src/styles/cashier/light-theme/shift-modal.css:2` — `html.cashier-theme--light .pos-pay-modal--shift-terminal {`
  - `src/styles/cashier/light-theme/shift-modal.css:14` — `html.cashier-theme--light .pos-pay-modal--shift-terminal .cashier-shift-modal__head {`
  - `src/styles/cashier/light-theme/shift-modal.css:24` — `html.cashier-theme--light .pos-pay-modal--shift-terminal .pos-pay-modal__title {`
  - `src/styles/cashier/light-theme/shift-modal.css:35` — `html.cashier-theme--light .pos-pay-modal--shift-terminal .pos-pay-modal__close {`
  - `src/styles/cashier/light-theme/shift-modal.css:48` — `html.cashier-theme--light .pos-pay-modal--shift-terminal .pos-pay-modal__close:hover {`
  - `src/styles/cashier/light-theme/shift-modal.css:54` — `html.cashier-theme--light .pos-pay-modal--shift-terminal .cashier-shift-modal__meta,`
  - `src/styles/cashier/light-theme/shift-modal.css:55` — `html.cashier-theme--light .pos-pay-modal--shift-terminal .cashier-shift-modal__status {`
  - `src/styles/cashier/light-theme/shift-modal.css:63` — `html.cashier-theme--light .pos-pay-modal--shift-terminal .cashier-shift-modal__status {`
  - `src/styles/cashier/light-theme/shift-modal.css:67` — `html.cashier-theme--light .pos-pay-modal--shift-terminal .cashier-shift-modal__status .is-open {`
  - `src/styles/cashier/light-theme/shift-modal.css:72` — `html.cashier-theme--light .pos-pay-modal--shift-terminal .cashier-shift-modal__hint {`
  - `src/styles/cashier/light-theme/shift-modal.css:84` — `html.cashier-theme--light .pos-pay-modal--shift-terminal .cashier-shift-modal__actions {`
  - `src/styles/cashier/light-theme/shift-modal.css:92` — `html.cashier-theme--light .pos-pay-modal--shift-terminal .pos-shift-action {`
  - `src/styles/cashier/light-theme/shift-modal.css:110` — `html.cashier-theme--light .pos-pay-modal--shift-terminal .pos-shift-action:hover:not(:disabled) {`
  - `src/styles/cashier/light-theme/shift-modal.css:116` — `html.cashier-theme--light .pos-pay-modal--shift-terminal .pos-shift-action--primary {`
  - `src/styles/cashier/light-theme/shift-modal.css:123` — `html.cashier-theme--light .pos-pay-modal--shift-terminal .pos-shift-action--primary:hover:not(:disabled) {`
  - `src/styles/cashier/light-theme/shift-modal.css:129` — `html.cashier-theme--light .pos-pay-modal--shift-terminal .pos-shift-action--danger {`
  - `src/styles/cashier/light-theme/shift-modal.css:136` — `html.cashier-theme--light .pos-pay-modal--shift-terminal .pos-shift-action--danger:hover:not(:disabled) {`
  - `src/styles/cashier/light-theme/shift-modal.css:142` — `html.cashier-theme--light .pos-pay-modal--shift-terminal .pos-shift-action:disabled {`
  - `src/styles/cashier/modals/cart-discount.css:211` — `html.cashier-theme--dark .pos-pay-modal--discount-terminal {`
  - `src/styles/cashier/modals/cart-discount.css:217` — `html.cashier-theme--dark .pos-pay-modal--discount-terminal .pos-order-discount-modal__head {`
  - `src/styles/cashier/modals/cart-discount.css:222` — `html.cashier-theme--dark .pos-pay-modal--discount-terminal .pos-pay-modal__title {`
  - `src/styles/cashier/modals/cart-discount.css:226` — `html.cashier-theme--dark .pos-pay-modal--discount-terminal .pos-order-discount-modal__base {`
  - `src/styles/cashier/modals/cart-discount.css:230` — `html.cashier-theme--dark .pos-pay-modal--discount-terminal .pos-order-discount-modal__base strong {`
  - `src/styles/cashier/modals/cart-discount.css:234` — `html.cashier-theme--dark .pos-pay-modal--discount-terminal .pos-order-discount-modal__mode button,`
  - `src/styles/cashier/modals/cart-discount.css:235` — `html.cashier-theme--dark .pos-pay-modal--discount-terminal .pos-order-discount-modal__step,`
  - `src/styles/cashier/modals/cart-discount.css:236` — `html.cashier-theme--dark .pos-pay-modal--discount-terminal .pos-order-discount-modal__input,`
  - `src/styles/cashier/modals/cart-discount.css:237` — `html.cashier-theme--dark .pos-pay-modal--discount-terminal .pos-order-discount-modal__preset,`
  - `src/styles/cashier/modals/cart-discount.css:238` — `html.cashier-theme--dark .pos-pay-modal--discount-terminal .pos-order-discount-modal__btn--ghost {`
  - `src/styles/cashier/modals/cart-discount.css:244` — `html.cashier-theme--dark .pos-pay-modal--discount-terminal .pos-order-discount-modal__mode button.is-active,`
  - `src/styles/cashier/modals/cart-discount.css:245` — `html.cashier-theme--dark .pos-pay-modal--discount-terminal .pos-order-discount-modal__preset.is-active {`
  - `src/styles/cashier/modals/cart-discount.css:251` — `html.cashier-theme--dark .pos-pay-modal--discount-terminal .pos-order-discount-modal__preview {`
  - `src/styles/cashier/modals/cart-discount.css:256` — `html.cashier-theme--dark .pos-pay-modal--discount-terminal .pos-order-discount-modal__preview strong {`
  - `src/styles/cashier/modals/cart-discount.css:260` — `html.cashier-theme--dark .pos-pay-modal--discount-terminal .pos-order-discount-modal__preview-total strong {`
  - `src/styles/cashier/modals/cart-discount.css:264` — `html.cashier-theme--dark .pos-pay-modal--discount-terminal .pos-order-discount-modal__btn--primary {`
  - `src/styles/cashier/modals/cart-discount.css:270` — `html.cashier-theme--dark .pos-pay-modal--discount-terminal .pos-pay-modal__close {`
  - `src/styles/cashier/modals/cart-discount.css:286` — `html.cashier-theme--dark .pos-pay-modal--discount-terminal .pos-pay-modal__close:hover {`
  - `src/styles/cashier/modals/payment/cash-movement-modal.css:267` — `html.cashier-theme--dark .cashier-cash-move-modal,`
  - `src/styles/cashier/modals/payment/cash-movement-modal.css:275` — `html.cashier-theme--dark .cashier-cash-move-modal__head,`
  - `src/styles/cashier/modals/payment/cash-movement-modal.css:281` — `html.cashier-theme--dark .cashier-cash-move-modal__title,`
  - `src/styles/cashier/modals/payment/cash-movement-modal.css:286` — `html.cashier-theme--dark .cashier-cash-move-modal__hint,`
  - `src/styles/cashier/modals/payment/cash-movement-modal.css:287` — `html.cashier-theme--dark .cashier-cash-move-modal__label,`
  - `src/styles/cashier/modals/payment/cash-movement-modal.css:288` — `html.cashier-theme--dark .cashier-cash-move-modal__amount-hint,`
  - `src/styles/cashier/modals/payment/cash-movement-modal.css:295` — `html.cashier-theme--dark .cashier-cash-move-modal__close,`
  - `src/styles/cashier/modals/payment/cash-movement-modal.css:302` — `html.cashier-theme--dark .cashier-cash-move-modal__input,`
  - `src/styles/cashier/modals/payment/cash-movement-modal.css:303` — `html.cashier-theme--dark .cashier-cash-move-modal__btn--ghost,`
  - `src/styles/cashier/modals/payment/cash-movement-modal.css:304` — `html.cashier-theme--dark .cashier-cash-move-modal__preset,`
  - `src/styles/cashier/modals/payment/cash-movement-modal.css:313` — `html.cashier-theme--dark .cashier-cash-move-modal__preset:hover,`
  - `src/styles/cashier/modals/payment/shift-modal-compact.css:2` — `html.cashier-theme--dark .pos-pay-modal--shift-terminal,`
  - `src/styles/cashier/modals/payment/shift-modal-compact.css:3` — `html.cashier-theme--light .pos-pay-modal--shift-terminal {`
  - `src/styles/cashier/modals/payment/shift-modal-compact.css:8` — `html.cashier-theme--dark .pos-pay-modal--shift-terminal .cashier-shift-modal__head,`
  - `src/styles/cashier/modals/payment/shift-modal-compact.css:9` — `html.cashier-theme--light .pos-pay-modal--shift-terminal .cashier-shift-modal__head {`
  - `src/styles/cashier/modals/payment/shift-modal-compact.css:14` — `html.cashier-theme--dark .pos-pay-modal--shift-terminal .pos-pay-modal__title,`
  - `src/styles/cashier/modals/payment/shift-modal-compact.css:15` — `html.cashier-theme--light .pos-pay-modal--shift-terminal .pos-pay-modal__title {`
  - `src/styles/cashier/modals/payment/shift-modal-compact.css:20` — `html.cashier-theme--dark .pos-pay-modal--shift-terminal .pos-pay-modal__close,`
  - `src/styles/cashier/modals/payment/shift-modal-compact.css:21` — `html.cashier-theme--light .pos-pay-modal--shift-terminal .pos-pay-modal__close {`
  - `src/styles/cashier/modals/payment/shift-modal-compact.css:27` — `html.cashier-theme--dark .pos-pay-modal--shift-terminal .cashier-shift-modal__meta,`
  - `src/styles/cashier/modals/payment/shift-modal-compact.css:28` — `html.cashier-theme--dark .pos-pay-modal--shift-terminal .cashier-shift-modal__status,`
  - `src/styles/cashier/modals/payment/shift-modal-compact.css:29` — `html.cashier-theme--light .pos-pay-modal--shift-terminal .cashier-shift-modal__meta,`
  - `src/styles/cashier/modals/payment/shift-modal-compact.css:30` — `html.cashier-theme--light .pos-pay-modal--shift-terminal .cashier-shift-modal__status {`
  - `src/styles/cashier/modals/payment/shift-modal-compact.css:35` — `html.cashier-theme--dark .pos-pay-modal--shift-terminal .cashier-shift-modal__status,`
  - `src/styles/cashier/modals/payment/shift-modal-compact.css:36` — `html.cashier-theme--light .pos-pay-modal--shift-terminal .cashier-shift-modal__status {`
  - `src/styles/cashier/modals/payment/shift-modal-compact.css:40` — `html.cashier-theme--dark .pos-pay-modal--shift-terminal .cashier-shift-modal__hint,`
  - `src/styles/cashier/modals/payment/shift-modal-compact.css:41` — `html.cashier-theme--light .pos-pay-modal--shift-terminal .cashier-shift-modal__hint {`
  - `src/styles/cashier/modals/payment/shift-modal-compact.css:47` — `html.cashier-theme--dark .pos-pay-modal--shift-terminal .cashier-shift-modal__actions,`
  - `src/styles/cashier/modals/payment/shift-modal-compact.css:48` — `html.cashier-theme--light .pos-pay-modal--shift-terminal .cashier-shift-modal__actions {`
  - `src/styles/cashier/modals/payment/shift-modal-compact.css:54` — `html.cashier-theme--dark .pos-pay-modal--shift-terminal .cashier-shift-modal__actions:has(.pos-shift-action:nth-child(3)),`
  - `src/styles/cashier/modals/payment/shift-modal-compact.css:55` — `html.cashier-theme--light .pos-pay-modal--shift-terminal .cashier-shift-modal__actions:has(.pos-shift-action:nth-child(3)) {`
  - `src/styles/cashier/modals/payment/shift-modal-compact.css:60` — `html.cashier-theme--dark .pos-pay-modal--shift-terminal .cashier-shift-modal__actions .pos-shift-action--danger,`
  - `src/styles/cashier/modals/payment/shift-modal-compact.css:61` — `html.cashier-theme--light .pos-pay-modal--shift-terminal .cashier-shift-modal__actions .pos-shift-action--danger {`
  - `src/styles/cashier/modals/payment/shift-modal-compact.css:65` — `html.cashier-theme--dark .pos-pay-modal--shift-terminal .pos-shift-action,`
  - `src/styles/cashier/modals/payment/shift-modal-compact.css:66` — `html.cashier-theme--light .pos-pay-modal--shift-terminal .pos-shift-action {`
  - `src/styles/cashier/modals/payment/shift-modal-compact.css:76` — `html.cashier-theme--dark .pos-pay-modal--shift-terminal .pos-shift-action svg,`
  - `src/styles/cashier/modals/payment/shift-modal-compact.css:77` — `html.cashier-theme--light .pos-pay-modal--shift-terminal .pos-shift-action svg {`
  - `src/styles/cashier/modals/payment/shift-terminal-modal.css:1` — `/* Cashier shift modal — dark theme (portal on body → html.cashier-theme--dark) */`
  - `src/styles/cashier/modals/payment/shift-terminal-modal.css:2` — `html.cashier-theme--dark .pos-pay-modal--shift-terminal {`
  - `src/styles/cashier/modals/payment/shift-terminal-modal.css:20` — `html.cashier-theme--dark .pos-pay-modal--shift-terminal .cashier-shift-modal__head {`
  - `src/styles/cashier/modals/payment/shift-terminal-modal.css:30` — `html.cashier-theme--dark .pos-pay-modal--shift-terminal .pos-pay-modal__title {`
  - `src/styles/cashier/modals/payment/shift-terminal-modal.css:41` — `html.cashier-theme--dark .pos-pay-modal--shift-terminal .pos-pay-modal__close {`
  - `src/styles/cashier/modals/payment/shift-terminal-modal.css:54` — `html.cashier-theme--dark .pos-pay-modal--shift-terminal .pos-pay-modal__close:hover {`
  - `src/styles/cashier/modals/payment/shift-terminal-modal.css:60` — `html.cashier-theme--dark .pos-pay-modal--shift-terminal .cashier-shift-modal__meta,`
  - `src/styles/cashier/modals/payment/shift-terminal-modal.css:61` — `html.cashier-theme--dark .pos-pay-modal--shift-terminal .cashier-shift-modal__status {`
  - `src/styles/cashier/modals/payment/shift-terminal-modal.css:69` — `html.cashier-theme--dark .pos-pay-modal--shift-terminal .cashier-shift-modal__status {`
  - `src/styles/cashier/modals/payment/shift-terminal-modal.css:73` — `html.cashier-theme--dark .pos-pay-modal--shift-terminal .cashier-shift-modal__hint {`
  - `src/styles/cashier/modals/payment/shift-terminal-modal.css:85` — `html.cashier-theme--dark .pos-pay-modal--shift-terminal .cashier-shift-modal__status .is-open {`
  - `src/styles/cashier/modals/payment/shift-terminal-modal.css:90` — `html.cashier-theme--dark .pos-pay-modal--shift-terminal .cashier-shift-modal__actions {`
  - `src/styles/cashier/modals/payment/shift-terminal-modal.css:98` — `html.cashier-theme--dark .pos-pay-modal--shift-terminal .pos-shift-action {`
  - `src/styles/cashier/modals/payment/shift-terminal-modal.css:116` — `html.cashier-theme--dark .pos-pay-modal--shift-terminal .pos-shift-action:hover:not(:disabled) {`
  - `src/styles/cashier/modals/payment/shift-terminal-modal.css:122` — `html.cashier-theme--dark .pos-pay-modal--shift-terminal .pos-shift-action--primary {`
  - `src/styles/cashier/modals/payment/shift-terminal-modal.css:128` — `html.cashier-theme--dark .pos-pay-modal--shift-terminal .pos-shift-action--primary:hover:not(:disabled) {`
  - `src/styles/cashier/modals/payment/shift-terminal-modal.css:132` — `html.cashier-theme--dark .pos-pay-modal--shift-terminal .pos-shift-action--danger {`
  - `src/styles/cashier/modals/payment/shift-terminal-modal.css:139` — `html.cashier-theme--dark .pos-pay-modal--shift-terminal .pos-shift-action--danger:hover:not(:disabled) {`
  - `src/styles/cashier/modals/payment/shift-terminal-modal.css:145` — `html.cashier-theme--dark .pos-pay-modal--shift-terminal .pos-shift-action:disabled {`
  - `src/styles/cashier/pos-layout/toast.css:53` — `html.cashier-theme--dark .pos-item-added-toast-host {`
  - `src/styles/cashier/pos-layout/toast.css:59` — `html.cashier-theme--dark .pos-item-added-toast__name {`
  - `src/styles/cashier/pos-layout/toast.css:63` — `html.cashier-theme--dark .pos-item-added-toast__sum {`
  - `src/styles/cashier/shell/shell-paint.css:3` — `html.cashier-theme--dark,`
  - `src/styles/cashier/shell/shell-paint.css:4` — `html.cashier-theme--dark body {`
  - `src/styles/cashier/shell/shell-paint.css:9` — `html.cashier-theme--light,`
  - `src/styles/cashier/shell/shell-paint.css:10` — `html.cashier-theme--light body {`
  - `src/styles/cashier/shell/shell-paint.css:15` — `html.cashier-shell--desktop.cashier-theme--dark,`
  - `src/styles/cashier/shell/shell-paint.css:16` — `html.cashier-shell--desktop.cashier-theme--dark body,`
  - `src/styles/cashier/shell/shell-paint.css:17` — `html.cashier-shell--desktop.cashier-theme--dark #root {`
  - `src/styles/cashier/shell/shell-paint.css:21` — `html.cashier-shell--desktop.cashier-theme--light,`
  - `src/styles/cashier/shell/shell-paint.css:22` — `html.cashier-shell--desktop.cashier-theme--light body,`
  - `src/styles/cashier/shell/shell-paint.css:23` — `html.cashier-shell--desktop.cashier-theme--light #root {`
  - `src/styles/cashier/shell/shell-pos-topbar.css:198` — `.cashier-theme-toggle {`
  - `src/styles/cashier/shell/shell-pos-topbar.css:209` — `.cashier-theme-toggle__opt {`
  - `src/styles/cashier/shell/shell-pos-topbar.css:222` — `.cashier-theme-toggle__opt.is-active {`
  - `src/styles/cashier/shell/shell-pos-topbar.css:228` — `.cashier-app.cashier-app--terminal .cashier-theme-toggle__opt.is-active {`
  - `src/styles/cashier/shell/shell-pos-topbar.css:246` — `.cashier-app.cashier-app--light .cashier-theme-toggle,`
  - `src/styles/cashier/shell/shell-pos-topbar.css:268` — `.cashier-app.cashier-app--terminal .cashier-theme-toggle {`
  - `src/styles/cashier/shell/shell-pos-topbar.css:329` — `.cashier-topbar--compact .cashier-theme-toggle {`
  - `src/styles/cashier/shell/shell-pos-topbar.css:333` — `.cashier-topbar--compact .cashier-theme-toggle__opt {`
  - `src/styles/cashier/shell/shell-topbar-readable.css:91` — `.cashier-app.cashier-app--touch .cashier-topbar--compact .cashier-theme-toggle.cashier-topbar__theme,`
  - `src/styles/cashier/shell/shell-topbar-readable.css:92` — `.cashier-app.cashier-app--desktop .cashier-topbar--compact .cashier-theme-toggle.cashier-topbar__theme {`
  - `src/styles/cashier/shell/shell-topbar-readable.css:100` — `.cashier-app.cashier-app--touch .cashier-topbar--compact .cashier-theme-toggle__opt,`
  - `src/styles/cashier/shell/shell-topbar-readable.css:101` — `.cashier-app.cashier-app--desktop .cashier-topbar--compact .cashier-theme-toggle__opt {`
  - `src/styles/cashier/shell/shell-topbar-readable.css:107` — `.cashier-app.cashier-app--touch .cashier-topbar--compact .cashier-theme-toggle__opt svg,`
  - `src/styles/cashier/shell/shell-topbar-readable.css:108` — `.cashier-app.cashier-app--desktop .cashier-topbar--compact .cashier-theme-toggle__opt svg {`
  - `src/styles/cashier/terminal-theme/portals.css:2` — `html.cashier-theme--dark .pos-pay-overlay {`
  - `src/styles/cashier/terminal-theme/portals.css:8` — `html.cashier-theme--dark .pos-return-modal--terminal {`
  - `src/styles/cashier/terminal-theme/portals.css:23` — `html.cashier-theme--dark .pos-return-modal--terminal.pos-return-modal--partial {`
  - `src/styles/cashier/terminal-theme/portals.css:28` — `html.cashier-theme--dark .pos-return-modal--terminal.pos-return-modal--partial .pos-return-modal__lines.pos-return-modal__lines--s`
  - `src/styles/cashier/terminal-theme/portals.css:32` — `html.cashier-theme--dark .pos-return-modal--terminal.pos-return-modal--partial .pos-return-modal__preview-head {`
  - `src/styles/cashier/terminal-theme/portals.css:37` — `html.cashier-theme--dark .pos-return-modal--terminal .pos-return-modal__header {`
  - `src/styles/cashier/terminal-theme/portals.css:42` — `html.cashier-theme--dark .pos-return-modal--terminal .pos-return-modal__header-icon {`
  - `src/styles/cashier/terminal-theme/portals.css:48` — `html.cashier-theme--dark .pos-return-modal--terminal .pos-return-modal__title {`
  - `src/styles/cashier/terminal-theme/portals.css:52` — `html.cashier-theme--dark .pos-return-modal--terminal .pos-return-modal__hint {`
  - `src/styles/cashier/terminal-theme/portals.css:56` — `html.cashier-theme--dark .pos-return-modal--terminal .pos-return-modal__close {`
  - `src/styles/cashier/terminal-theme/portals.css:60` — `html.cashier-theme--dark .pos-return-modal--terminal .pos-return-modal__close:hover {`
  - `src/styles/cashier/terminal-theme/portals.css:65` — `html.cashier-theme--dark .pos-return-modal--terminal .pos-return-modal__body {`
  - `src/styles/cashier/terminal-theme/portals.css:69` — `html.cashier-theme--dark .pos-return-modal--terminal .pos-return-modal__label {`
  - `src/styles/cashier/terminal-theme/portals.css:73` — `html.cashier-theme--dark .pos-return-modal--terminal .pos-return-modal__input-icon {`
  - `src/styles/cashier/terminal-theme/portals.css:77` — `html.cashier-theme--dark .pos-return-modal--terminal .pos-return-modal__input,`
  - `src/styles/cashier/terminal-theme/portals.css:78` — `html.cashier-theme--dark .pos-return-modal--terminal .pos-return-modal__textarea {`
  - `src/styles/cashier/terminal-theme/portals.css:84` — `html.cashier-theme--dark .pos-return-modal--terminal .pos-return-modal__input::placeholder,`
  - `src/styles/cashier/terminal-theme/portals.css:85` — `html.cashier-theme--dark .pos-return-modal--terminal .pos-return-modal__textarea::placeholder {`
  - `src/styles/cashier/terminal-theme/portals.css:89` — `html.cashier-theme--dark .pos-return-modal--terminal .pos-return-modal__input:focus,`
  - `src/styles/cashier/terminal-theme/portals.css:90` — `html.cashier-theme--dark .pos-return-modal--terminal .pos-return-modal__textarea:focus {`
  - `src/styles/cashier/terminal-theme/portals.css:95` — `html.cashier-theme--dark .pos-return-modal--terminal .pos-return-modal__find {`
  - `src/styles/cashier/terminal-theme/portals.css:100` — `html.cashier-theme--dark .pos-return-modal--terminal .pos-return-modal__find:hover:not(:disabled) {`
  - `src/styles/cashier/terminal-theme/portals.css:104` — `html.cashier-theme--dark .pos-return-modal--terminal .pos-return-modal__placeholder {`
  - `src/styles/cashier/terminal-theme/portals.css:114` — `html.cashier-theme--dark .pos-return-modal--terminal .pos-return-modal__placeholder svg {`
  - `src/styles/cashier/terminal-theme/portals.css:118` — `html.cashier-theme--dark .pos-return-modal--terminal .pos-return-modal__placeholder p {`
  - `src/styles/cashier/terminal-theme/portals.css:122` — `html.cashier-theme--dark .pos-return-modal--terminal .pos-return-modal__preview {`
  - `src/styles/cashier/terminal-theme/portals.css:127` — `html.cashier-theme--dark .pos-return-modal--terminal .pos-return-modal__preview-badge {`
  - `src/styles/cashier/terminal-theme/portals.css:132` — `html.cashier-theme--dark .pos-return-modal--terminal .pos-return-modal__preview-receipt,`
  - `src/styles/cashier/terminal-theme/portals.css:133` — `html.cashier-theme--dark .pos-return-modal--terminal .pos-return-modal__preview-meta,`
  - `src/styles/cashier/terminal-theme/portals.css:134` — `html.cashier-theme--dark .pos-return-modal--terminal .pos-return-modal__preview-currency,`
  - `src/styles/cashier/terminal-theme/portals.css:135` — `html.cashier-theme--dark .pos-return-modal--terminal .pos-return-modal__preview-total-inline {`
  - `src/styles/cashier/terminal-theme/portals.css:139` — `html.cashier-theme--dark .pos-return-modal--terminal .pos-return-modal__preview-total {`
  - `src/styles/cashier/terminal-theme/portals.css:143` — `html.cashier-theme--dark .pos-return-modal--terminal .pos-return-modal__select-all {`
  - `src/styles/cashier/terminal-theme/portals.css:149` — `html.cashier-theme--dark .pos-return-modal--terminal .pos-return-modal__select-all:hover {`
  - `src/styles/cashier/terminal-theme/portals.css:153` — `html.cashier-theme--dark .pos-return-modal--terminal .pos-return-modal__lines--select .pos-return-line-select {`
  - `src/styles/cashier/terminal-theme/portals.css:158` — `html.cashier-theme--dark .pos-return-modal--terminal .pos-return-modal__line-name {`
  - `src/styles/cashier/terminal-theme/portals.css:162` — `html.cashier-theme--dark .pos-return-modal--terminal .pos-return-line-select__meta {`
  - `src/styles/cashier/terminal-theme/portals.css:166` — `html.cashier-theme--dark .pos-return-modal--terminal .pos-return-line-select__sum {`
  - `src/styles/cashier/terminal-theme/portals.css:170` — `html.cashier-theme--dark .pos-return-modal--terminal .pos-return-qty-stepper {`
  - `src/styles/cashier/terminal-theme/portals.css:175` — `html.cashier-theme--dark .pos-return-modal--terminal .pos-return-qty-stepper__btn {`
  - `src/styles/cashier/terminal-theme/portals.css:181` — `html.cashier-theme--dark .pos-return-modal--terminal .pos-return-qty-stepper__btn:hover:not(:disabled) {`
  - `src/styles/cashier/terminal-theme/portals.css:186` — `html.cashier-theme--dark .pos-return-modal--terminal .pos-return-qty-stepper__value {`
  - `src/styles/cashier/terminal-theme/portals.css:191` — `html.cashier-theme--dark .pos-return-modal--terminal .pos-return-line-select__max {`
  - `src/styles/cashier/terminal-theme/portals.css:197` — `html.cashier-theme--dark .pos-return-modal--terminal .pos-return-line-select__max:hover:not(:disabled) {`
  - `src/styles/cashier/terminal-theme/portals.css:202` — `html.cashier-theme--dark .pos-return-modal--terminal .pos-return-modal__footer {`
  - `src/styles/cashier/terminal-theme/portals.css:207` — `html.cashier-theme--dark .pos-return-modal--terminal .pos-return-modal__cancel {`
  - `src/styles/cashier/terminal-theme/portals.css:213` — `html.cashier-theme--dark .pos-return-modal--terminal .pos-return-modal__cancel:hover {`
  - `src/styles/cashier/terminal-theme/portals.css:218` — `html.cashier-theme--dark .pos-return-modal--terminal .pos-return-modal__submit {`
  - `src/styles/cashier/terminal-theme/portals.css:224` — `html.cashier-theme--dark .pos-return-modal--terminal .pos-return-modal__submit:hover:not(:disabled) {`
  - `src/styles/cashier/tokens.css:25` — `html.cashier-theme--dark {`
  - `src/styles/cashier/tokens.css:47` — `html.cashier-theme--light {`
  - `src/styles/shared/unit-conversion-helper.css:98` — `html.cashier-theme--dark .unit-conversion-helper .base-select__trigger,`
  - `src/utils/cashierTheme.js:3` — `export const CASHIER_THEME_STORAGE_KEY = 'pos-cashier-theme';`
  - `src/utils/cashierTheme.js:28` — `export function cashierThemeClassName(theme) {`
  - `src/utils/cashierTheme.js:36` — `root.classList.remove('cashier-theme--light', 'cashier-theme--dark', 'app-theme--admin');`
  - `src/utils/cashierTheme.js:38` — `theme === 'light' ? 'cashier-theme--light' : 'cashier-theme--dark',`
  - `src/utils/cashierTheme.js:48` — `'cashier-theme--light',`
  - `src/utils/cashierTheme.js:49` — `'cashier-theme--dark',`

### 2.2 All Files Containing `dark:` / `.dark` / `html.dark` / `cashier-theme--dark` (180 files)

| File | Scope | Occurrences | Lines (sample/all) |
|---|---|---:|---|
| `src/styles/billing.css` | css | 126 | 1334, 1335, 1336, 1337, 1338, 1339, 1351, 1352, 1358, 1359, 1363, 1364, ... (+114) |
| `src/styles/admin/modals.css` | css | 104 | 5, 6, 7, 8, 13, 18, 19, 20, 21, 22, 28, 29, ... (+92) |
| `src/styles/admin/forms.css` | css | 89 | 3, 6, 7, 10, 11, 12, 13, 14, 15, 53, 54, 57, ... (+77) |
| `src/features/tenant/components/users/UsersTable.jsx` | tsx/jsx/js | 57 | 94, 97, 99, 110, 113, 125, 137, 153, 173, 193, 213, 225, ... (+45) |
| `src/features/cash-registers/components/CashTransferTable.jsx` | tsx/jsx/js | 38 | 24, 26, 29, 32, 35, 38, 41, 48, 49, 50, 51, 52, ... (+26) |
| `src/features/tenant/components/users/PlatformUserQuickDrawer.jsx` | tsx/jsx/js | 37 | 146, 155, 158, 160, 164, 171, 172, 184, 195, 206, 209, 216, ... (+25) |
| `src/features/pharmacy-stock/styles/pharmacy-stock.css` | css | 35 | 71, 113, 158, 194, 213, 239, 267, 282, 298, 303, 328, 382, ... (+23) |
| `src/features/tenant/components/users/UserFormModalFields.jsx` | tsx/jsx/js | 29 | 56, 108, 116, 123, 134, 160, 238, 245, 256, 268, 284, 286, ... (+17) |
| `src/styles/admin/shell.css` | css | 27 | 9, 18, 27, 54, 58, 59, 88, 92, 96, 108, 138, 142, ... (+15) |
| `src/shelfLabelPrint/ShelfLabelPrintSettingsPanel.jsx` | print/label-settings | 25 | 50, 54, 102, 110, 115, 131, 145, 146, 153, 154, 161, 171, ... (+13) |
| `src/features/tenant/pages/UsersPage.jsx` | tsx/jsx/js | 24 | 39, 46, 54, 84, 90, 91, 95, 104, 105, 109, 118, 119, ... (+12) |
| `src/styles/shared/base-select.css` | css | 21 | 243, 247, 254, 258, 259, 264, 271, 272, 273, 277, 281, 289, ... (+9) |
| `src/features/tenant/components/stores/PlatformStoreMobileCard.jsx` | tsx/jsx/js | 19 | 39, 45, 51, 55, 65, 66, 75, 76, 81, 96, 104, 113, ... (+7) |
| `src/features/tenant/components/stores/stores-grouped/StoresGroupedCompanyCard.jsx` | tsx/jsx/js | 19 | 35, 37, 38, 53, 54, 64, 68, 75, 82, 84, 87, 91, ... (+7) |
| `src/features/tenant/components/stores/StoresPageControls.jsx` | tsx/jsx/js | 18 | 17, 23, 24, 28, 37, 38, 42, 52, 53, 55, 56, 63, ... (+6) |
| `src/features/tenant/components/users/PlatformUserStatsCards.jsx` | tsx/jsx/js | 18 | 30, 31, 32, 45, 46, 47, 59, 60, 61, 73, 74, 75, ... (+6) |
| `src/features/tenant/components/users/UserBrandingSettingsPanel.jsx` | tsx/jsx/js | 18 | 18, 47, 48, 49, 65, 78, 81, 85, 91, 96, 97, 102, ... (+6) |
| `src/shelfLabelPrint/LabelTsplSettingsPanel.jsx` | print/label-settings | 18 | 130, 131, 134, 152, 159, 172, 177, 186, 187, 199, 200, 203, ... (+6) |
| `src/features/tenant/components/stores/PlatformStoreStatsCards.jsx` | tsx/jsx/js | 17 | 25, 26, 27, 37, 38, 39, 47, 48, 58, 60, 61, 62, ... (+5) |
| `src/features/tenant/components/stores/StoresTable.jsx` | tsx/jsx/js | 17 | 40, 54, 72, 77, 80, 84, 85, 90, 94, 97, 100, 103, ... (+5) |
| `src/features/tenant/components/stores/StoresTableRow.jsx` | tsx/jsx/js | 16 | 44, 49, 51, 54, 62, 66, 75, 79, 85, 92, 102, 103, ... (+4) |
| `src/styles/admin/tables-canonical.css` | css | 16 | 21, 30, 93, 94, 100, 101, 105, 106, 111, 112, 113, 114, ... (+4) |
| `src/features/tenant/components/users/ReceiptPrinterSettingsPanel.jsx` | tsx/jsx/js | 14 | 18, 46, 47, 48, 63, 76, 81, 93, 100, 111, 122, 134, ... (+2) |
| `src/features/billing/components/BillingPaymentsList.jsx` | tsx/jsx/js | 13 | 10, 12, 13, 14, 15, 16, 17, 20, 22, 23, 24, 25, ... (+1) |
| `src/features/cash-registers/components/z-reports/ZReportsTable.jsx` | tsx/jsx/js | 13 | 32, 54, 69, 79, 81, 84, 88, 89, 92, 101, 102, 103, ... (+1) |
| `src/features/cash-registers/components/CashRegisterConfigAddModal.jsx` | tsx/jsx/js | 12 | 16, 142, 143, 144, 145, 153, 163, 171, 189, 214, 236, 297 |
| `src/features/sales/components/SalesLedgerFiltersDrawer.jsx` | tsx/jsx/js | 12 | 8, 27, 29, 30, 34, 51, 79, 83, 87, 91, 92, 104 |
| `src/features/tenant/components/stores/PlatformStoreQuickDrawerDetails.jsx` | tsx/jsx/js | 12 | 14, 18, 21, 25, 32, 36, 43, 47, 56, 60, 64, 68 |
| `src/styles/platform/platform-filter-bar.css` | css | 12 | 57, 58, 64, 70, 108, 151, 176, 180, 181, 221, 226, 279 |
| `src/styles/support/page.css` | css | 12 | 26, 38, 49, 62, 82, 107, 112, 129, 140, 191, 203, 215 |
| `src/features/sales/components/SaleFiscalPrintModal.jsx` | tsx/jsx/js | 11 | 54, 59, 60, 67, 68, 87, 96, 112, 118, 123, 130 |
| `src/features/sales/components/sales-ledger/SalesLedgerTable.jsx` | tsx/jsx/js | 11 | 36, 59, 74, 84, 88, 89, 93, 100, 108, 115, 129 |
| `src/features/tenant/components/stores/PlatformStoreQuickDrawer.jsx` | tsx/jsx/js | 11 | 56, 62, 64, 66, 70, 77, 78, 95, 109, 116, 130 |
| `src/features/tenant/components/users/UserFormModal.jsx` | tsx/jsx/js | 11 | 164, 197, 200, 202, 205, 214, 236, 239, 243, 246, 256 |
| `src/styles/handbook/page.css` | css | 11 | 26, 38, 49, 71, 116, 120, 124, 139, 152, 163, 175 |
| `src/features/ai/components/AiAssistantWidget.jsx` | tsx/jsx/js | 10 | 93, 99, 100, 105, 114, 123, 124, 128, 133, 145 |
| `src/features/cash-registers/components/CashTransferFiltersDrawer.jsx` | tsx/jsx/js | 10 | 7, 18, 20, 21, 25, 32, 45, 50, 61, 74 |
| `src/features/catalog/components/suppliers/SuppliersTable.jsx` | tsx/jsx/js | 10 | 33, 46, 53, 55, 56, 57, 58, 61, 79, 80 |
| `src/features/pharmacy-stock/styles/pharmacy-import-marks-ask.css` | css | 10 | 99, 104, 106, 111, 113, 115, 117, 122, 127, 132 |
| `src/features/platform/utils/companyAvatarUtils.js` | tsx/jsx/js | 10 | 10, 11, 12, 13, 14, 15, 16, 17, 72, 85 |
| `src/features/sales/components/ReturnDetailModal.jsx` | tsx/jsx/js | 10 | 20, 21, 48, 49, 50, 51, 58, 77, 80, 98 |
| `src/features/sales/components/ReturnsFiltersDrawer.jsx` | tsx/jsx/js | 10 | 8, 19, 21, 22, 26, 43, 46, 50, 51, 63 |
| `src/features/sales/components/returns/ReturnsTable.jsx` | tsx/jsx/js | 10 | 34, 55, 56, 65, 68, 69, 72, 75, 76, 78 |
| `src/features/tenant/components/stores/PlatformStoreDeleteModal.jsx` | tsx/jsx/js | 10 | 58, 83, 84, 86, 90, 96, 100, 104, 112, 117 |
| `src/features/tenant/constants.js` | tsx/jsx/js | 10 | 6, 7, 8, 9, 10, 11, 12, 13, 14, 15 |
| `src/pharmacy/pos/usePharmacyPosShell.js` | tsx/jsx/js | 10 | 5, 10, 11, 36, 46, 51, 99, 119, 142, 143 |
| `src/styles/shared/table-pagination.css` | css | 10 | 33, 37, 116, 120, 124, 128, 133, 139, 145, 151 |
| `src/features/cash-registers/components/CashRegistersFiltersDrawer.jsx` | tsx/jsx/js | 9 | 7, 18, 20, 21, 25, 32, 38, 44, 50 |
| `src/features/cash-registers/components/CashRegistersTable.jsx` | tsx/jsx/js | 9 | 18, 28, 45, 49, 50, 51, 52, 55, 76 |
| `src/features/cash-registers/components/z-reports/ZReportFiltersDrawer.jsx` | tsx/jsx/js | 9 | 8, 19, 21, 22, 26, 43, 56, 60, 64 |
| `src/shelfLabelPrint/ShelfLabelPrintControls.jsx` | print/label-settings | 9 | 3, 4, 11, 29, 33, 47, 50, 61, 65 |
| `src/shelfLabelPrint/ShelfLabelPrintModal.jsx` | print/label-settings | 9 | 44, 46, 47, 52, 59, 77, 90, 125, 130 |
| `src/styles/shared/tasnif-search.css` | css | 9 | 8, 47, 60, 82, 86, 97, 114, 135, 145 |
| `src/components/receipt/ThermalPrintSettingsPanel.jsx` | tsx/jsx/js | 8 | 7, 10, 32, 33, 37, 41, 42, 151 |
| `src/features/cash-registers/components/CashRegisterConfigTable.jsx` | tsx/jsx/js | 8 | 25, 34, 49, 51, 60, 61, 62, 68 |
| `src/features/catalog/components/suppliers/SupplierModal.jsx` | tsx/jsx/js | 8 | 9, 11, 27, 28, 29, 35, 85, 89 |
| `src/features/dashboard/components/DashboardLowStockTable.jsx` | tsx/jsx/js | 8 | 15, 25, 33, 35, 38, 39, 42, 56 |
| `src/features/pharmacy-stock/styles/pharmacy-receipt-document-menu.css` | css | 8 | 103, 109, 110, 116, 122, 126, 130, 134 |
| `src/features/tenant/components/stores/PlatformStoreToggleActiveModal.jsx` | tsx/jsx/js | 8 | 53, 54, 58, 60, 63, 67, 72, 76 |
| `src/features/tenant/components/stores/stores-grouped/StoresGroupedBranchRow.jsx` | tsx/jsx/js | 8 | 32, 34, 36, 39, 59, 63, 70, 71 |
| `src/features/tenant/components/stores/stores-grouped/StoresGroupedSkeleton.jsx` | tsx/jsx/js | 8 | 6, 7, 8, 13, 17, 19, 20, 23 |
| `src/components/ui/PlatformErrorState.jsx` | tsx/jsx/js | 7 | 47, 51, 54, 57, 82, 89, 98 |
| `src/features/cash-registers/components/CashRegisterDetailsModal.jsx` | tsx/jsx/js | 7 | 48, 52, 53, 56, 131, 140, 157 |
| `src/features/sales/components/ReturnReasonModal.jsx` | tsx/jsx/js | 7 | 26, 28, 29, 30, 36, 44, 52 |
| `src/features/stock/styles/pharmacy-inventory.css` | css | 7 | 251, 252, 253, 254, 259, 263, 264 |
| `src/features/tenant/components/users/UserDeleteConfirmModal.jsx` | tsx/jsx/js | 7 | 9, 10, 11, 15, 20, 23, 28 |
| `src/styles/shared/product-lookup-select.css` | css | 7 | 172, 177, 178, 182, 187, 188, 192 |
| `src/styles/stock/document-lines.css` | css | 7 | 11, 26, 37, 77, 89, 101, 155 |
| `src/components/shared/TableRowActionsMenu.jsx` | tsx/jsx/js | 6 | 64, 83, 85, 86, 91, 110 |
| `src/components/tasnif/TasnifPackagePickerModal.jsx` | tsx/jsx/js | 6 | 21, 25, 26, 29, 33, 36 |
| `src/components/ui/Spinner.jsx` | tsx/jsx/js | 6 | 67, 68, 69, 103, 104, 105 |
| `src/features/cash-registers/components/CashRegisterConfigFiltersDrawer.jsx` | tsx/jsx/js | 6 | 8, 28, 30, 31, 35, 62 |
| `src/features/catalog/components/suppliers/SupplierFiltersDrawer.jsx` | tsx/jsx/js | 6 | 7, 18, 20, 21, 32, 44 |
| `src/features/pharmacy-stock/styles/pharmacy-product-lots.css` | css | 6 | 110, 114, 119, 120, 124, 129 |
| `src/features/tenant/components/barcode-print/BarcodePrintCurrentItemSection.jsx` | tsx/jsx/js | 6 | 14, 18, 25, 31, 35, 40 |
| `src/features/tenant/components/barcode-print/BarcodePrintSearchSection.jsx` | tsx/jsx/js | 6 | 43, 47, 50, 55, 73, 78 |
| `src/features/tenant/components/stores/StoreFormModalFields.jsx` | tsx/jsx/js | 6 | 9, 56, 85, 101, 107, 127 |
| `src/features/tenant/components/stores/stores-grouped/StoresGroupedToolbar.jsx` | tsx/jsx/js | 6 | 15, 18, 21, 29, 33, 38 |
| `src/components/ui/BaseModal.jsx` | tsx/jsx/js | 5 | 77, 86, 90, 100, 115 |
| `src/features/cash-registers/components/CashRegisterFormModal.jsx` | tsx/jsx/js | 5 | 17, 21, 22, 25, 85 |
| `src/features/cash-registers/components/CashRegistersListFooter.jsx` | tsx/jsx/js | 5 | 17, 20, 36, 49, 59 |
| `src/features/reports/pages/CashierPerformanceReportPage.jsx` | tsx/jsx/js | 5 | 17, 18, 27, 29, 41 |
| `src/features/reports/pages/DailySummaryReportPage.jsx` | tsx/jsx/js | 5 | 21, 22, 33, 38, 40 |
| `src/features/reports/pages/StockReceiptsReportPage.jsx` | tsx/jsx/js | 5 | 29, 30, 56, 71, 73 |
| `src/features/tenant/components/stores/PharmacyIntegrationSettingsModal.jsx` | tsx/jsx/js | 5 | 21, 25, 27, 32, 72 |
| `src/styles/admin/receipt-print-root.css` | print/label-settings | 5 | 12, 13, 14, 15, 24 |
| `src/styles/cash-registers/config.css` | css | 5 | 10, 25, 34, 60, 95 |
| `src/styles/cash-registers/multikassa-settings.css` | css | 5 | 110, 111, 115, 116, 122 |
| `src/styles/shared/on-screen-keyboard.css` | css | 5 | 28, 29, 30, 36, 37 |
| `src/features/pharmacy-stock/components/PharmacyReceiptPaymentFields.jsx` | tsx/jsx/js | 4 | 54, 65, 93, 98 |
| `src/features/reports/components/product-sales/ProductSalesReportTable.jsx` | tsx/jsx/js | 4 | 31, 62, 65, 70 |
| `src/features/reports/components/stock-balances/stock-balances-filters.css` | css | 4 | 11, 47, 72, 87 |
| `src/features/reports/pages/LowStockReportPage.jsx` | tsx/jsx/js | 4 | 19, 20, 46, 67 |
| `src/features/reports/pages/PriceRegistryJournalPage.jsx` | tsx/jsx/js | 4 | 18, 21, 76, 98 |
| `src/features/reports/pages/StockBalancesReportPage.jsx` | tsx/jsx/js | 4 | 18, 19, 49, 63 |
| `src/features/reports/pages/StockInventoriesReportPage.jsx` | tsx/jsx/js | 4 | 23, 24, 54, 68 |
| `src/features/reports/pages/StockTransfersReportPage.jsx` | tsx/jsx/js | 4 | 19, 20, 61, 74 |
| `src/features/reports/pages/StoreSalesReportPage.jsx` | tsx/jsx/js | 4 | 18, 19, 39, 53 |
| `src/features/sales/components/sales-ledger/SalesLedgerRowMenu.jsx` | tsx/jsx/js | 4 | 17, 25, 35, 43 |
| `src/features/tenant/components/stores/stores-grouped/StoresGroupedEmpty.jsx` | tsx/jsx/js | 4 | 6, 7, 10, 13 |
| `src/features/tenant/components/users/LogoUploadField.jsx` | tsx/jsx/js | 4 | 28, 31, 52, 60 |
| `src/features/tenant/components/users/ReceiptLogoSizeControl.jsx` | tsx/jsx/js | 4 | 12, 25, 30, 42 |
| `src/index.css` | css | 4 | 24, 29, 30, 31 |
| `src/store/themeStore.js` | tsx/jsx/js | 4 | 67, 93, 111, 136 |
| `src/styles/admin/document/shell.css` | css | 4 | 108, 109, 110, 114 |
| `src/styles/admin/electron-silent-print.css` | print/label-settings | 4 | 16, 17, 70, 71 |
| `src/styles/cash-registers/details.css` | css | 4 | 12, 48, 60, 82 |
| `src/styles/shared/page-search-field.css` | css | 4 | 52, 57, 61, 65 |
| `src/styles/tenant/pharmacy-integration-settings-modal.css` | css | 4 | 8, 18, 29, 50 |
| `src/utils/cashierDocumentPaint.js` | tsx/jsx/js | 4 | 4, 22, 25, 29 |
| `src/components/shared/GlobalOfflineBanner.jsx` | tsx/jsx/js | 3 | 42, 49, 55 |
| `src/features/pharmacy-stock/styles/pharmacy-products-supplier-cards.css` | css | 3 | 67, 72, 77 |
| `src/features/pharmacy-stock/styles/pharmacy-receipt-activate.css` | css | 3 | 22, 26, 30 |
| `src/features/pharmacy-stock/styles/pharmacy-receipt-line-bulk-bar.css` | css | 3 | 49, 54, 59 |
| `src/features/reports/pages/DrugRegistryPage.jsx` | tsx/jsx/js | 3 | 12, 15, 45 |
| `src/features/sales/components/sales-ledger/CreditAdvanceCell.jsx` | tsx/jsx/js | 3 | 10, 14, 18 |
| `src/features/stock/styles/pharmacy-transfer.css` | css | 3 | 99, 104, 109 |
| `src/features/tenant/components/stores/stores-grouped/StoresGroupedLocationCell.jsx` | tsx/jsx/js | 3 | 12, 18, 23 |
| `src/features/tenant/components/users/TenantSettingsSaveBar.jsx` | tsx/jsx/js | 3 | 24, 31, 46 |
| `src/features/tenant/components/users/UserCredentialsCreatedModal.jsx` | tsx/jsx/js | 3 | 33, 34, 35 |
| `src/styles/cash-registers/form-modal.css` | css | 3 | 13, 33, 69 |
| `src/App.jsx` | tsx/jsx/js | 2 | 2, 15 |
| `src/components/shared/AdminThemeSync.jsx` | tsx/jsx/js | 2 | 3, 5 |
| `src/components/shared/FormDraftNotice.jsx` | tsx/jsx/js | 2 | 14, 24 |
| `src/components/shared/LanguageSwitcher.jsx` | tsx/jsx/js | 2 | 63, 75 |
| `src/components/shared/LastUpdatedBadge.jsx` | tsx/jsx/js | 2 | 27, 30 |
| `src/components/ui/BaseButton.jsx` | tsx/jsx/js | 2 | 9, 13 |
| `src/features/ai/components/AiAssistantChartPanel.jsx` | tsx/jsx/js | 2 | 9, 10 |
| `src/features/ai/pages/AiAssistantPage.jsx` | tsx/jsx/js | 2 | 13, 14 |
| `src/features/billing/components/BillingLedgerConfirmModal.jsx` | tsx/jsx/js | 2 | 34, 35 |
| `src/features/cash-registers/pages/CashRegisterConfigPage.jsx` | tsx/jsx/js | 2 | 20, 25 |
| `src/features/cash-registers/pages/CashRegisterTransferPage.jsx` | tsx/jsx/js | 2 | 20, 25 |
| `src/features/cash-registers/pages/ZReportsPage.jsx` | tsx/jsx/js | 2 | 22, 27 |
| `src/features/pharmacy-cashier/styles/pharmacy-qty-modal.css` | css | 2 | 115, 119 |
| `src/features/pharmacy-stock/styles/pharmacy-product-delete.css` | css | 2 | 15, 19 |
| `src/features/pharmacy-stock/styles/pharmacy-receipt-delete.css` | css | 2 | 15, 19 |
| `src/features/pharmacy-stock/styles/pharmacy-selection-bar.css` | css | 2 | 40, 45 |
| `src/features/reports/pages/ReportsHubPage.jsx` | tsx/jsx/js | 2 | 10, 11 |
| `src/features/sales/components/sales-ledger/ShiftCell.jsx` | tsx/jsx/js | 2 | 12, 22 |
| `src/features/tenant/components/barcode-print/BarcodePrintPageHeader.jsx` | tsx/jsx/js | 2 | 4, 5 |
| `src/features/tenant/components/stores/PlatformStoresGroupedView.jsx` | tsx/jsx/js | 2 | 56, 102 |
| `src/features/tenant/components/users/SettingsFieldToggles.jsx` | tsx/jsx/js | 2 | 7, 15 |
| `src/pharmacy/app/PharmacyAdminTopbar.jsx` | tsx/jsx/js | 2 | 22, 44 |
| `src/pharmacy/pos/PharmacyPosShell.jsx` | tsx/jsx/js | 2 | 37, 38 |
| `src/styles/admin/table-id-columns.css` | css | 2 | 38, 42 |
| `src/styles/admin/tokens.css` | css | 2 | 34, 61 |
| `src/styles/cashier/shell/shell-base.css` | css | 2 | 3, 7 |
| `src/styles/platform/tokens.css` | css | 2 | 36, 39 |
| `src/styles/tenant/users-barcode-print.css` | print/label-settings | 2 | 35, 49 |
| `index.html` | tsx/jsx/js | 1 | 7 |
| `src/components/shared/TablePagination.jsx` | tsx/jsx/js | 1 | 50 |
| `src/components/ui/BaseTable.jsx` | tsx/jsx/js | 1 | 41 |
| `src/components/ui/ErrorBanner.jsx` | tsx/jsx/js | 1 | 4 |
| `src/features/billing/components/BillingPaymentsList.test.js` | tsx/jsx/js | 1 | 76 |
| `src/features/cash-registers/components/CashRegisterErrorBanner.jsx` | tsx/jsx/js | 1 | 3 |
| `src/features/cash-registers/components/CashRegisterHintBanner.jsx` | tsx/jsx/js | 1 | 5 |
| `src/features/cash-registers/components/z-reports/ZReportsRowMenu.jsx` | tsx/jsx/js | 1 | 22 |
| `src/features/cash-registers/pages/CashRegistersListPage.jsx` | tsx/jsx/js | 1 | 24 |
| `src/features/dashboard/components/DashboardStatCard.jsx` | tsx/jsx/js | 1 | 14 |
| `src/features/dashboard/pages/DashboardPage.jsx` | tsx/jsx/js | 1 | 30 |
| `src/features/pharmacy-stock/components/PharmacyBulkNumberModal.jsx` | tsx/jsx/js | 1 | 51 |
| `src/features/pharmacy-stock/styles/pharmacy-import-match-bar.css` | css | 1 | 10 |
| `src/features/pharmacy-stock/styles/pharmacy-receipt-document-card.css` | css | 1 | 37 |
| `src/features/pharmacy-stock/styles/pharmacy-receipt-marks-bar.css` | css | 1 | 13 |
| `src/features/reports/components/ReportExportButton.jsx` | tsx/jsx/js | 1 | 29 |
| `src/features/reports/components/ReportProductNameCell.jsx` | tsx/jsx/js | 1 | 7 |
| `src/features/reports/components/ReportsHubSection.jsx` | tsx/jsx/js | 1 | 18 |
| `src/features/sales/components/sales-ledger/PaymentIcon.jsx` | tsx/jsx/js | 1 | 18 |
| `src/features/stock/utils/stockDocumentFormUtils.js` | tsx/jsx/js | 1 | 2 |
| `src/features/tenant/components/barcode-print/barcodePrintFormUi.js` | tsx/jsx/js | 1 | 2 |
| `src/features/tenant/utils/userFormModalUtils.js` | tsx/jsx/js | 1 | 2 |
| `src/pharmacy/app/PharmacyAdminSidebar.jsx` | tsx/jsx/js | 1 | 239 |
| `src/pharmacy/app/sidebar/SidebarGroupExpanded.jsx` | tsx/jsx/js | 1 | 27 |
| `src/pharmacy/app/sidebar/SidebarReportsExpanded.jsx` | tsx/jsx/js | 1 | 36 |
| `src/pharmacy/app/usePharmacyAdminShell.js` | tsx/jsx/js | 1 | 9 |
| `src/services/cashierEscpos/buildReceiptQrImage.js` | tsx/jsx/js | 1 | 27 |
| `src/styles/admin/print-media.css` | print/label-settings | 1 | 15 |
| `src/styles/shared/shelf-label-print.css` | print/label-settings | 1 | 50 |
| `src/styles/tokens/colors.css` | css | 1 | 31 |
| `src/utils/cashierTheme.js` | tsx/jsx/js | 1 | 28 |

## 3. Hard-Coded Colors by File

### 3.1 Token Files (`src/styles/tokens/`) (1 files)

| File | Hex | `rgb`/`hsl` | Default TW Palette Classes |
|---|---|---|---|
| `src/styles/tokens/colors.css` | `#006847`, `#005538`, `#043d2c`, `#0a7a52`, `#e6f2ec`, `#d1e8dc`, `#ffffff`, `#0f2a1f`, `#0f172a`, `#64748b` (+8) | `rgb(0 104 71 / 0.18)`, `rgb(0 104 71 / 0.22)`, `rgb(0 104 71 / 0.35)`, `rgb(16 185 129 / 0.22)` | — |

### 3.2 Print & Label-Settings Files (note: print output out of scope; UI settings panels inside `shelfLabelPrint/` noted) (10 files)

| File | Hex | `rgb`/`hsl` | Default TW Palette Classes |
|---|---|---|---|
| `src/shelfLabelPrint/LabelTsplSettingsPanel.jsx` | — | — | `border-violet-200`, `bg-violet-50/50`, `border-violet-900/50`, `bg-violet-950/20`, `text-slate-800`, `text-slate-100`, `text-slate-600`, `text-slate-400`, `text-slate-700`, `text-slate-200` (+18) |
| `src/shelfLabelPrint/ShelfLabelBarcode.jsx` | — | — | `text-slate-400` |
| `src/shelfLabelPrint/ShelfLabelPrintControls.jsx` | — | — | `border-slate-100`, `border-slate-700`, `text-slate-700`, `text-slate-200`, `bg-emerald-500`, `bg-slate-300`, `bg-slate-600`, `bg-emerald-600`, `text-slate-600`, `bg-slate-100` (+8) |
| `src/shelfLabelPrint/ShelfLabelPrintModal.jsx` | — | — | `bg-slate-900`, `border-slate-200`, `border-slate-700`, `text-slate-900`, `text-slate-500`, `bg-slate-100`, `bg-slate-800`, `border-slate-100`, `border-slate-600`, `bg-slate-950` (+8) |
| `src/shelfLabelPrint/ShelfLabelPrintSettingsPanel.jsx` | — | — | `text-slate-700`, `text-slate-200`, `border-slate-300`, `border-slate-600`, `bg-slate-800`, `border-slate-200`, `border-slate-700`, `bg-slate-900`, `text-slate-500`, `text-slate-400` (+33) |
| `src/styles/admin/electron-silent-print.css` | `#0f172a`, `#fff`, `#000` | — | — |
| `src/styles/admin/print-media.css` | `#000` | — | — |
| `src/styles/admin/receipt-print-root.css` | `#000`, `#fff` | — | — |
| `src/styles/shared/shelf-label-print.css` | `#0f172a`, `#f8fafc`, `#fff`, `#000` | — | — |
| `src/styles/tenant/users-barcode-print.css` | `#fff` | `rgb(226 232 240)`, `rgb(15 23 42 / 0.05)`, `rgb(51 65 85)`, `rgb(15 23 42)`, `rgb(100 116 139)`, `rgb(148 163 184)` | — |

### 3.3 Non-Token CSS & HTML Files (193 files)

| File | Hex | `rgb`/`hsl` | Default TW Palette Classes |
|---|---|---|---|
| `index.html` | `#0f172a` | — | — |
| `src/features/billing/BillingPaymentNoticeOverlay.css` | `#fcd34d`, `#fffbeb`, `#78350f`, `#92400e`, `#a16207`, `#f59e0b`, `#fff`, `#fef3c7`, `#d97706` | `rgba(15, 23, 42, 0.18)` | — |
| `src/features/fiscal/cashier-fiscal-theme.css` | `#c5d4e8`, `#5b6f8a`, `#1d4f91`, `#e8eef6` | — | — |
| `src/features/pharmacy-cashier/styles/pharmacy-cart-pane-head.css` | `#d5ddd8`, `#f4f7f5`, `#1a2e28`, `#d8f5e3`, `#0b5c3a`, `#fff`, `#64748b`, `#eef2ff`, `#3730a3`, `#eef5f1` (+3) | `rgb(180 35 24 / 0.06)` | — |
| `src/features/pharmacy-cashier/styles/pharmacy-cart-table-columns.css` | `#245b45`, `#174936`, `#dddcd5`, `#f2f1ec`, `#26332d` | — | — |
| `src/features/pharmacy-cashier/styles/pharmacy-cart-table.css` | `#15803d`, `#fff`, `#111`, `#ff8a80`, `#b42318` | — | — |
| `src/features/pharmacy-cashier/styles/pharmacy-cash-move-modal.css` | `#fff`, `#134842` | `rgb(255 255 255 / 0.82)`, `rgb(255 255 255 / 0.16)`, `rgb(255 255 255 / 0.28)`, `rgb(255 255 255 / 0.35)`, `rgb(255 255 255 / 0.12)` | — |
| `src/features/pharmacy-cashier/styles/pharmacy-cashier.css` | `#f8f7f3` | `rgb(0 104 71 / 0.28)` | — |
| `src/features/pharmacy-cashier/styles/pharmacy-catalog-toolbar.css` | `#dddcd5`, `#f7f6f1`, `#26332d`, `#7a817c`, `#245b45`, `#f8f7f3` | `rgb(38 51 45 / 0.12)` | — |
| `src/features/pharmacy-cashier/styles/pharmacy-compact-shell.css` | `#fff`, `#94a3b8`, `#0b5c3a`, `#d8f5e3`, `#006847`, `#7a5b00`, `#fff3cd`, `#d97706` | `rgb(0 104 71 / 0.2)` | — |
| `src/features/pharmacy-cashier/styles/pharmacy-context-pane.css` | `#dddcd5`, `#f8f7f3`, `#7a817c`, `#26332d` | — | — |
| `src/features/pharmacy-cashier/styles/pharmacy-discount-modal.css` | `#fff` | `rgb(36 91 69 / 0.18)` | — |
| `src/features/pharmacy-cashier/styles/pharmacy-integration-more.css` | — | `rgb(15 23 42 / 0.16)` | — |
| `src/features/pharmacy-cashier/styles/pharmacy-mixed-pay-modal.css` | `#dddcd5`, `#fff` | — | — |
| `src/features/pharmacy-cashier/styles/pharmacy-modal-shell.css` | `#134842`, `#0e3834`, `#1f2024`, `#8b9198`, `#e4e7ec`, `#fff`, `#e7f6ec`, `#f8e6c8`, `#8a5a12`, `#f8d7d4` (+3) | `rgb(19 72 66 / 0.12)`, `rgb(38 51 45 / 0.18)`, `rgb(36 91 69 / 0.12)`, `rgb(36 91 69 / 0.14)`, `rgb(38 51 45 / 0.42)`, `rgb(255 255 255 / 0.82)` (+3) | — |
| `src/features/pharmacy-cashier/styles/pharmacy-parked-cards.css` | `#006847`, `#fff`, `#d5ddd8`, `#1a2e28`, `#64748b`, `#b42318`, `#fff5f5`, `#fee2e2`, `#121826`, `#f3f4f6` (+5) | `rgb(15 23 42 / 0.16)`, `rgba(255, 255, 255, 0.1)`, `rgb(0 0 0 / 0.45)`, `rgba(15, 23, 42, 0.72)`, `rgba(46, 196, 182, 0.14)`, `rgba(46, 196, 182, 0.35)` (+2) | — |
| `src/features/pharmacy-cashier/styles/pharmacy-pay-rail.css` | `#f7f8f9`, `#d5dbe3`, `#1a2332`, `#8b95a5`, `#006847`, `#e7f3ec`, `#c4a35a`, `#fff`, `#eef1f5`, `#9dceb5` (+32) | `rgb(0 80 55 / 0.22)`, `rgb(255 255 255 / 0.45)`, `rgb(0 0 0 / 0.14)`, `rgb(26 143 122 / 0.16)`, `rgb(248 113 113 / 0.12)`, `rgb(248 113 113 / 0.35)` (+7) | — |
| `src/features/pharmacy-cashier/styles/pharmacy-pay-stack-theme.css` | `#c3c7d2`, `#1f2024`, `#8b9198`, `#e4e7ec`, `#f4f6f8`, `#3b3e45` | `rgb(19 72 66 / 0.08)` | — |
| `src/features/pharmacy-cashier/styles/pharmacy-pay-stack.css` | `#f8f7f3`, `#26332d`, `#dddcd5`, `#f7f6f1`, `#7a817c`, `#e6f2de`, `#245b45`, `#fff`, `#d9534f`, `#e3f1dc` (+2) | `rgb(255 255 255 / 0.75)` | — |
| `src/features/pharmacy-cashier/styles/pharmacy-pos-board.css` | `#fff`, `#e3e8e4`, `#ecfdf5`, `#b7e4c7`, `#134842`, `#05966a`, `#eef1ef`, `#c3c7d2`, `#1f2024`, `#e4e7ec` (+6) | — | — |
| `src/features/pharmacy-cashier/styles/pharmacy-preview-receipt.css` | `#26332d`, `#7a817c`, `#f8e6c8`, `#8a5a12`, `#dddcd5`, `#245b45`, `#fff` | — | — |
| `src/features/pharmacy-cashier/styles/pharmacy-qty-modal.css` | `#26332d`, `#7a817c`, `#dddcd5`, `#fff`, `#e7f6ec`, `#245b45`, `#174936`, `#8a5a12`, `#a33b35`, `#134842` | `rgb(36 91 69 / 0.12)`, `rgb(36 91 69 / 0.1)`, `rgb(36 91 69 / 0.22)`, `rgb(38 51 45 / 0.18)`, `rgb(255 255 255 / 0.12)`, `rgb(255 255 255 / 0.22)` (+8) | — |
| `src/features/pharmacy-cashier/styles/pharmacy-return-modal.css` | `#fff`, `#134842`, `#245b45`, `#7a817c`, `#dddcd5`, `#174936`, `#a33b35` | `rgb(255 255 255 / 0.16)`, `rgb(255 255 255 / 0.28)`, `rgb(255 255 255 / 0.82)`, `rgb(255 255 255 / 0.35)`, `rgb(255 255 255 / 0.12)`, `rgb(36 91 69 / 0.18)` | — |
| `src/features/pharmacy-cashier/styles/pharmacy-search-strip-theme.css` | `#e4e7ec`, `#8b9198`, `#fff`, `#3b3e45`, `#4476d7`, `#05966a` | — | — |
| `src/features/pharmacy-cashier/styles/pharmacy-search-strip.css` | `#fff`, `#243044` | `rgb(148 163 184 / 0.16)` | — |
| `src/features/pharmacy-cashier/styles/pharmacy-search-table-fiscal.css` | `#0b5c3a` | — | — |
| `src/features/pharmacy-cashier/styles/pharmacy-search-table-stock.css` | `#dddcd5`, `#f7f6f1`, `#26332d`, `#d9534f` | — | — |
| `src/features/pharmacy-cashier/styles/pharmacy-search-table.css` | — | `rgb(46 196 182 / 0.18)`, `rgb(0 104 71 / 0.2)` | — |
| `src/features/pharmacy-cashier/styles/pharmacy-shell-chrome.css` | `#0d9488`, `#0f766e`, `#d5ddd8`, `#1a2e28`, `#fff`, `#006847`, `#26332d`, `#245b45` | `rgb(13 148 136 / 0.16)`, `rgb(15 118 110 / 0.12)`, `rgb(15 40 30 / 0.05)`, `rgb(0 104 71 / 0.1)` | — |
| `src/features/pharmacy-cashier/styles/pharmacy-stock-count.css` | `#006847` | — | — |
| `src/features/pharmacy-cashier/styles/pharmacy-tables-layout.css` | — | `rgb(100 116 139 / 0.45)` | — |
| `src/features/pharmacy-cashier/styles/pharmacy-tables-theme.css` | `#006847`, `#005538`, `#0d9488`, `#26332d`, `#7a817c`, `#e3e8e4`, `#fff`, `#e7f6ec`, `#e3f1dc`, `#cfe8c4` (+11) | `rgb(0 104 71 / 0.14)`, `rgb(13 148 136 / 0.16)`, `rgb(0 104 71 / 0.28)`, `rgb(36 91 69 / 0.12)`, `rgb(36 91 69 / 0.1)`, `rgb(36 91 69 / 0.22)` | — |
| `src/features/pharmacy-cashier/styles/pharmacy-topbar-shortcuts.css` | `#64748b`, `#d5ddd8`, `#fff`, `#1a2e28`, `#006847`, `#d8e0dc`, `#334155` | `rgb(15 40 30 / 0.06)`, `rgb(0 104 71 / 0.12)` | — |
| `src/features/pharmacy-cashier/styles/pharmacy-weight-modal.css` | `#fff` | `rgb(36 91 69 / 0.18)` | — |
| `src/features/pharmacy-stock/styles/pharmacy-import-marks-ask.css` | `#64748b`, `#b45309`, `#0f172a`, `#e2e8f0`, `#006847`, `#f1f5f9`, `#94a3b8`, `#fbbf24`, `#334155`, `#1e293b` | — | — |
| `src/features/pharmacy-stock/styles/pharmacy-import-match-bar.css` | `#e2e8f0`, `#fff`, `#0f172a`, `#86efac`, `#f0fdf4`, `#166534`, `#fcd34d`, `#fffbeb`, `#92400e`, `#fca5a5` (+5) | `rgba(15, 23, 42, 0.92)`, `rgba(148, 163, 184, 0.25)` | — |
| `src/features/pharmacy-stock/styles/pharmacy-import-match-table.css` | `#006847`, `#dcfce7`, `#166534`, `#fef3c7`, `#92400e`, `#fee2e2`, `#b91c1c`, `#e2e8f0`, `#475569`, `#64748b` (+5) | — | — |
| `src/features/pharmacy-stock/styles/pharmacy-product-delete.css` | `#475569`, `#b45309`, `#cbd5e1`, `#fbbf24` | — | — |
| `src/features/pharmacy-stock/styles/pharmacy-product-lots.css` | `#e2e8f0`, `#64748b`, `#fff`, `#0f172a`, `#334155`, `#ecfdf5`, `#047857`, `#f8fafc`, `#cbd5e1`, `#6ee7b7` | `rgba(148, 163, 184, 0.25)`, `rgba(148, 163, 184, 0.18)`, `rgba(16, 185, 129, 0.15)` | — |
| `src/features/pharmacy-stock/styles/pharmacy-products-supplier-cards.css` | `#e2e8f0`, `#fff`, `#94a3b8`, `#10b981`, `#ecfdf5`, `#64748b`, `#0f172a`, `#34d399`, `#f8fafc` | `rgba(148, 163, 184, 0.25)`, `rgba(16, 185, 129, 0.12)` | — |
| `src/features/pharmacy-stock/styles/pharmacy-receipt-activate.css` | `#475569`, `#b45309`, `#64748b`, `#cbd5e1`, `#fbbf24`, `#94a3b8` | — | — |
| `src/features/pharmacy-stock/styles/pharmacy-receipt-delete.css` | `#475569`, `#b45309`, `#cbd5e1`, `#fbbf24` | — | — |
| `src/features/pharmacy-stock/styles/pharmacy-receipt-document-card.css` | — | `rgba(15, 23, 42, 0.04)`, `rgba(15, 23, 42, 0.05)`, `rgba(0, 0, 0, 0.22)` | — |
| `src/features/pharmacy-stock/styles/pharmacy-receipt-document-menu.css` | `#f8fafc`, `#64748b`, `#006847`, `#e2e8f0`, `#fff`, `#0f172a`, `#b91c1c`, `#fef2f2`, `#94a3b8`, `#6ee7b7` (+1) | `rgba(15, 23, 42, 0.06)`, `rgba(15, 23, 42, 0.12)`, `rgba(148, 163, 184, 0.12)`, `rgba(0, 104, 71, 0.18)`, `rgba(52, 211, 153, 0.28)`, `rgba(148, 163, 184, 0.28)` (+1) | — |
| `src/features/pharmacy-stock/styles/pharmacy-receipt-line-bulk-bar.css` | `#e2e8f0`, `#f0fdf4`, `#dcfce7`, `#166534`, `#64748b`, `#bbf7d0`, `#94a3b8` | `rgba(6, 78, 59, 0.22)`, `rgba(148, 163, 184, 0.22)`, `rgba(22, 101, 52, 0.45)` | — |
| `src/features/pharmacy-stock/styles/pharmacy-receipt-mark-scan.css` | `#64748b`, `#d8dee6`, `#0f172a`, `#006847`, `#15803d`, `#e2e8f0`, `#fff`, `#94a3b8` | — | — |
| `src/features/pharmacy-stock/styles/pharmacy-receipt-marks-bar.css` | `#e2e8f0`, `#f8fafc`, `#006847`, `#fff`, `#64748b` | `rgba(30, 41, 59, 0.75)`, `rgba(148, 163, 184, 0.22)` | — |
| `src/features/pharmacy-stock/styles/pharmacy-receipt-mass.css` | `#e6edf5`, `#f8fafc`, `#475569`, `#d7dee8`, `#fff`, `#0f172a`, `#1d4ed8`, `#334155` | — | — |
| `src/features/pharmacy-stock/styles/pharmacy-selection-bar.css` | `#bbf7d0`, `#f0fdf4`, `#e2e8f0`, `#dcfce7`, `#166534` | `rgba(6, 78, 59, 0.22)`, `rgba(74, 222, 128, 0.28)`, `rgba(22, 101, 52, 0.45)` | — |
| `src/features/pharmacy-stock/styles/pharmacy-stock.css` | `#006847`, `#005538`, `#0b5c3a`, `#e2e8f0`, `#0f172a`, `#64748b`, `#15803d`, `#dcfce7`, `#b45309`, `#ffedd5` (+43) | `rgba(15, 23, 42, 0.85)`, `rgba(148, 163, 184, 0.35)`, `rgba(15, 23, 42, 0.7)`, `rgba(148, 163, 184, 0.3)`, `rgba(15, 23, 42, 0.92)`, `rgba(148, 163, 184, 0.25)` (+16) | — |
| `src/features/reports/components/stock-balances/stock-balances-filters.css` | `#e2e8f0`, `#fff`, `#f8fafc`, `#0f172a`, `#1e293b`, `#64748b`, `#94a3b8`, `#334155`, `#cbd5e1`, `#059669` | — | — |
| `src/features/reports/pages/price-registry-journal.css` | `#f59e0b`, `#e2e8f0`, `#334155`, `#fef3c7`, `#92400e`, `#d1fae5`, `#065f46`, `#e0f2fe`, `#075985`, `#f1f5f9` (+1) | — | — |
| `src/features/stock/styles/pharmacy-inventory.css` | `#e2e8f0`, `#fff`, `#64748b`, `#f8fafc`, `#334155`, `#15803d`, `#16a34a`, `#e11d48` | `rgba(15, 23, 42, 0.92)`, `rgba(148, 163, 184, 0.25)`, `rgba(30, 41, 59, 0.85)` | — |
| `src/features/stock/styles/pharmacy-transfer.css` | `#e2e8f0`, `#fff`, `#475569`, `#006847`, `#64748b`, `#0f172a`, `#f8fafc` | `rgb(0 104 71 / 0.14)`, `rgba(15, 23, 42, 0.92)`, `rgba(148, 163, 184, 0.25)`, `rgba(30, 41, 59, 0.85)`, `rgba(148, 163, 184, 0.22)` | — |
| `src/index.css` | `#0b1210` | — | — |
| `src/pharmacy/pos/pharmacy-pos-shell.css` | `#f1f4f9`, `#134842`, `#fff`, `#9aa89f`, `#8ee6a8`, `#e8f6ee`, `#e4e7ec`, `#3c4250`, `#1f8a4c` | `rgb(0 0 0 / 0.16)`, `rgb(142 230 168 / 0.25)`, `rgb(255 255 255 / 0.12)`, `rgb(19 72 66 / 0.16)`, `rgb(38 51 45 / 0.28)`, `rgb(15 23 42 / 0.28)` (+1) | — |
| `src/styles/admin/buttons.css` | `#0f7a45`, `#fff`, `#0c6840`, `#e5e7eb`, `#1e293b`, `#f8fafc`, `#d5dbe3`, `#b7e0c8`, `#f3faf6`, `#0b7a4b` (+3) | `rgb(15 90 50 / 0.2)`, `rgb(15 23 42 / 0.04)` | — |
| `src/styles/admin/document/footer.css` | `#fff`, `#64748b`, `#15803d`, `#16a34a`, `#334155`, `#e11d48`, `#0b7a4b`, `#08663e` | — | — |
| `src/styles/admin/document/kpi.css` | `#fff`, `#9aa6b2`, `#15803d`, `#c2410c`, `#e11d48`, `#64748b` | — | — |
| `src/styles/admin/document/meta.css` | `#fff`, `#9aa6b2`, `#e11d48`, `#e2e8f0`, `#006847` | `rgb(0 104 71 / 0.16)` | — |
| `src/styles/admin/document/shell.css` | `#fff`, `#006847`, `#c5ced6`, `#334155`, `#f6edd4`, `#8a6414`, `#f8fafc`, `#e2e8f0` | `rgb(15 23 42)` | — |
| `src/styles/admin/document/tokens.css` | `#e6ebe8`, `#f0f3f1`, `#10241c`, `#8b98a5` | `rgb(16 36 28 / 0.04)` | — |
| `src/styles/admin/forms.css` | `#ffffff`, `#0f172a`, `#cbd5e1`, `#94a3b8`, `#f1f5f9`, `#64748b`, `#334155`, `#1e293b`, `#10b981` | `rgba(16, 185, 129, 0.22)` | — |
| `src/styles/admin/modals.css` | `#ffffff`, `#0f172a`, `#f1f5f9`, `#94a3b8`, `#334155`, `#1e293b`, `#64748b`, `#e2e8f0`, `#10b981`, `#cbd5e1` | `rgba(16, 185, 129, 0.22)` | — |
| `src/styles/admin/shell.css` | `#0f1a15`, `#f8fafc`, `#334155`, `#cbd5e1`, `#a7f3d0`, `#e2e8f0`, `#fff`, `#475569`, `#0f172a`, `#0a7a52` (+7) | `rgb(0 104 71 / 0.35)`, `rgb(0 104 71 / 0.22)`, `rgb(226 232 240 / 0.8)`, `rgb(0 104 71 / 0.18)`, `rgb(0 104 71 / 0.28)`, `rgb(226 232 240 / 0.7)` (+12) | — |
| `src/styles/admin/table-id-columns.css` | `#64748b`, `#475569`, `#94a3b8` | — | — |
| `src/styles/admin/tables-canonical.css` | `#e6f2ec`, `#043d2c`, `#a7f3d0`, `#0f172a`, `#334155`, `#f1f5f9`, `#1e293b`, `#94a3b8` | `rgb(0 104 71 / 0.22)`, `rgb(230 242 236 / 0.45)`, `rgb(0 104 71 / 0.12)` | — |
| `src/styles/admin/tokens.css` | `#eef3f0`, `#0b1210` | `rgb(15 42 31 / 0.04)`, `rgb(15 42 31 / 0.03)`, `rgb(15 42 31 / 0.08)`, `rgb(0 0 0 / 0.35)` | — |
| `src/styles/billing.css` | `#0f3d2e`, `#1a5c45`, `#e8f5ef`, `#e2e8f0`, `#2563eb`, `#eff6ff`, `#7c3aed`, `#f5f3ff`, `#d97706`, `#fffbeb` (+63) | `rgba(124, 58, 237, 0.28)`, `rgba(14, 165, 233, 0.22)`, `rgba(15, 61, 46, 0.22)`, `rgba(255, 255, 255, 0.12)`, `rgba(167, 139, 250, 0.35)`, `rgba(56, 189, 248, 0.28)` (+39) | — |
| `src/styles/cash-registers/config.css` | — | `rgb(226 232 240)`, `rgb(51 65 85)`, `rgb(30 41 59)`, `rgb(236 253 245)`, `rgb(6 78 59 / 0.25)`, `rgb(100 116 139)` (+1) | — |
| `src/styles/cash-registers/details.css` | — | `rgb(226 232 240)`, `rgb(51 65 85)`, `rgb(100 116 139)`, `rgb(148 163 184)`, `rgb(15 23 42)`, `rgb(248 250 252)` (+1) | — |
| `src/styles/cash-registers/form-modal.css` | `#fff` | `rgb(71 85 105)`, `rgb(148 163 184)`, `rgb(203 213 225)`, `rgb(15 23 42)`, `rgb(15 23 42 / 0.04)`, `rgb(16 185 129 / 0.35)` (+8) | — |
| `src/styles/cash-registers/multikassa-settings.css` | `#334155`, `#cbd5e1`, `#fff`, `#0f172a`, `#059669`, `#f8fafc`, `#ecfdf5`, `#34d399`, `#64748b`, `#0f766e` (+4) | `rgb(16 185 129 / 0.35)` | — |
| `src/styles/cashier/cart/cart-mark-vertical.css` | `#ffedd5`, `#9a3412` | `rgb(154 52 18 / 0.18)` | — |
| `src/styles/cashier/cart/cart-table.css` | `#f8f9fb`, `#9ca3af`, `#e8eaed`, `#fff`, `#fafbfc`, `#f4faf7`, `#f5f6f8`, `#f0f7f3`, `#fecdd3`, `#fff1f2` (+17) | `rgb(225 29 72 / 0.12)`, `rgba(15, 23, 42, 0.04)`, `rgba(15, 23, 42, 0.03)` | — |
| `src/styles/cashier/cart/footer-totals.css` | `#fff`, `#6b7280`, `#374151`, `#b91c1c`, `#111827` | — | — |
| `src/styles/cashier/cart/order-panel.css` | `#fff`, `#ede9fe`, `#ddd6fe`, `#6d28d9`, `#92400e`, `#fff7ed`, `#fdba74`, `#ffedd5`, `#fb923c`, `#b91c1c` (+4) | — | — |
| `src/styles/cashier/cart/parked-bar.css` | `#e8f5ef`, `#fff`, `#dc2626`, `#fecaca`, `#fef2f2`, `#fee2e2`, `#f3f4f6`, `#fca5a5` | `rgba(46, 196, 182, 0.08)`, `rgba(255, 255, 255, 0.08)`, `rgba(15, 23, 42, 0.55)`, `rgba(255, 255, 255, 0.1)`, `rgba(248, 113, 113, 0.12)`, `rgba(248, 113, 113, 0.35)` | — |
| `src/styles/cashier/cart/register-finder.css` | `#ecfdf5`, `#a7f3d0`, `#047857`, `#9ca3af`, `#fff`, `#f3f4f6`, `#6b7280`, `#bfdbfe`, `#eff6ff`, `#1d4ed8` (+4) | `rgba(255, 255, 255, 0.08)`, `rgba(46, 196, 182, 0.16)`, `rgba(46, 196, 182, 0.4)`, `rgba(243, 244, 246, 0.55)`, `rgba(15, 23, 42, 0.55)`, `rgba(255, 255, 255, 0.1)` (+5) | — |
| `src/styles/cashier/catalog-panel/legacy-grid.css` | — | `rgb(226 232 240)`, `rgb(16 185 129)`, `rgb(16 185 129 / 0.12)` | — |
| `src/styles/cashier/catalog-panel/panel.css` | `#f3f4f6`, `#9ca3af`, `#dbe4ee`, `#eef2f7`, `#334155`, `#c5d0dc`, `#e4eaf2`, `#fff` | `rgb(0 91 65 / 0.08)`, `rgb(0 104 71 / 0.25)`, `rgb(0 104 71 / 0.35)`, `rgb(0 104 71 / 0.1)`, `rgb(0 104 71 / 0.2)` | — |
| `src/styles/cashier/catalog-panel/pos-desktop-type.css` | `#64748b` | — | — |
| `src/styles/cashier/catalog-panel/product-card.css` | `#334155` | `rgb(0 104 71 / 0.12)` | — |
| `src/styles/cashier/catalog-panel/quick-filters.css` | `#9ca3af`, `#e5e7eb`, `#fff`, `#374151`, `#d1d5db`, `#f9fafb`, `#006847`, `#111827`, `#eef2ff`, `#4f46e5` (+25) | `rgba(15, 23, 42, 0.04)`, `rgb(61 214 198 / 0.22)` | — |
| `src/styles/cashier/components/cashier-notifications.css` | `#fff`, `#ef4444`, `#f8fafc`, `#dc2626` | `rgb(15 23 42 / 0.18)`, `rgb(0 104 71 / 0.08)`, `rgb(239 68 68 / 0.08)`, `rgb(15 23 42 / 0.08)`, `rgb(15 23 42 / 0.06)` | — |
| `src/styles/cashier/components/print-receipt-toggle.css` | `#c5ccd6`, `#fff`, `#9ca3af`, `#f9fafb`, `#006847`, `#e8f5ef`, `#111827`, `#151b26`, `#2a3548`, `#1c2433` (+1) | `rgb(15 23 42 / 0.06)` | — |
| `src/styles/cashier/light-theme/catalog.css` | — | `rgb(0 104 71 / 0.35)`, `rgb(0 104 71 / 0.1)` | — |
| `src/styles/cashier/light-theme/discount-modal.css` | `#ffffff`, `#c5ccd6`, `#1e3a5f`, `#e2e8f0`, `#eef8f3`, `#5a6f8c`, `#fef2f2`, `#b91c1c`, `#006847`, `#e8f5ef` (+8) | `rgb(30 58 95 / 0.14)`, `rgb(220 38 38 / 0.35)`, `rgb(30 58 95 / 0.04)`, `rgb(0 104 71 / 0.45)`, `rgb(0 104 71 / 0.12)`, `rgb(0 104 71 / 0.4)` (+4) | — |
| `src/styles/cashier/light-theme/light-accent-ink.css` | — | `rgb(0 104 71 / 0.28)`, `rgb(0 104 71 / 0.08)`, `rgb(0 104 71 / 0.16)`, `rgb(0 104 71 / 0.2)`, `rgb(0 104 71 / 0.35)` | — |
| `src/styles/cashier/light-theme/lock.css` | `#fff` | `rgb(240 242 245 / 0.92)` | — |
| `src/styles/cashier/light-theme/payment.css` | `#f9fafb`, `#fff`, `#c5ccd6`, `#374151`, `#f3f4f6`, `#9ca3af`, `#d1d5db`, `#166534`, `#b91c1c`, `#1d4ed8` | `rgb(30 58 95 / 0.28)`, `rgb(15 23 42 / 0.06)` | — |
| `src/styles/cashier/light-theme/pos-blocks.css` | — | `rgb(15 23 42 / 0.06)` | — |
| `src/styles/cashier/light-theme/pos-slate-ink.css` | `#fff`, `#fef2f2`, `#fecaca`, `#dc2626`, `#f1f5f9`, `#64748b`, `#38bdf8`, `#6366f1`, `#d97706`, `#059669` (+2) | `rgb(0 104 71 / 0.35)`, `rgb(0 80 55 / 0.22)` | — |
| `src/styles/cashier/light-theme/return-modal.css` | `#ffffff`, `#c5ccd6`, `#1e3a5f`, `#eef8f3`, `#e2e8f0`, `#004530`, `#006847`, `#0a8a5c`, `#5a6f8c`, `#94a3b8` (+6) | `rgb(30 58 95 / 0.14)`, `rgb(30 58 95 / 0.04)`, `rgb(0 104 71 / 0.15)`, `rgb(0 104 71 / 0.12)`, `rgb(0 104 71 / 0.1)`, `rgb(0 104 71 / 0.4)` (+4) | — |
| `src/styles/cashier/light-theme/secondary-pages.css` | `#f8faf9`, `#fafbfc`, `#eef3f8`, `#e6edf5` | `rgb(30 58 95 / 0.06)`, `rgb(30 58 95 / 0.28)`, `rgb(30 58 95 / 0.08)`, `rgb(0 104 71 / 0.28)`, `rgb(0 80 55 / 0.22)`, `rgb(0 80 55 / 0.26)` | — |
| `src/styles/cashier/light-theme/shell.css` | `#fff`, `#fef2f2`, `#fecaca`, `#dc2626`, `#f1f5f9`, `#0f172a` | `rgb(15 23 42 / 0.12)` | — |
| `src/styles/cashier/light-theme/shift-modal.css` | `#d1d9e6`, `#fbfcfe`, `#1e3a5f`, `#eef8f3`, `#5a6f8c`, `#dc2626`, `#006847`, `#fff`, `#005538`, `#b91c1c` (+3) | `rgb(0 80 55 / 0.12)`, `rgb(248 113 113 / 0.45)`, `rgb(248 113 113 / 0.08)`, `rgb(0 104 71 / 0.12)`, `rgb(0 104 71 / 0.28)`, `rgb(0 80 55 / 0.2)` (+1) | — |
| `src/styles/cashier/modals/cart-discount.css` | `#e5e7eb`, `#6b7280`, `#111827`, `#fff`, `#006847`, `#e8f5ef`, `#151b26`, `#2a3548`, `#f1f5f9`, `#2ec4b6` (+6) | `rgb(0 104 71 / 0.12)`, `rgb(0 80 55 / 0.2)`, `rgb(46 196 182 / 0.12)`, `rgb(46 196 182 / 0.45)`, `rgb(46 196 182 / 0.1)`, `rgb(248 113 113 / 0.45)` (+1) | — |
| `src/styles/cashier/modals/customer-card.css` | `#fff`, `#eef8f3`, `#6b7280`, `#006847`, `#005538`, `#0f172a`, `#f3f4f6` | `rgba(15, 23, 42, 0.45)`, `rgb(0 80 55 / 0.14)`, `rgb(0 80 55 / 0.2)`, `rgba(255, 255, 255, 0.1)`, `rgba(255, 255, 255, 0.12)`, `rgba(243, 244, 246, 0.7)` | — |
| `src/styles/cashier/modals/payment/cash-movement-modal.css` | `#d1d9e6`, `#fff`, `#0f172a`, `#e5e7eb`, `#e8f5f0`, `#006847`, `#fff7ed`, `#c2410c`, `#64748b`, `#f1f5f9` (+15) | `rgb(15 23 42 / 0.22)`, `rgb(0 104 71 / 0.08)`, `rgb(0 104 71 / 0.16)`, `rgb(0 104 71 / 0.24)`, `rgb(194 65 12 / 0.28)`, `rgb(0 0 0 / 0.55)` (+1) | — |
| `src/styles/cashier/modals/payment/payment-modal.css` | — | `rgb(0 0 0 / 0.55)`, `rgb(0 0 0 / 0.15)`, `rgb(100 116 139)`, `rgb(4 120 87)`, `rgb(241 245 249)`, `rgb(148 163 184)` (+15) | — |
| `src/styles/cashier/modals/payment/payment-shift.css` | `#fff` | `rgb(226 232 240)`, `rgb(16 185 129)`, `rgb(4 120 87)`, `rgba(25, 135, 84, 0.08)`, `rgba(25, 135, 84, 0.15)`, `rgb(254 202 202)` (+5) | — |
| `src/styles/cashier/modals/payment/shift-terminal-modal.css` | `#2ec4b6`, `#26b3a6`, `#2a3548`, `#f1f5f9`, `#94a3b8`, `#151b26`, `#1c2433`, `#fca5a5`, `#0a1218`, `#dc2626` (+3) | `rgb(0 0 0 / 0.55)`, `rgb(46 196 182 / 0.12)`, `rgb(248 113 113 / 0.45)`, `rgb(248 113 113 / 0.12)`, `rgb(28 36 51)`, `rgb(46 196 182 / 0.45)` (+3) | — |
| `src/styles/cashier/modals/return/partial-return-qty.css` | `#f0faf5`, `#d1e7dd`, `#0f172a`, `#334155`, `#e2e8f0`, `#f8fafc`, `#64748b`, `#b45309`, `#006847`, `#cbd5e1` (+5) | `rgb(15 23 42 / 0.08)`, `rgb(0 104 71 / 0.35)`, `rgb(248 250 252)`, `rgb(100 116 139)`, `rgb(241 245 249)`, `rgb(236 253 245)` (+7) | — |
| `src/styles/cashier/modals/return/receipt-return.css` | `#fff`, `#f0faf5`, `#e8ecef`, `#006847`, `#64748b`, `#94a3b8`, `#475569`, `#f1f5f9`, `#d1d5db`, `#111827` (+10) | `rgb(15 23 42 / 0.18)`, `rgb(0 0 0 / 0.06)`, `rgb(0 104 71 / 0.12)`, `rgb(0 104 71 / 0.2)`, `rgb(0 104 71 / 0.28)`, `rgb(0 104 71 / 0.32)` | — |
| `src/styles/cashier/my-sales/banners.css` | `#a3cfbb`, `#d1e7dd`, `#0a3622` | — | — |
| `src/styles/cashier/my-sales/master-detail.css` | `#e5e7eb`, `#f9fafb`, `#111827`, `#ecfdf5`, `#006847`, `#fff`, `#374151`, `#f3f4f6`, `#6b7280`, `#d1d5db` (+6) | `rgb(0 104 71 / 0.45)`, `rgb(15 23 42 / 0.06)`, `rgb(15 23 42 / 0.12)`, `rgb(0 104 71 / 0.24)`, `rgb(0 104 71 / 0.28)` | — |
| `src/styles/cashier/my-sales/my-sales-readable-type.css` | `#334155` | — | — |
| `src/styles/cashier/my-sales/shift-stats.css` | `#e8f5ef`, `#f8fffb`, `#fff`, `#006847`, `#111827`, `#6b7280` | `rgb(0 104 71 / 0.2)`, `rgb(15 23 42 / 0.06)` | — |
| `src/styles/cashier/my-sales/table.css` | `#fff`, `#dee2e6`, `#f8f9fa`, `#6c757d`, `#eee`, `#f1f3f5`, `#fde8e8`, `#c92a2a`, `#fff3bf`, `#e67700` (+29) | `rgb(15 23 42 / 0.06)` | — |
| `src/styles/cashier/my-sales/terminal-overrides.css` | `#f1f5f9`, `#94a3b8`, `#f87171`, `#1c2433`, `#f5c842`, `#000`, `#7ee8df`, `#93c5fd`, `#67e8f9`, `#c4b5fd` (+4) | `rgb(0 0 0 / 0.22)`, `rgb(248 113 113 / 0.12)`, `rgb(248 113 113 / 0.35)`, `rgb(0 0 0 / 0.45)`, `rgb(46 196 182 / 0.14)`, `rgb(96 165 250 / 0.14)` (+8) | — |
| `src/styles/cashier/my-sales/top-toolbar.css` | `#eef8f3`, `#f9fffc`, `#6b7280`, `#006847`, `#111827`, `#e8f5ef`, `#f8fffb`, `#fff` | `rgb(0 104 71 / 0.18)`, `rgb(0 104 71 / 0.2)`, `rgb(15 23 42 / 0.06)` | — |
| `src/styles/cashier/pay-panel.css` | `#eef1f4`, `#fff`, `#e5e7eb`, `#f9fafb`, `#d1d5db`, `#fef2f2`, `#fecaca`, `#e8ecea`, `#eff6ff`, `#2563eb` (+2) | `rgb(15 23 42 / 0.06)`, `rgb(15 23 42 / 0.04)`, `rgb(15 23 42 / 0.08)` | — |
| `src/styles/cashier/pin-login.css` | `#f8fafc`, `#10b981`, `#0f172a`, `#64748b`, `#e2e8f0`, `#fff`, `#94a3b8`, `#334155`, `#475569`, `#f87171` (+4) | `rgb(15 23 42 / 0.08)`, `rgb(16 185 129 / 0.18)`, `rgb(15 23 42 / 0.12)`, `rgb(16 185 129 / 0.15)`, `rgb(15 23 42 / 0.06)`, `rgb(15 23 42 / 0.3)` | — |
| `src/styles/cashier/pos-credit-customer.css` | — | `rgb(0 80 55 / 0.18)` | — |
| `src/styles/cashier/pos-keypad.css` | `#374151`, `#eef2f7`, `#9ca3af`, `#e2e8f0`, `#64748b`, `#111827`, `#1c2433`, `#2a3548`, `#f1f5f9` | `rgb(15 23 42 / 0.06)`, `rgb(148 163 184 / 0.45)` | — |
| `src/styles/cashier/pos-layout/cash-terminal.css` | `#f1f5f9`, `#2ec4b6`, `#94a3b8`, `#f87171`, `#b91c1c`, `#fff`, `#dc2626` | `rgb(46 196 182 / 0.35)`, `rgb(46 196 182 / 0.08)` | — |
| `src/styles/cashier/pos-layout/catalog-search.css` | `#1c2433`, `#2a3548`, `#94a3b8` | `rgb(46 196 182 / 0.1)`, `rgb(46 196 182 / 0.35)`, `rgb(30 58 95 / 0.15)` | — |
| `src/styles/cashier/pos-layout/order-panel-totals-foot.css` | `#e5e7eb`, `#eef1f5`, `#6b7280`, `#fff`, `#111827`, `#9ca3af`, `#cfe0f5`, `#1f2937`, `#f8fbff`, `#b6d0ef` (+20) | `rgba(15, 23, 42, 0.04)` | — |
| `src/styles/cashier/pos-layout/page-grid.css` | `#151b26`, `#2a3548` | `rgb(0 0 0 / 0.35)` | — |
| `src/styles/cashier/pos-layout/qty-control.css` | `#151b26`, `#2a3548`, `#f1f5f9`, `#fff`, `#243044`, `#2ec4b6`, `#fca5a5`, `#f87171`, `#121820`, `#e5e7eb` (+3) | `rgb(46 196 182 / 0.08)`, `rgb(46 196 182 / 0.1)`, `rgb(46 196 182 / 0.35)`, `rgb(46 196 182 / 0.12)`, `rgb(127 29 29 / 0.35)`, `rgb(248 113 113 / 0.45)` (+1) | — |
| `src/styles/cashier/pos-layout/register-table.css` | `#1c2433`, `#2a3548`, `#94a3b8`, `#151b26`, `#2ec4b6`, `#f1f5f9`, `#f5c842` | `rgb(46 196 182 / 0.06)` | — |
| `src/styles/cashier/pos-layout/toast.css` | `#0f172a`, `#006847`, `#2a3548`, `#1c2433`, `#f1f5f9`, `#2ec4b6` | — | — |
| `src/styles/cashier/register-pay-rail/card-providers.css` | — | `rgb(15 23 42 / 0.12)`, `rgb(0 0 0 / 0.35)` | — |
| `src/styles/cashier/register-pay-rail/card-type.css` | `#94a3b8`, `#2a3548`, `#2ec4b6`, `#1c2433`, `#141b28`, `#f1f5f9`, `#f5c842`, `#f8fafc`, `#eef2f7` | `rgb(0 0 0 / 0.22)`, `rgb(46 196 182 / 0.12)`, `rgb(46 196 182 / 0.22)`, `rgb(46 196 182 / 0.08)`, `rgb(46 196 182 / 0.55)`, `rgb(46 196 182 / 0.14)` (+1) | — |
| `src/styles/cashier/register-pay-rail/credit-step.css` | `#f5c842` | — | — |
| `src/styles/cashier/register-pay-rail/pay-rail-footer.css` | `#006847`, `#fff`, `#005538` | `rgb(0 80 55 / 0.28)` | — |
| `src/styles/cashier/register-pay-rail/pay-rail-keypad-action-contrast.css` | `#374151`, `#1e3a5f`, `#eef2f8`, `#d1d9e6`, `#f1f5f9`, `#1c2433`, `#2a3548` | — | — |
| `src/styles/cashier/register-pay-rail/pay-rail-keypad-light-surface.css` | `#ffffff`, `#94a3b8`, `#0f172a`, `#f8fafc`, `#64748b`, `#e2e8f0`, `#475569`, `#fee2e2`, `#f87171`, `#991b1b` (+1) | `rgb(255 255 255 / 0.9)`, `rgb(15 23 42 / 0.1)`, `rgb(15 23 42 / 0.08)`, `rgb(15 23 42 / 0.12)`, `rgb(185 28 28 / 0.12)`, `rgb(185 28 28 / 0.08)` | — |
| `src/styles/cashier/register-pay-rail/pay-rail-light.css` | `#fff`, `#eff6ff`, `#93c5fd`, `#dbeafe`, `#60a5fa`, `#2563eb`, `#1e3a5f` | `rgb(15 23 42 / 0.06)`, `rgb(0 80 55 / 0.28)` | — |
| `src/styles/cashier/register-pay-rail/pay-rail-pos-compact.css` | `#0f172a`, `#1e3a5f` | — | — |
| `src/styles/cashier/register-pay-rail/pay-rail-theme.css` | `#ffffff`, `#d1d9e6`, `#6b7280`, `#006847`, `#0f172a`, `#e8f5ef`, `#eff6ff`, `#93c5fd`, `#1d4ed8`, `#2563eb` (+44) | `rgb(15 23 42 / 0.06)`, `rgb(0 104 71 / 0.28)`, `rgb(255 255 255 / 0.65)`, `rgb(16 185 129 / 0.16)`, `rgb(245 158 11 / 0.16)`, `rgb(0 0 0 / 0.28)` (+18) | — |
| `src/styles/cashier/register-pay-rail/pay-rail-tools.css` | — | `rgb(15 23 42 / 0.06)`, `rgb(15 23 42 / 0.04)`, `rgb(255 255 255 / 0.35)`, `rgb(16 185 129 / 0.22)`, `rgb(245 158 11 / 0.22)`, `rgb(0 0 0 / 0.22)` (+3) | — |
| `src/styles/cashier/register-pay-rail/pay-shell-transition.css` | `#fafbfc`, `#1c2433` | — | — |
| `src/styles/cashier/register-pay-rail/payment-method.css` | `#f5c842` | — | — |
| `src/styles/cashier/register-pay-rail/rail-shell.css` | `#f1f5f9`, `#2a3548`, `#1c2433`, `#151b26`, `#2ec4b6`, `#94a3b8`, `#f5c842`, `#0c1018`, `#006847`, `#fff` (+1) | `rgb(46 196 182 / 0.4)`, `rgb(0 104 71 / 0.24)`, `rgb(255 255 255 / 0.55)` | — |
| `src/styles/cashier/register.css` | — | `rgb(15 23 42 / 0.04)` | — |
| `src/styles/cashier/responsive/pos-catalog-canonical.css` | `#334155` | — | — |
| `src/styles/cashier/responsive/responsive-mini.css` | `#e5e7eb`, `#fff`, `#111827`, `#006847`, `#6b7280` | `rgb(0 104 71 / 0.35)`, `rgb(0 104 71 / 0.08)` | — |
| `src/styles/cashier/responsive/responsive-my-sales.css` | `#fff`, `#e5e7eb`, `#f8faf9`, `#111827`, `#e8f5ef`, `#006847`, `#6b7280`, `#fef2f2`, `#fecaca`, `#b91c1c` (+3) | `rgb(15 23 42 / 0.05)`, `rgb(0 104 71 / 0.35)`, `rgb(0 104 71 / 0.08)`, `rgb(0 104 71 / 0.12)` | — |
| `src/styles/cashier/responsive/responsive-top-nav.css` | `#eceef1`, `#d1d5db`, `#6b7280`, `#fff`, `#006847` | `rgb(15 23 42 / 0.08)` | — |
| `src/styles/cashier/secondary-pages/handbook-terminal.css` | `#f1f5f9`, `#94a3b8`, `#78350f` | `rgb(0 0 0 / 0.25)` | — |
| `src/styles/cashier/secondary-pages/panel-tokens.css` | `#151b26`, `#1c2433`, `#2a3548`, `#f1f5f9`, `#94a3b8` | — | — |
| `src/styles/cashier/secondary-pages/support-terminal.css` | `#f1f5f9`, `#94a3b8`, `#92400e`, `#c2410c`, `#ffedd5`, `#e0f2fe`, `#0369a1`, `#78350f`, `#fef3c7`, `#fcd34d` | `rgb(0 0 0 / 0.2)` | — |
| `src/styles/cashier/shell/cashier-bottom-nav-collapse.css` | `#fff`, `#22c55e`, `#f59e0b`, `#92400e`, `#d1d5db` | `rgb(0 80 55 / 0.12)`, `rgb(34 197 94 / 0.28)`, `rgb(245 158 11 / 0.28)`, `rgba(15, 23, 42, 0.25)` | — |
| `src/styles/cashier/shell/cashier-bottom-nav.css` | `#fff`, `#d1d9e6` | `rgb(0 104 71 / 0.25)`, `rgb(0 80 55 / 0.22)`, `rgb(15 23 42 / 0.06)`, `rgb(0 0 0 / 0.25)` | — |
| `src/styles/cashier/shell/cashier-zoom.css` | `#fff` | — | — |
| `src/styles/cashier/shell/offline-sync-progress.css` | `#eff6ff`, `#1e3a8a`, `#ecfdf5`, `#065f46`, `#fef2f2`, `#991b1b`, `#fff`, `#dbeafe`, `#d1fae5`, `#fecaca` | `rgb(37 99 235 / 0.25)`, `rgb(15 23 42 / 0.14)`, `rgb(16 185 129 / 0.35)`, `rgb(239 68 68 / 0.35)`, `rgb(15 23 42 / 0.08)`, `rgb(30 58 138 / 0.92)` (+5) | — |
| `src/styles/cashier/shell/offline-topbar.css` | `#1d4ed8`, `#eff6ff`, `#93c5fd`, `#047857`, `#ecfdf5`, `#a7f3d0`, `#92400e`, `#fef3c7`, `#fcd34d`, `#991b1b` (+9) | `rgb(59 130 246 / 0.14)`, `rgb(59 130 246 / 0.4)`, `rgb(46 196 182 / 0.12)`, `rgb(46 196 182 / 0.35)`, `rgb(251 191 36 / 0.12)`, `rgb(251 191 36 / 0.35)` (+2) | — |
| `src/styles/cashier/shell/shell-base.css` | `#198754`, `#fff` | `rgba(15, 23, 42, 0.35)`, `rgba(255, 255, 255, 0.65)`, `rgba(255, 255, 255, 0.92)`, `rgba(15, 23, 42, 0.18)`, `rgb(15 23 42 / 0.04)` | — |
| `src/styles/cashier/shell/shell-desktop-layout.css` | — | `rgb(30 58 95 / 0.1)`, `rgb(30 58 95 / 0.14)` | — |
| `src/styles/cashier/shell/shell-desktop-topbar.css` | `#fff`, `#0f172a`, `#64748b`, `#fef2f2`, `#b91c1c`, `#f4f6fa`, `#b45309`, `#d1d5db`, `#86efac`, `#f59e0b` (+1) | `rgb(0 104 71 / 0.35)`, `rgb(0 104 71 / 0.12)`, `rgb(15 23 42 / 0.18)`, `rgb(0 80 55 / 0.1)`, `rgb(245 158 11 / 0.16)`, `rgba(15, 23, 42, 0.25)` | — |
| `src/styles/cashier/shell/shell-lang-switch.css` | `#f9fafb`, `#eef2f6`, `#fff`, `#d1d5db`, `#e8f5ef`, `#d4ede3`, `#f4faf7`, `#dbe4ee`, `#eef2f7`, `#334155` (+2) | `rgb(0 80 55 / 0.28)`, `rgb(0 104 71 / 0.35)`, `rgb(0 104 71 / 0.08)`, `rgb(0 104 71 / 0.18)`, `rgb(0 104 71 / 0.22)`, `rgb(0 104 71 / 0.2)` (+2) | — |
| `src/styles/cashier/shell/shell-paint.css` | `#0c1018`, `#f1f5f9`, `#e9eef4`, `#1e3a5f` | — | — |
| `src/styles/cashier/shell/shell-pos-topbar.css` | `#fff`, `#006847`, `#7c3aed`, `#fecaca`, `#fef2f2`, `#dc2626`, `#fee2e2`, `#fca5a5`, `#b91c1c`, `#0f172a` (+1) | `rgb(0 104 71 / 0.16)`, `rgb(0 104 71 / 0.35)`, `rgb(0 104 71 / 0.18)`, `rgb(0 104 71 / 0.14)`, `rgb(15 23 42 / 0.12)`, `rgb(46 196 182 / 0.2)` (+3) | — |
| `src/styles/cashier/shell/shell-topbar-readable.css` | `#94a3b8`, `#cbd5e1`, `#fff` | `rgb(0 104 71 / 0.2)` | — |
| `src/styles/cashier/terminal-theme/catalog.css` | — | `rgb(46 196 182 / 0.45)`, `rgb(0 0 0 / 0.35)`, `rgb(46 196 182 / 0.12)`, `rgb(46 196 182 / 0.25)`, `rgb(46 196 182 / 0.35)`, `rgb(0 0 0 / 0.4)` (+1) | — |
| `src/styles/cashier/terminal-theme/modals-secondary.css` | `#0a1218` | `rgb(245 200 66 / 0.12)`, `rgb(245 200 66 / 0.35)`, `rgb(46 196 182 / 0.15)` | — |
| `src/styles/cashier/terminal-theme/payment.css` | `#0a1218` | `rgb(46 196 182 / 0.15)`, `rgb(46 196 182 / 0.08)` | — |
| `src/styles/cashier/terminal-theme/portals.css` | `#2a3548`, `#2ec4b6`, `#26b3a6`, `#94a3b8`, `#f1f5f9`, `#f5c842`, `#151b26`, `#0a1218`, `#fff`, `#1c2433` (+5) | `rgb(8 12 18 / 0.82)`, `rgb(0 0 0 / 0.55)`, `rgb(46 196 182 / 0.08)`, `rgb(46 196 182 / 0.12)`, `rgb(46 196 182 / 0.35)`, `rgb(255 255 255 / 0.08)` (+7) | — |
| `src/styles/cashier/terminal-theme/register-cart.css` | — | `rgb(0 0 0 / 0.35)`, `rgb(46 196 182 / 0.25)`, `rgb(46 196 182 / 0.08)`, `rgb(248 113 113 / 0.1)`, `rgb(248 113 113 / 0.35)`, `rgb(255 255 255 / 0.06)` | — |
| `src/styles/cashier/terminal-theme/topbar.css` | `#f87171`, `#fca5a5`, `#f1f5f9`, `#f8fafc`, `#94a3b8`, `#a7f3d0`, `#0a1218`, `#fff` | `rgb(46 196 182 / 0.35)`, `rgb(239 68 68 / 0.12)`, `rgb(239 68 68 / 0.35)`, `rgb(239 68 68 / 0.18)`, `rgb(239 68 68 / 0.45)`, `rgb(46 196 182 / 0.3)` (+6) | — |
| `src/styles/cashier/tokens.css` | `#c5ccd6`, `#fff`, `#f3f4f6`, `#0f172a`, `#475569`, `#1a8f7a`, `#157a68`, `#0b3d34`, `#146b5c`, `#1fa892` (+34) | `rgb(26 143 122 / 0.16)`, `rgb(0 104 71 / 0.12)` | — |
| `src/styles/finance/accounts.css` | — | `rgb(241 245 249)`, `rgb(71 85 105)` | — |
| `src/styles/finance/bulk-actions.css` | — | `rgb(239 246 255)`, `rgb(191 219 254)`, `rgb(30 64 175)`, `rgb(5 150 105)`, `rgb(51 65 85)`, `rgb(100 116 139)` (+1) | — |
| `src/styles/finance/chart-tooltip.css` | `#fff` | `rgb(34 197 94 / 0.35)`, `rgb(239 68 68 / 0.35)`, `rgb(15 23 42)`, `rgb(226 232 240)`, `rgb(15 23 42 / 0.28)`, `rgb(148 163 184)` (+5) | — |
| `src/styles/finance/common.css` | `#fff` | `rgb(226 232 240)`, `rgb(15 23 42 / 0.06)`, `rgb(241 245 249)`, `rgb(100 116 139)`, `rgb(248 250 252)`, `rgb(37 99 235)` (+12) | — |
| `src/styles/finance/counterparty-field.css` | — | `rgb(5 150 105)`, `rgb(4 120 87)` | — |
| `src/styles/finance/daily-chart.css` | — | `rgb(226 232 240)`, `rgb(15 23 42 / 0.06)`, `rgb(15 23 42)`, `rgb(100 116 139)`, `rgb(34 197 94)`, `rgb(239 68 68)` | — |
| `src/styles/finance/dashboard.css` | `#006847`, `#043d2c`, `#fff` | `rgb(226 232 240)`, `rgb(15 42 31 / 0.06)`, `rgb(0 104 71 / 0.28)`, `rgb(15 42 31 / 0.08)`, `rgb(100 116 139)`, `rgb(15 23 42)` (+6) | — |
| `src/styles/finance/debts.css` | — | `rgb(15 23 42)`, `rgb(71 85 105)`, `rgb(100 116 139)` | — |
| `src/styles/finance/detail-modal.css` | `#fff` | `rgb(241 245 249)`, `rgb(15 23 42)`, `rgb(100 116 139)`, `rgb(248 250 252)`, `rgb(255 255 255)`, `rgb(148 163 184)` (+13) | — |
| `src/styles/finance/forms.css` | `#fff` | `rgb(71 85 105)`, `rgb(148 163 184)`, `rgb(241 245 249)`, `rgb(226 232 240)`, `rgb(248 250 252)`, `rgb(15 23 42 / 0.04)` | — |
| `src/styles/finance/incomes.css` | `#e2e8f0`, `#fff`, `#334155`, `#94a3b8`, `#f8fafc`, `#0f766e`, `#ecfdf5` | — | — |
| `src/styles/finance/recent-transactions.css` | — | `rgb(226 232 240)`, `rgb(15 23 42 / 0.06)`, `rgb(15 23 42)`, `rgb(148 163 184)`, `rgb(100 116 139)`, `rgb(203 213 225)` (+8) | — |
| `src/styles/finance/reports.css` | — | `rgb(226 232 240)`, `rgb(15 23 42 / 0.06)`, `rgb(241 245 249)`, `rgb(71 85 105)`, `rgb(22 163 74)`, `rgb(220 38 38)` (+4) | — |
| `src/styles/finance/sync.css` | `#fff` | `rgb(226 232 240)`, `rgb(15 23 42)`, `rgb(100 116 139)`, `rgb(236 253 245)`, `rgb(5 150 105)`, `rgb(254 242 242)` (+3) | — |
| `src/styles/handbook/page.css` | — | `rgb(209 250 229)`, `rgb(6 95 70)`, `rgb(6 78 59 / 0.45)`, `rgb(110 231 183)`, `rgb(15 23 42)`, `rgb(248 250 252)` (+9) | — |
| `src/styles/platform/platform-filter-bar.css` | `#e6ebf1`, `#fff`, `#334155`, `#0f172a`, `#e2e8f0`, `#1e293b`, `#64748b`, `#f8fafc`, `#cbd5e1`, `#006847` (+6) | `rgb(15 23 42 / 0.12)`, `rgb(0 104 71 / 0.16)` | — |
| `src/styles/platform/tokens.css` | `#f1f5f9`, `#cbd5e1`, `#94a3b8`, `#0f172a`, `#334155` | — | — |
| `src/styles/shared/base-select.css` | `#fff`, `#94a3b8`, `#f1f5f9`, `#0f172a`, `#334155`, `#475569`, `#1e293b`, `#64748b`, `#e2e8f0`, `#ffffff` (+1) | `rgb(71 85 105)`, `rgb(203 213 225)`, `rgb(15 23 42)`, `rgb(15 23 42 / 0.04)`, `rgb(148 163 184)`, `rgb(16 185 129)` (+16) | — |
| `src/styles/shared/on-screen-keyboard.css` | `#fff` | `rgb(148 163 184 / 0.45)`, `rgb(255 255 255 / 0.9)`, `rgb(15 23 42)`, `rgb(241 245 249)`, `rgb(100 116 139 / 0.55)`, `rgb(30 41 59)` (+8) | — |
| `src/styles/shared/page-search-field.css` | `#fff`, `#006847`, `#0f172a`, `#0a7a52` | `rgb(203 213 225)`, `rgb(15 23 42 / 0.04)`, `rgb(0 104 71 / 0.18)`, `rgb(148 163 184)`, `rgb(51 65 85)`, `rgb(30 41 59)` (+1) | — |
| `src/styles/shared/product-lookup-select.css` | `#fff` | `rgb(71 85 105)`, `rgb(220 38 38)`, `rgb(248 113 113)`, `rgb(203 213 225)`, `rgb(15 23 42 / 0.04)`, `rgb(16 185 129)` (+11) | — |
| `src/styles/shared/receipt-printing-overlay.css` | `#fff`, `#047857`, `#10b981`, `#0f172a`, `#64748b` | `rgba(15, 23, 42, 0.18)`, `rgba(148, 163, 184, 0.2)` | — |
| `src/styles/shared/table-pagination.css` | `#fff` | `rgb(71 85 105)`, `rgb(15 23 42)`, `rgb(148 163 184)`, `rgb(226 232 240)`, `rgb(100 116 139)`, `rgb(241 245 249)` (+6) | — |
| `src/styles/shared/tasnif-search.css` | `#fff` | `rgb(16 185 129 / 0.35)`, `rgb(236 253 245 / 0.6)`, `rgb(16 185 129 / 0.25)`, `rgb(6 78 59 / 0.2)`, `rgb(5 150 105)`, `rgb(4 120 87)` (+10) | — |
| `src/styles/shared/unit-conversion-helper.css` | `#d1d9e6`, `#eef2f8`, `#1e3a5f`, `#5a6f8c`, `#fbfcfe`, `#006847`, `#fff`, `#005538`, `#e4eaf3`, `#1c2433` (+2) | `rgb(0 104 71 / 0.12)` | — |
| `src/styles/shared/weight-entry-modal.css` | `#1e3a5f`, `#5a6f8c`, `#006847`, `#004530`, `#0a8a5c`, `#003826`, `#005538`, `#087a52`, `#f4f6fa`, `#fbfcfe` (+6) | `rgb(0 104 71 / 0.12)`, `rgba(15, 23, 42, 0.45)`, `rgb(0 80 55 / 0.14)`, `rgb(0 104 71 / 0.35)`, `rgb(0 104 71 / 0.4)`, `rgb(0 104 71 / 0.28)` (+1) | — |
| `src/styles/stock/document-lines.css` | `#fff` | `rgb(226 232 240)`, `rgb(30 41 59)`, `rgb(15 23 42)`, `rgb(100 116 139)`, `rgb(248 250 252)`, `rgb(71 85 105)` (+6) | — |
| `src/styles/stock/inventory-document.css` | `#e6ebe8`, `#fff`, `#f0f3f1`, `#0f2a1f`, `#f1f5f4`, `#64748b`, `#e2e8f0`, `#006847`, `#b7d7c8`, `#f3faf6` (+13) | `rgb(16 36 28 / 0.04)`, `rgb(0 104 71 / 0.18)` | — |
| `src/styles/support/page.css` | — | `rgb(219 234 254)`, `rgb(29 78 216)`, `rgb(30 58 138 / 0.45)`, `rgb(147 197 253)`, `rgb(15 23 42)`, `rgb(248 250 252)` (+22) | — |
| `src/styles/tenant/pharmacy-integration-settings-modal.css` | `#2f6fed`, `#fff` | `rgb(71 85 105)`, `rgb(148 163 184)`, `rgb(226 232 240)`, `rgb(30 41 59)`, `rgb(15 23 42)`, `rgb(248 250 252)` (+3) | — |

### 3.4 JS/JSX Component & Feature Files (135 files)

| File | Hex | `rgb`/`hsl` | Default TW Palette Classes |
|---|---|---|---|
| `src/components/product-lookup/ProductLookupSelect.jsx` | — | — | `text-red-400` |
| `src/components/receipt/ReceiptQrCode.jsx` | `#ffffff`, `#000000` | — | — |
| `src/components/receipt/ThermalPrintSettingsPanel.jsx` | — | — | `border-emerald-600`, `bg-emerald-50`, `text-emerald-900`, `bg-emerald-100`, `border-emerald-500`, `bg-emerald-950/50`, `text-emerald-200`, `bg-emerald-900/40`, `border-slate-300`, `bg-slate-50` (+17) |
| `src/components/shared/FormDraftNotice.jsx` | — | — | `border-amber-200`, `bg-amber-50/90`, `text-amber-900`, `border-amber-800/70`, `bg-amber-950/40`, `text-amber-200`, `text-amber-700`, `text-amber-300`, `text-amber-100` |
| `src/components/shared/GlobalOfflineBanner.jsx` | — | — | `bg-amber-400`, `text-amber-950`, `bg-rose-600/95`, `bg-rose-700/95`, `border-rose-400/40`, `shadow-rose-900/20`, `bg-rose-500/40`, `text-rose-100`, `ring-rose-300/30`, `bg-emerald-600/95` (+13) |
| `src/components/shared/LanguageSwitcher.jsx` | — | — | `border-slate-300`, `bg-slate-100/90`, `border-slate-700`, `bg-slate-800/80`, `bg-emerald-500`, `text-slate-600`, `bg-slate-200/80`, `text-slate-900`, `text-slate-400`, `bg-slate-700/80` |
| `src/components/shared/LastUpdatedBadge.jsx` | — | — | `text-slate-500`, `text-slate-400` |
| `src/components/shared/TablePagination.jsx` | — | — | `border-slate-200`, `border-slate-800` |
| `src/components/shared/TableRowActionsMenu.jsx` | — | — | `border-slate-200`, `border-slate-700`, `bg-slate-900`, `text-slate-400`, `text-slate-500`, `text-red-600`, `text-red-400`, `bg-slate-100`, `bg-slate-800`, `text-slate-800` (+1) |
| `src/components/supplier-lookup/SupplierLookupSelect.jsx` | — | — | `text-red-400` |
| `src/components/tasnif/TasnifPackagePickerModal.jsx` | — | — | `border-slate-200`, `border-slate-700`, `bg-slate-900`, `border-slate-800`, `text-slate-900`, `text-slate-500`, `text-slate-800`, `text-slate-400`, `text-slate-600` |
| `src/components/ui/BaseButton.jsx` | — | — | `border-slate-300`, `text-slate-700`, `bg-slate-50`, `border-slate-700`, `bg-slate-800`, `text-slate-200`, `bg-slate-700`, `bg-red-600`, `bg-red-700`, `text-slate-500` (+2) |
| `src/components/ui/BaseModal.jsx` | — | — | `border-slate-200`, `border-slate-800`, `bg-slate-900`, `text-slate-900`, `text-slate-100`, `text-slate-400`, `text-slate-800`, `bg-slate-100`, `bg-slate-800`, `bg-slate-50/50` (+1) |
| `src/components/ui/BaseSelect.jsx` | — | — | `text-red-500` |
| `src/components/ui/BaseTable.jsx` | — | — | `text-slate-500`, `bg-slate-900` |
| `src/components/ui/ErrorBanner.jsx` | — | — | `border-red-200`, `bg-red-50`, `text-red-800`, `border-red-900/50`, `bg-red-950/40`, `text-red-200` |
| `src/components/ui/PlatformErrorState.jsx` | — | — | `text-amber-500`, `bg-amber-50`, `bg-amber-950/40`, `text-amber-400`, `border-amber-200`, `border-amber-800/50`, `text-rose-500`, `bg-rose-50`, `bg-rose-950/40`, `text-rose-400` (+17) |
| `src/components/ui/Spinner.jsx` | `#10b981`, `#047857`, `#fff`, `#065f46`, `#34d399`, `#64748b`, `#334155`, `#475569`, `#1e293b`, `#94a3b8` (+13) | `rgba(16,185,129,.28)`, `rgba(16,185,129,.16)`, `rgba(255,255,255,.18)`, `rgba(255,255,255,.72)`, `rgba(255,255,255,.22)`, `rgba(255,255,255,.88)` (+10) | — |
| `src/features/ai/components/AiAssistantChartPanel.jsx` | `#10b981`, `#3b82f6` | — | `border-slate-200`, `border-slate-800`, `bg-slate-900`, `text-slate-700`, `text-slate-200` |
| `src/features/ai/components/AiAssistantWidget.jsx` | — | — | `border-slate-200`, `border-slate-800`, `bg-slate-900`, `bg-emerald-500/10`, `text-emerald-500`, `text-slate-900`, `text-slate-500`, `text-slate-400`, `border-slate-300`, `text-slate-600` (+13) |
| `src/features/ai/pages/AiAssistantPage.jsx` | — | — | `text-slate-900`, `text-slate-600`, `text-slate-400` |
| `src/features/billing/components/BillingLedgerConfirmModal.jsx` | — | — | `text-slate-700`, `text-slate-200`, `text-slate-500`, `text-slate-400` |
| `src/features/billing/components/BillingPaymentsList.jsx` | — | — | `text-slate-500`, `text-slate-800`, `text-slate-100`, `border-slate-200`, `border-slate-700`, `text-slate-400`, `divide-slate-100`, `divide-slate-800`, `bg-slate-50`, `bg-slate-800` (+3) |
| `src/features/billing/components/BillingPaymentsList.test.js` | — | — | `text-slate-100` |
| `src/features/cash-registers/components/CashRegisterConfigAddModal.jsx` | — | — | `border-slate-300`, `text-slate-900`, `ring-emerald-500`, `border-slate-700`, `bg-slate-800`, `border-slate-200`, `bg-slate-900`, `border-slate-800`, `text-slate-500`, `text-slate-800` (+14) |
| `src/features/cash-registers/components/CashRegisterConfigFiltersDrawer.jsx` | — | — | `border-slate-300`, `text-slate-900`, `ring-emerald-500`, `border-slate-700`, `bg-slate-800`, `border-slate-200`, `bg-slate-900`, `border-slate-800`, `text-slate-500`, `text-slate-800` (+1) |
| `src/features/cash-registers/components/CashRegisterConfigTable.jsx` | — | — | `border-slate-200`, `bg-slate-50`, `text-slate-600`, `border-slate-800`, `bg-slate-800/50`, `text-slate-400`, `divide-slate-200`, `divide-slate-800`, `text-slate-500`, `bg-slate-50/80` (+7) |
| `src/features/cash-registers/components/CashRegisterDetailsModal.jsx` | — | — | `border-slate-200`, `border-slate-700`, `bg-slate-900`, `border-slate-800`, `text-slate-900`, `text-slate-500`, `text-slate-800`, `text-red-600`, `text-slate-400`, `border-slate-300` (+4) |
| `src/features/cash-registers/components/CashRegisterErrorBanner.jsx` | — | — | `border-red-200`, `bg-red-50`, `text-red-800`, `border-red-900/50`, `bg-red-950/40`, `text-red-200` |
| `src/features/cash-registers/components/CashRegisterFormModal.jsx` | — | — | `border-slate-200`, `border-slate-700`, `bg-slate-900`, `border-slate-800`, `text-slate-900`, `text-slate-500`, `text-slate-800`, `text-slate-400` |
| `src/features/cash-registers/components/CashRegisterHintBanner.jsx` | — | — | `text-emerald-900/90`, `text-emerald-100/90` |
| `src/features/cash-registers/components/CashRegistersFiltersDrawer.jsx` | — | — | `border-slate-300`, `text-slate-900`, `ring-emerald-500`, `border-slate-700`, `bg-slate-800`, `border-slate-200`, `bg-slate-900`, `border-slate-800`, `text-slate-500`, `text-slate-800` (+2) |
| `src/features/cash-registers/components/CashRegistersListFooter.jsx` | — | — | `border-slate-200`, `text-slate-600`, `border-slate-800`, `text-slate-400`, `text-slate-500`, `border-slate-300`, `border-slate-600` |
| `src/features/cash-registers/components/CashRegistersTable.jsx` | — | — | `border-slate-200`, `bg-slate-50`, `text-slate-600`, `border-slate-800`, `bg-slate-800/50`, `text-slate-400`, `divide-slate-200`, `divide-slate-800`, `text-slate-500`, `bg-slate-800/40` (+10) |
| `src/features/cash-registers/components/CashTransferFiltersDrawer.jsx` | — | — | `border-slate-300`, `text-slate-900`, `ring-emerald-500`, `border-slate-700`, `bg-slate-800`, `border-slate-200`, `bg-slate-900`, `border-slate-800`, `text-slate-500`, `text-slate-800` (+2) |
| `src/features/cash-registers/components/CashTransferTable.jsx` | — | — | `border-slate-200`, `bg-slate-50`, `text-slate-600`, `border-slate-800`, `bg-slate-800/50`, `text-slate-400`, `border-slate-700`, `divide-slate-200`, `divide-slate-800`, `text-slate-500` (+9) |
| `src/features/cash-registers/components/MultikassaSettingsModal.jsx` | `#26332d`, `#e4e7ec`, `#1f2024`, `#134842` | — | `text-slate-500` |
| `src/features/cash-registers/components/z-reports/ZReportFiltersDrawer.jsx` | — | — | `border-slate-300`, `text-slate-900`, `ring-emerald-500`, `border-slate-700`, `bg-slate-800`, `border-slate-200`, `bg-slate-900`, `border-slate-800`, `text-slate-500`, `text-slate-800` (+2) |
| `src/features/cash-registers/components/z-reports/ZReportsRowMenu.jsx` | — | — | `border-slate-200`, `border-slate-700`, `bg-slate-900` |
| `src/features/cash-registers/components/z-reports/ZReportsTable.jsx` | — | — | `border-slate-200`, `bg-slate-50`, `text-slate-600`, `border-slate-800`, `bg-slate-800/50`, `text-slate-400`, `border-slate-300`, `divide-slate-200`, `divide-slate-800`, `text-slate-500` (+10) |
| `src/features/cash-registers/pages/CashRegisterConfigPage.jsx` | — | — | `text-slate-900`, `border-slate-300`, `text-slate-800`, `bg-slate-50`, `border-slate-600`, `bg-slate-900`, `text-slate-100`, `bg-slate-800` |
| `src/features/cash-registers/pages/CashRegisterTransferPage.jsx` | — | — | `text-slate-900`, `border-slate-300`, `text-slate-800`, `bg-slate-50`, `border-slate-600`, `bg-slate-800`, `text-slate-200`, `bg-slate-700` |
| `src/features/cash-registers/pages/CashRegistersListPage.jsx` | — | — | `text-slate-900` |
| `src/features/cash-registers/pages/ZReportsPage.jsx` | — | — | `text-slate-900`, `border-slate-300`, `text-slate-800`, `bg-slate-50`, `border-slate-600`, `bg-slate-800`, `text-slate-200`, `bg-slate-700` |
| `src/features/cashier/components/CashierShiftModal.jsx` | — | — | `text-emerald-500`, `text-amber-500` |
| `src/features/cashier/utils/printShiftItemsReceipt.js` | `#000` | — | — |
| `src/features/catalog/components/suppliers/SupplierFiltersDrawer.jsx` | — | — | `border-slate-300`, `text-slate-900`, `ring-emerald-500`, `border-slate-700`, `bg-slate-800`, `border-slate-200`, `bg-slate-900`, `border-slate-800`, `text-slate-600`, `text-slate-400` |
| `src/features/catalog/components/suppliers/SupplierModal.jsx` | — | — | `border-slate-300`, `text-slate-900`, `ring-emerald-500`, `border-slate-700`, `bg-slate-800`, `text-slate-600`, `text-slate-400`, `border-slate-200`, `bg-slate-900`, `border-slate-800` (+6) |
| `src/features/catalog/components/suppliers/SuppliersTable.jsx` | — | — | `border-slate-200`, `bg-slate-50`, `text-slate-600`, `border-slate-700`, `bg-slate-800/80`, `text-slate-300`, `text-slate-500`, `text-slate-400`, `border-slate-100`, `border-slate-800/80` (+10) |
| `src/features/dashboard/components/DashboardChartsRow.jsx` | `#64748b`, `#94a3b8` | — | — |
| `src/features/dashboard/components/DashboardLowStockTable.jsx` | — | `rgb(252_165_165)` | `bg-red-50/60`, `border-red-900/40`, `bg-red-950/20`, `border-red-200`, `text-slate-600`, `border-slate-800`, `text-slate-500`, `divide-red-100`, `divide-slate-800`, `text-slate-800` (+3) |
| `src/features/dashboard/constants.js` | `#d7e5dd`, `#ffffff`, `#e2e8f0`, `#64748b`, `#006847` | — | — |
| `src/features/dashboard/pages/DashboardPage.jsx` | — | — | `border-amber-200`, `bg-amber-50`, `text-amber-900`, `border-amber-900/50`, `bg-amber-950/40`, `text-amber-200` |
| `src/features/pharmacy-stock/components/PharmacyBulkNumberModal.jsx` | — | — | `text-slate-600`, `text-slate-300`, `text-red-600` |
| `src/features/pharmacy-stock/components/PharmacyProductsTable.jsx` | — | — | `text-red-600` |
| `src/features/pharmacy-stock/components/PharmacyReceiptPaymentFields.jsx` | — | — | `border-slate-200`, `border-slate-700`, `text-slate-500`, `text-slate-400`, `border-slate-300`, `border-slate-600` |
| `src/features/platform/utils/companyAvatarUtils.js` | — | — | `bg-emerald-50`, `text-emerald-700`, `border-emerald-200`, `bg-emerald-950/50`, `text-emerald-300`, `border-emerald-800`, `bg-teal-50`, `text-teal-700`, `border-teal-200`, `bg-teal-950/50` (+49) |
| `src/features/reports/components/ReportExportButton.jsx` | — | — | `border-slate-200`, `text-slate-700`, `bg-slate-50`, `border-slate-700`, `bg-slate-900`, `text-slate-200`, `bg-slate-800` |
| `src/features/reports/components/ReportProductNameCell.jsx` | — | — | `text-slate-900`, `text-slate-500` |
| `src/features/reports/components/product-sales/ProductSalesReportTable.jsx` | — | — | `border-slate-200`, `bg-slate-50`, `text-slate-600`, `border-slate-700`, `bg-slate-800/80`, `text-slate-400`, `text-slate-500`, `text-red-600`, `border-slate-100`, `border-slate-800` (+2) |
| `src/features/reports/pages/CashierPerformanceReportPage.jsx` | — | — | `text-slate-900`, `text-slate-600`, `text-slate-400`, `border-slate-200`, `border-slate-800`, `bg-slate-900`, `bg-slate-50`, `bg-slate-800/80`, `border-slate-100` |
| `src/features/reports/pages/DailySummaryReportPage.jsx` | — | — | `text-slate-900`, `text-slate-600`, `text-slate-400`, `border-slate-200`, `border-slate-700`, `bg-slate-900`, `text-slate-500`, `border-slate-800` |
| `src/features/reports/pages/DrugRegistryPage.jsx` | — | — | `text-slate-900`, `text-slate-600`, `text-slate-400`, `text-slate-500` |
| `src/features/reports/pages/LowStockReportPage.jsx` | — | — | `text-slate-900`, `text-slate-600`, `text-slate-400`, `border-slate-200`, `bg-slate-50`, `border-slate-700`, `bg-slate-800/80`, `text-slate-500`, `text-red-600`, `border-slate-100` (+1) |
| `src/features/reports/pages/PriceRegistryJournalPage.jsx` | — | — | `text-slate-900`, `text-slate-600`, `text-slate-400`, `text-slate-500`, `bg-slate-50`, `bg-slate-800/80`, `border-slate-100`, `border-slate-800` |
| `src/features/reports/pages/ReportsHubPage.jsx` | — | — | `text-slate-900`, `text-slate-600`, `text-slate-400` |
| `src/features/reports/pages/StockBalancesReportPage.jsx` | — | — | `text-slate-900`, `text-slate-600`, `text-slate-400`, `bg-slate-50`, `bg-slate-800/80`, `border-slate-100`, `border-slate-800` |
| `src/features/reports/pages/StockInventoriesReportPage.jsx` | — | — | `text-slate-900`, `text-slate-600`, `text-slate-400`, `bg-slate-50`, `bg-slate-800/80`, `border-slate-100`, `border-slate-800` |
| `src/features/reports/pages/StockReceiptsReportPage.jsx` | — | — | `text-slate-900`, `text-slate-600`, `text-slate-400`, `bg-slate-50`, `bg-slate-800/80`, `border-slate-100`, `border-slate-800`, `text-emerald-800`, `text-emerald-400` |
| `src/features/reports/pages/StockTransfersReportPage.jsx` | — | — | `text-slate-900`, `text-slate-600`, `text-slate-400`, `bg-slate-50`, `bg-slate-800/80`, `border-slate-100`, `border-slate-800` |
| `src/features/reports/pages/StoreSalesReportPage.jsx` | — | — | `text-slate-900`, `text-slate-600`, `text-slate-400`, `bg-slate-50`, `bg-slate-800/80`, `border-slate-100`, `border-slate-800`, `text-emerald-700` |
| `src/features/sales/components/ReturnDetailModal.jsx` | — | — | `text-slate-500`, `text-slate-400`, `text-slate-900`, `text-slate-100`, `border-slate-200`, `border-slate-700`, `bg-slate-900`, `border-slate-800`, `text-slate-800`, `border-red-200` (+8) |
| `src/features/sales/components/ReturnReasonModal.jsx` | — | — | `border-slate-200`, `border-slate-700`, `bg-slate-900`, `border-slate-800`, `text-slate-900`, `text-slate-500`, `text-slate-800`, `text-slate-400`, `text-slate-600`, `border-slate-300` (+5) |
| `src/features/sales/components/ReturnsFiltersDrawer.jsx` | — | — | `border-slate-300`, `text-slate-900`, `ring-emerald-500`, `border-slate-700`, `bg-slate-800`, `border-slate-200`, `bg-slate-900`, `border-slate-800`, `text-slate-500`, `text-slate-800` (+2) |
| `src/features/sales/components/SaleFiscalPrintModal.jsx` | — | — | `border-slate-200`, `border-slate-700`, `bg-slate-900`, `border-slate-800`, `text-slate-900`, `border-emerald-600`, `bg-emerald-50`, `text-emerald-900`, `border-emerald-500`, `bg-emerald-950/60` (+13) |
| `src/features/sales/components/SalesLedgerFiltersDrawer.jsx` | — | — | `border-slate-300`, `text-slate-900`, `ring-emerald-500`, `border-slate-700`, `bg-slate-800`, `border-slate-200`, `bg-slate-900`, `border-slate-800`, `text-slate-500`, `text-slate-800` (+2) |
| `src/features/sales/components/returns/ReturnsTable.jsx` | — | — | `border-slate-200`, `bg-slate-50`, `text-slate-600`, `border-slate-800`, `bg-slate-800/50`, `text-slate-400`, `text-slate-500`, `border-sky-200`, `bg-sky-50`, `text-sky-900` (+12) |
| `src/features/sales/components/sales-ledger/CreditAdvanceCell.jsx` | — | — | `text-slate-400`, `text-amber-700`, `text-amber-400`, `text-slate-600`, `text-slate-300`, `text-slate-900` |
| `src/features/sales/components/sales-ledger/PaymentIcon.jsx` | — | — | `text-slate-600`, `text-slate-400` |
| `src/features/sales/components/sales-ledger/SalesLedgerRowMenu.jsx` | — | — | `border-slate-200`, `border-slate-700`, `bg-slate-900`, `text-slate-700`, `bg-slate-100`, `text-slate-200`, `bg-slate-700`, `text-red-600`, `bg-red-50`, `bg-red-950/30` |
| `src/features/sales/components/sales-ledger/SalesLedgerTable.jsx` | — | — | `border-slate-200`, `bg-slate-50`, `text-slate-600`, `border-slate-800`, `bg-slate-800/50`, `text-slate-400`, `border-slate-300`, `divide-slate-200`, `divide-slate-800`, `text-slate-500` (+8) |
| `src/features/sales/components/sales-ledger/ShiftCell.jsx` | — | — | `text-slate-400`, `text-slate-800`, `text-slate-200`, `text-slate-500`, `text-emerald-700`, `text-emerald-400` |
| `src/features/stock/utils/stockDocumentFormUtils.js` | — | — | `border-slate-300`, `border-slate-600`, `bg-slate-800` |
| `src/features/tenant/components/barcode-print/BarcodePrintCurrentItemSection.jsx` | — | — | `text-slate-800`, `text-slate-100`, `bg-emerald-100`, `text-emerald-800`, `bg-emerald-900/40`, `text-emerald-200`, `text-slate-500`, `text-slate-400`, `text-slate-900` |
| `src/features/tenant/components/barcode-print/BarcodePrintPageHeader.jsx` | — | — | `text-slate-900`, `text-slate-600`, `text-slate-400` |
| `src/features/tenant/components/barcode-print/BarcodePrintSearchSection.jsx` | — | — | `text-slate-500`, `text-slate-400`, `text-emerald-800`, `text-emerald-300`, `border-emerald-200`, `border-emerald-800`, `border-slate-100`, `border-slate-700`, `border-slate-200`, `border-slate-600` |
| `src/features/tenant/components/barcode-print/barcodePrintFormUi.js` | — | — | `border-slate-300`, `text-slate-900`, `ring-emerald-500`, `border-slate-600`, `bg-slate-800` |
| `src/features/tenant/components/stores/PharmacyIntegrationSettingsModal.jsx` | — | — | `border-slate-200`, `border-slate-700`, `bg-slate-900`, `border-slate-800`, `text-slate-900`, `text-slate-500`, `text-slate-800`, `text-slate-400` |
| `src/features/tenant/components/stores/PlatformStoreDeleteModal.jsx` | — | — | `text-amber-700`, `border-amber-300`, `bg-amber-50`, `border-amber-700`, `text-amber-300`, `text-emerald-700`, `border-emerald-300`, `bg-emerald-50`, `border-emerald-700`, `text-emerald-300` (+20) |
| `src/features/tenant/components/stores/PlatformStoreMobileCard.jsx` | — | — | `bg-slate-900`, `border-slate-200`, `border-slate-800`, `border-emerald-300`, `border-emerald-700`, `bg-emerald-50`, `text-emerald-700`, `bg-emerald-950/50`, `text-emerald-300`, `border-emerald-200/80` (+32) |
| `src/features/tenant/components/stores/PlatformStoreQuickDrawer.jsx` | — | — | `bg-slate-900/60`, `bg-slate-900`, `border-slate-200`, `border-slate-800`, `bg-slate-50/50`, `bg-emerald-50`, `text-emerald-700`, `bg-emerald-950/60`, `text-emerald-300`, `border-emerald-200/80` (+29) |
| `src/features/tenant/components/stores/PlatformStoreQuickDrawer.test.js` | `#101` | — | — |
| `src/features/tenant/components/stores/PlatformStoreQuickDrawerDetails.jsx` | — | — | `text-slate-400`, `text-slate-500`, `border-slate-200`, `border-slate-800`, `divide-slate-100`, `divide-slate-800`, `text-slate-900`, `text-slate-700`, `text-slate-300`, `bg-slate-50/40` (+2) |
| `src/features/tenant/components/stores/PlatformStoreStatsCards.jsx` | — | — | `text-emerald-600`, `text-emerald-400`, `bg-emerald-50`, `bg-emerald-950/60`, `border-emerald-100`, `border-emerald-900/60`, `ring-emerald-500/80`, `border-emerald-300`, `border-emerald-700`, `text-sky-600` (+24) |
| `src/features/tenant/components/stores/PlatformStoreStatsCards.test.js` | — | — | `ring-emerald-500/80`, `text-amber-600`, `bg-amber-50`, `text-slate-400`, `bg-slate-100` |
| `src/features/tenant/components/stores/PlatformStoreToggleActiveModal.jsx` | — | — | `bg-amber-50`, `bg-amber-950/40`, `border-amber-200`, `border-amber-800`, `text-amber-900`, `text-amber-200`, `bg-emerald-50`, `bg-emerald-950/40`, `border-emerald-200`, `border-emerald-800` (+13) |
| `src/features/tenant/components/stores/PlatformStoresGroupedView.jsx` | — | — | `bg-emerald-100`, `bg-emerald-950`, `bg-emerald-500`, `border-slate-200/90`, `border-slate-800`, `bg-slate-900` |
| `src/features/tenant/components/stores/PlatformStoresGroupedView.test.js` | — | — | `bg-emerald-500`, `ring-emerald-500` |
| `src/features/tenant/components/stores/StoreFormModalFields.jsx` | — | — | `border-slate-300`, `text-slate-900`, `ring-emerald-500`, `border-slate-700`, `bg-slate-800`, `text-slate-600`, `text-slate-400`, `text-red-400`, `text-slate-500`, `text-slate-700` (+1) |
| `src/features/tenant/components/stores/StoresPageControls.jsx` | — | — | `bg-slate-100`, `bg-slate-800/80`, `border-slate-200/80`, `border-slate-700/60`, `bg-slate-900`, `text-slate-900`, `text-slate-600`, `text-slate-400`, `bg-slate-200`, `bg-slate-700` (+14) |
| `src/features/tenant/components/stores/StoresTable.jsx` | — | — | `bg-emerald-100`, `bg-emerald-950`, `bg-emerald-500`, `border-slate-200`, `bg-slate-50`, `text-slate-500`, `border-slate-800`, `bg-slate-800/50`, `divide-slate-200`, `divide-slate-800` (+5) |
| `src/features/tenant/components/stores/StoresTable.test.js` | — | — | `bg-emerald-50`, `bg-emerald-500` |
| `src/features/tenant/components/stores/StoresTableRow.jsx` | — | — | `bg-slate-50`, `bg-slate-800/40`, `text-slate-900`, `bg-emerald-50`, `text-emerald-700`, `bg-emerald-950/50`, `text-emerald-300`, `border-emerald-200/80`, `border-emerald-800/60`, `text-emerald-400` (+15) |
| `src/features/tenant/components/stores/stores-grouped/StoresGroupedBranchRow.jsx` | — | — | `bg-slate-50/80`, `bg-slate-800/40`, `text-slate-900`, `bg-slate-100`, `text-slate-600`, `bg-slate-800`, `text-slate-300`, `bg-emerald-50`, `text-emerald-700`, `bg-emerald-950/60` (+10) |
| `src/features/tenant/components/stores/stores-grouped/StoresGroupedCompanyCard.jsx` | — | — | `border-emerald-500`, `ring-emerald-500/50`, `bg-slate-900`, `border-slate-300`, `border-slate-700/80`, `ring-slate-900/5`, `border-slate-200`, `border-slate-800/90`, `border-slate-700`, `bg-slate-50` (+34) |
| `src/features/tenant/components/stores/stores-grouped/StoresGroupedEmpty.jsx` | — | — | `border-slate-200`, `border-slate-800`, `bg-slate-900`, `bg-slate-100`, `bg-slate-800`, `text-slate-400`, `text-slate-500`, `text-slate-900` |
| `src/features/tenant/components/stores/stores-grouped/StoresGroupedLocationCell.jsx` | — | — | `text-slate-400`, `text-slate-600`, `text-slate-800`, `text-slate-200`, `text-slate-500` |
| `src/features/tenant/components/stores/stores-grouped/StoresGroupedSkeleton.jsx` | — | — | `bg-slate-900`, `border-slate-200/90`, `border-slate-800`, `bg-slate-200`, `bg-slate-700/60`, `bg-slate-100`, `bg-slate-800`, `border-slate-200` |
| `src/features/tenant/components/stores/stores-grouped/StoresGroupedToolbar.jsx` | — | — | `bg-slate-900`, `border-slate-200/90`, `border-slate-800`, `text-slate-900`, `bg-slate-100`, `bg-slate-800`, `text-slate-700`, `text-slate-300`, `border-slate-200/80`, `border-slate-700` (+7) |
| `src/features/tenant/components/users/LogoUploadField.jsx` | — | — | `text-slate-600`, `text-slate-400`, `border-slate-300`, `bg-slate-50`, `border-slate-600`, `bg-slate-800/50`, `text-slate-700`, `bg-slate-100`, `text-slate-200`, `bg-slate-800` (+1) |
| `src/features/tenant/components/users/PlatformUserQuickDrawer.jsx` | — | — | `bg-slate-900/60`, `bg-slate-900`, `border-slate-200`, `border-slate-800`, `bg-slate-50/50`, `bg-purple-50`, `text-purple-700`, `bg-purple-950/60`, `text-purple-300`, `border-purple-200/80` (+39) |
| `src/features/tenant/components/users/PlatformUserQuickDrawer.test.js` | `#7777` | — | — |
| `src/features/tenant/components/users/PlatformUserStatsCards.jsx` | — | — | `text-slate-700`, `text-slate-300`, `bg-slate-100`, `bg-slate-800`, `border-slate-200`, `border-slate-700`, `ring-slate-600`, `bg-slate-50`, `bg-slate-800/80`, `border-slate-400` (+41) |
| `src/features/tenant/components/users/PlatformUserStatsCards.test.js` | — | — | `ring-slate-600`, `ring-emerald-600`, `ring-purple-600`, `ring-sky-600` |
| `src/features/tenant/components/users/ReceiptLogoSizeControl.jsx` | — | — | `text-slate-600`, `text-slate-400`, `text-slate-800`, `text-slate-200`, `border-slate-300`, `border-slate-600`, `bg-slate-800`, `text-slate-500` |
| `src/features/tenant/components/users/ReceiptPrinterSettingsPanel.jsx` | — | — | `border-slate-200`, `text-slate-900`, `border-slate-600`, `bg-slate-900`, `text-slate-100`, `border-slate-800`, `text-emerald-600`, `text-emerald-400`, `text-slate-600`, `text-slate-400` (+6) |
| `src/features/tenant/components/users/SettingsFieldToggles.jsx` | — | — | `border-slate-200`, `bg-slate-50`, `border-slate-700`, `bg-slate-800/50`, `border-slate-400`, `text-emerald-600`, `ring-emerald-500`, `text-slate-700`, `text-slate-200` |
| `src/features/tenant/components/users/TenantSettingsSaveBar.jsx` | — | — | `border-slate-200`, `border-slate-800`, `bg-slate-900/95`, `border-slate-300`, `text-slate-700`, `bg-slate-50`, `border-slate-600`, `text-slate-200`, `bg-slate-800`, `text-slate-500` (+1) |
| `src/features/tenant/components/users/UserBrandingSettingsPanel.jsx` | — | — | `border-slate-200`, `text-slate-900`, `border-slate-600`, `bg-slate-900`, `text-slate-100`, `border-slate-800`, `text-emerald-600`, `text-emerald-400`, `text-slate-600`, `text-slate-400` (+9) |
| `src/features/tenant/components/users/UserCredentialsCreatedModal.jsx` | — | — | `border-slate-700`, `bg-slate-900`, `text-slate-900`, `text-slate-600`, `text-slate-400`, `text-slate-500` |
| `src/features/tenant/components/users/UserDeleteConfirmModal.jsx` | — | — | `border-slate-200`, `border-slate-700`, `bg-slate-900`, `border-slate-800`, `text-slate-900`, `text-slate-500`, `text-slate-800`, `text-slate-400`, `text-slate-700`, `text-slate-200` (+6) |
| `src/features/tenant/components/users/UserFormModal.jsx` | — | — | `text-slate-600`, `bg-slate-900`, `text-slate-300`, `bg-slate-950/65`, `border-slate-200`, `border-slate-800`, `bg-slate-900/95`, `text-slate-900`, `text-slate-500`, `text-slate-400` (+13) |
| `src/features/tenant/components/users/UserFormModalFields.jsx` | — | — | `border-red-500`, `ring-red-500`, `text-slate-900`, `border-slate-200`, `bg-slate-50/80`, `border-slate-800`, `bg-slate-800/40`, `text-slate-500`, `bg-slate-200`, `bg-slate-700` (+21) |
| `src/features/tenant/components/users/UsersTable.jsx` | — | — | `text-slate-400`, `text-slate-600`, `text-slate-200`, `text-purple-600`, `text-purple-400`, `bg-slate-900`, `bg-purple-100`, `bg-purple-950`, `bg-purple-600`, `border-slate-200` (+50) |
| `src/features/tenant/components/users/UsersTable.test.js` | `#9001` | — | `bg-purple-600` |
| `src/features/tenant/constants.js` | — | — | `bg-purple-500/10`, `text-purple-600`, `text-purple-400`, `bg-blue-500/10`, `text-blue-600`, `text-blue-400`, `bg-slate-200`, `text-slate-700`, `bg-slate-700`, `text-slate-300` (+21) |
| `src/features/tenant/pages/UsersPage.jsx` | — | — | `border-red-200`, `bg-red-50/80`, `text-red-800`, `border-red-900/60`, `bg-red-950/40`, `text-red-300`, `text-red-500`, `text-red-600`, `text-red-400`, `bg-red-100` (+57) |
| `src/features/tenant/utils/userFormModalUtils.js` | — | — | `border-slate-300`, `text-slate-900`, `ring-emerald-500`, `border-slate-700`, `bg-slate-800` |
| `src/pharmacy/app/PharmacyAdminSidebar.jsx` | — | — | `bg-slate-900/50`, `text-slate-600`, `bg-red-50`, `text-red-700`, `text-slate-300`, `bg-red-950/40`, `text-red-300` |
| `src/pharmacy/app/PharmacyAdminTopbar.jsx` | — | — | `text-slate-600`, `text-slate-400`, `bg-slate-800` |
| `src/pharmacy/app/PharmacyPageFallback.jsx` | — | — | `text-slate-500` |
| `src/router/guards/BillingAccessGuard.jsx` | — | — | `bg-slate-50`, `border-red-200`, `text-slate-900`, `text-slate-600` |
| `src/services/cashierEscpos/buildReceiptQrImage.js` | `#000000`, `#FFFFFF` | — | — |
| `src/store/themeStore.js` | `#f1f5f9`, `#0f172a`, `#121418`, `#f3efe6`, `#f2f7f4`, `#0f2419` | — | — |
| `src/utils/cashierDocumentPaint.js` | `#0c1018`, `#e9eef4`, `#f8fafc` | — | — |

## 4. Inline `style={{}}` Colors & Visual Rules

| File | Line | Style Snippet |
|---|---:|---|
| `src/features/auth/pages/AuthAcceptPage.jsx` | 72 | `maxWidth: '28rem', background: 'var(--pharm-card)', borderRadius: 12, padding: '1.5rem'` |
| `src/pharmacy/app/PharmacyAuthGuard.jsx` | 15 | `color: 'var(--pharm-muted)'` |

## 5. Long `className` & Repeated Utility Candidates for `@apply` (`ui-*`)

### 5.1 Repeated Combinations (3+ occurrences, >= 4 utilities) — Top Candidates

| Count | `className` |
|---:|---|
| 16 | `text-xl font-bold text-slate-900 dark:text-white` |
| 13 | `flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800` |
| 12 | `mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400` |
| 10 | `flex gap-2 border-t border-slate-200 p-4 dark:border-slate-800` |
| 10 | `border-r border-slate-200 px-2 py-2 dark:border-slate-700` |
| 9 | `flex flex-wrap items-start justify-between gap-3` |
| 9 | `flex-1 space-y-4 overflow-y-auto p-4` |
| 9 | `admin-btn-primary flex-1 py-2.5 text-sm` |
| 9 | `border-r border-slate-200 px-2 py-2 text-right dark:border-slate-700` |
| 9 | `text-xs font-medium text-slate-600 dark:text-slate-400` |
| 8 | `admin-btn-secondary flex-1 py-2.5 text-sm` |
| 8 | `admin-btn-primary px-4 py-2 text-sm` |
| 8 | `border-r border-slate-100 px-2 py-2 text-right tabular-nums text-slate-800 dark:border-slate-800 dark:text-slate-200` |
| 8 | `p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0` |
| 7 | `text-lg font-semibold text-slate-900 dark:text-white` |
| 7 | `fixed inset-0 z-50 flex justify-end` |
| 7 | `relative flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl animate-[slideIn_0.2s_ease-out] dark:border-slate-700 dark:bg-slate-900` |
| 7 | `p-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white` |
| 7 | `px-4 py-10 text-center text-slate-500` |
| 7 | `mb-1 block text-xs text-slate-600 dark:text-slate-400` |
| 7 | `mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300` |
| 6 | `px-4 py-8 text-center text-slate-500` |
| 6 | `mb-1 block text-xs text-slate-500` |
| 6 | `mt-1 text-xs text-slate-500 dark:text-slate-400` |
| 5 | `flex flex-wrap items-center gap-3` |
| 5 | `border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400` |
| 5 | `px-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-300` |
| 4 | `bg-transparent text-sm text-[color:var(--admin-text)] focus:outline-none` |
| 4 | `text-sm font-semibold text-slate-900 dark:text-white` |
| 4 | `px-4 py-3 font-medium text-slate-900 dark:text-white` |
| 4 | `flex flex-wrap items-center gap-2` |
| 4 | `px-3 py-10 text-center text-slate-500` |
| 4 | `px-3 py-2 text-slate-800 dark:text-slate-200` |
| 4 | `grid gap-1 sm:grid-cols-[140px_1fr] sm:items-center` |
| 4 | `bg-slate-50 text-left text-xs uppercase text-slate-600 dark:bg-slate-800/80` |
| 4 | `flex items-center gap-1.5 font-semibold` |
| 3 | `fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4` |
| 3 | `rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200` |
| 3 | `p-1 text-slate-500 hover:text-slate-800 dark:text-slate-400` |
| 3 | `flex flex-1 flex-col overflow-hidden` |
| 3 | `mb-2 text-xs font-medium text-slate-600 dark:text-slate-400` |
| 3 | `px-4 py-3 tabular-nums text-slate-800 dark:text-slate-200` |
| 3 | `flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800` |
| 3 | `rounded-lg border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200` |
| 3 | `px-4 py-3 text-slate-800 dark:text-slate-200` |
| 3 | `receipt-divider my-1.5 border-t border-dashed border-black` |
| 3 | `receipt-divider my-1.5 border-t border-dotted border-black` |
| 3 | `text-[11px] font-medium uppercase tracking-wide text-white/70` |
| 3 | `mt-0.5 text-sm font-semibold text-white sm:text-base` |
| 3 | `bg-slate-50 text-left text-xs uppercase dark:bg-slate-800/80` |
| 3 | `text-lg font-bold text-slate-900 dark:text-white` |
| 3 | `text-sm font-semibold text-slate-800 dark:text-slate-100` |
| 3 | `text-xs text-slate-500 dark:text-slate-400 mt-0.5` |
| 3 | `flex items-center gap-3.5 min-w-0` |
| 3 | `p-3.5 flex items-center justify-between gap-3` |
| 3 | `flex items-center gap-2 text-slate-500 dark:text-slate-400` |
| 3 | `inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 text-xs font-semibold self-start sm:self-auto shadow-2xs` |
| 3 | `h-4 w-32 rounded bg-slate-200 dark:bg-slate-700/60` |
| 3 | `h-4 w-24 rounded bg-slate-200 dark:bg-slate-700/60` |
| 3 | `mt-2 flex flex-wrap items-center gap-3` |
| 3 | `text-sm font-medium tabular-nums text-slate-800 dark:text-slate-200` |
| 3 | `text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500` |
| 3 | `grid grid-cols-1 sm:grid-cols-2 gap-4` |
| 3 | `text-xs font-medium text-slate-700 dark:text-slate-200` |
| 3 | `rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white` |

### 5.2 Long `className` (>= 8 utilities) — 275 Occurrences

| File | Line | Tokens | `className` |
|---|---:|---:|---|
| `src/components/sale-return/SalePartialReturnModal.jsx` | 188 | 8 | `fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4` |
| `src/components/shared/FormDraftNotice.jsx` | 24 | 10 | `inline-flex items-center gap-1 font-semibold text-amber-700 underline hover:text-amber-900 focus:outline-none dark:text-amber-300 dark:hover:text-amber-100` |
| `src/components/shared/GlobalOfflineBanner.jsx` | 28 | 18 | `fixed top-0 left-0 right-0 z-[99999] bg-amber-400 text-amber-950 px-3 py-1 text-center text-xs font-semibold shadow-xs animate-pulse flex items-center justify-center gap-1.5` |
| `src/components/shared/GlobalOfflineBanner.jsx` | 70 | 16 | `fixed top-2.5 sm:top-3 left-1/2 -translate-x-1/2 z-[99999] w-[95vw] max-w-xl transition-all duration-300 ease-out animate-in fade-in slide-in-from-top-4 focus:outline-none pointer-events-auto` |
| `src/components/shared/GlobalOfflineBanner.jsx` | 89 | 22 | `inline-flex items-center justify-center gap-1.5 px-3 py-2 min-h-[44px] min-w-[44px] rounded-xl bg-white/20 hover:bg-white/30 active:scale-95 text-xs font-semibold text-white transition-all touch-manipulation focus:outline-hidden focus:ring-2 focus:ring-white/50 cursor-pointer disabled:opacity-60` |
| `src/components/shared/GlobalOfflineBanner.jsx` | 101 | 18 | `p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white/80 hover:text-white transition-all touch-manipulation focus:outline-hidden focus:ring-2 focus:ring-white/50 cursor-pointer` |
| `src/components/shared/TableRowActionsMenu.jsx` | 64 | 12 | `rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl dark:!border-slate-700 dark:!bg-slate-900 animate-in fade-in zoom-in-95 duration-100` |
| `src/components/shared/TableRowActionsMenu.jsx` | 110 | 8 | `rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-white transition-colors` |
| `src/components/tasnif/TasnifPackagePickerModal.jsx` | 19 | 8 | `fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4` |
| `src/components/tasnif/TasnifPackagePickerModal.jsx` | 21 | 9 | `w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900` |
| `src/components/tasnif/TasnifPackagePickerModal.jsx` | 25 | 8 | `flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800` |
| `src/components/ui/BaseModal.jsx` | 86 | 10 | `flex shrink-0 items-center justify-between border-b border-slate-200 px-4 sm:px-6 py-3.5 dark:border-slate-800` |
| `src/components/ui/BaseModal.jsx` | 100 | 10 | `ml-auto p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:!bg-slate-800 transition` |
| `src/components/ui/ErrorBanner.jsx` | 4 | 11 | `rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200` |
| `src/components/ui/PlatformErrorState.jsx` | 98 | 12 | `inline-block text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 select-all` |
| `src/features/ai/components/AiAssistantChartPanel.jsx` | 9 | 9 | `rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none` |
| `src/features/ai/components/AiAssistantWidget.jsx` | 93 | 9 | `rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none` |
| `src/features/ai/components/AiAssistantWidget.jsx` | 105 | 14 | `inline-flex h-8 items-center gap-1 rounded-md border border-slate-300 px-2 text-xs text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800` |
| `src/features/ai/components/AiAssistantWidget.jsx` | 114 | 8 | `rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300` |
| `src/features/ai/components/AiAssistantWidget.jsx` | 133 | 12 | `mr-6 flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400` |
| `src/features/ai/components/AiAssistantWidget.jsx` | 145 | 15 | `h-10 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none ring-0 focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white` |
| `src/features/ai/components/AiAssistantWidget.jsx` | 151 | 9 | `inline-flex h-10 items-center justify-center rounded-lg bg-emerald-600 px-3 text-white disabled:opacity-50` |
| `src/features/cash-registers/components/CashRegisterConfigAddModal.jsx` | 142 | 14 | `relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900` |
| `src/features/cash-registers/components/CashRegisterConfigAddModal.jsx` | 143 | 8 | `flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800` |
| `src/features/cash-registers/components/CashRegisterConfigAddModal.jsx` | 153 | 11 | `rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200` |
| `src/features/cash-registers/components/CashRegisterConfigAddModal.jsx` | 236 | 13 | `rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800` |
| `src/features/cash-registers/components/CashRegisterConfigFiltersDrawer.jsx` | 28 | 12 | `relative flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl animate-[slideIn_0.2s_ease-out] dark:border-slate-700 dark:bg-slate-900` |
| `src/features/cash-registers/components/CashRegisterConfigFiltersDrawer.jsx` | 30 | 8 | `flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800` |
| `src/features/cash-registers/components/CashRegisterConfigTable.jsx` | 25 | 12 | `border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400` |
| `src/features/cash-registers/components/CashRegisterDetailsModal.jsx` | 48 | 13 | `cr-details-modal relative flex max-h-[90vh] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900` |
| `src/features/cash-registers/components/CashRegisterDetailsModal.jsx` | 52 | 8 | `flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800` |
| `src/features/cash-registers/components/CashRegisterDetailsModal.jsx` | 131 | 14 | `rounded-lg border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200` |
| `src/features/cash-registers/components/CashRegisterDetailsModal.jsx` | 140 | 14 | `rounded-lg border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200` |
| `src/features/cash-registers/components/CashRegisterDetailsModal.jsx` | 157 | 14 | `rounded-lg border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200` |
| `src/features/cash-registers/components/CashRegisterErrorBanner.jsx` | 3 | 11 | `rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200` |
| `src/features/cash-registers/components/CashRegisterFormModal.jsx` | 17 | 15 | `cr-form-modal relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900` |
| `src/features/cash-registers/components/CashRegisterFormModal.jsx` | 21 | 8 | `flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800` |
| `src/features/cash-registers/components/CashRegistersFiltersDrawer.jsx` | 18 | 12 | `relative flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl animate-[slideIn_0.2s_ease-out] dark:border-slate-700 dark:bg-slate-900` |
| `src/features/cash-registers/components/CashRegistersFiltersDrawer.jsx` | 20 | 8 | `flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800` |
| `src/features/cash-registers/components/CashRegistersListFooter.jsx` | 17 | 14 | `flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400 lg:flex-row lg:items-center lg:justify-between` |
| `src/features/cash-registers/components/CashRegistersListFooter.jsx` | 36 | 8 | `rounded border border-slate-300 px-2 py-1 text-xs disabled:opacity-40 dark:border-slate-600` |
| `src/features/cash-registers/components/CashRegistersListFooter.jsx` | 59 | 8 | `rounded border border-slate-300 px-2 py-1 text-xs disabled:opacity-40 dark:border-slate-600` |
| `src/features/cash-registers/components/CashRegistersTable.jsx` | 18 | 12 | `border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400` |
| `src/features/cash-registers/components/CashRegistersTable.jsx` | 76 | 19 | `inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700` |
| `src/features/cash-registers/components/CashTransferFiltersDrawer.jsx` | 18 | 12 | `relative flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl animate-[slideIn_0.2s_ease-out] dark:border-slate-700 dark:bg-slate-900` |
| `src/features/cash-registers/components/CashTransferFiltersDrawer.jsx` | 20 | 8 | `flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800` |
| `src/features/cash-registers/components/CashTransferTable.jsx` | 24 | 12 | `border-b border-slate-200 bg-slate-50 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400` |
| `src/features/cash-registers/components/CashTransferTable.jsx` | 48 | 12 | `border-b border-slate-200 bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400` |
| `src/features/cash-registers/components/CashTransferTable.jsx` | 82 | 9 | `max-w-[180px] truncate border-r border-slate-100 px-2 py-2 text-slate-900 dark:border-slate-800 dark:text-slate-100` |
| `src/features/cash-registers/components/CashTransferTable.jsx` | 88 | 8 | `whitespace-nowrap border-r border-slate-100 px-2 py-2 text-slate-700 dark:border-slate-800 dark:text-slate-300` |
| `src/features/cash-registers/components/CashTransferTable.jsx` | 91 | 8 | `whitespace-nowrap border-r border-slate-100 px-2 py-2 text-slate-700 dark:border-slate-800 dark:text-slate-300` |
| `src/features/cash-registers/components/CashTransferTable.jsx` | 97 | 9 | `border-r border-slate-100 px-2 py-2 text-right tabular-nums text-slate-800 dark:border-slate-800 dark:text-slate-200` |
| `src/features/cash-registers/components/CashTransferTable.jsx` | 100 | 10 | `border-r border-slate-100 px-2 py-2 text-right tabular-nums font-medium text-slate-900 dark:border-slate-800 dark:text-white` |
| `src/features/cash-registers/components/CashTransferTable.jsx` | 103 | 9 | `border-r border-slate-100 px-2 py-2 text-right tabular-nums text-slate-800 dark:border-slate-800 dark:text-slate-200` |
| `src/features/cash-registers/components/CashTransferTable.jsx` | 106 | 9 | `border-r border-slate-100 px-2 py-2 text-right tabular-nums text-slate-800 dark:border-slate-800 dark:text-slate-200` |
| `src/features/cash-registers/components/CashTransferTable.jsx` | 109 | 9 | `border-r border-slate-100 px-2 py-2 text-right tabular-nums text-slate-800 dark:border-slate-800 dark:text-slate-200` |
| `src/features/cash-registers/components/CashTransferTable.jsx` | 112 | 9 | `border-r border-slate-100 px-2 py-2 text-right tabular-nums text-slate-800 dark:border-slate-800 dark:text-slate-200` |
| `src/features/cash-registers/components/CashTransferTable.jsx` | 115 | 9 | `border-r border-slate-100 px-2 py-2 text-right tabular-nums text-slate-800 dark:border-slate-800 dark:text-slate-200` |
| `src/features/cash-registers/components/CashTransferTable.jsx` | 118 | 9 | `border-r border-slate-100 px-2 py-2 text-right tabular-nums text-slate-800 dark:border-slate-800 dark:text-slate-200` |
| `src/features/cash-registers/components/CashTransferTable.jsx` | 121 | 9 | `border-r border-slate-100 px-2 py-2 text-right tabular-nums text-slate-800 dark:border-slate-800 dark:text-slate-200` |
| `src/features/cash-registers/components/MultikassaSettingsModal.jsx` | 16 | 14 | `relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-[#e4e7ec] bg-white font-[Inter,Segoe_UI,system-ui,sans-serif] text-[#1f2024] shadow-2xl` |
| `src/features/cash-registers/components/z-reports/ZReportFiltersDrawer.jsx` | 19 | 12 | `relative flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl animate-[slideIn_0.2s_ease-out] dark:border-slate-700 dark:bg-slate-900` |
| `src/features/cash-registers/components/z-reports/ZReportFiltersDrawer.jsx` | 21 | 8 | `flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800` |
| `src/features/cash-registers/components/z-reports/ZReportsRowMenu.jsx` | 22 | 13 | `fixed z-[210] min-w-[280px] max-w-[90vw] rounded-lg border border-slate-200 bg-white py-2 text-left shadow-xl dark:!border-slate-700 dark:!bg-slate-900` |
| `src/features/cash-registers/components/z-reports/ZReportsRowMenu.jsx` | 31 | 8 | `admin-link flex-1 rounded px-2 py-2 text-left text-xs hover:bg-[color:var(--admin-brand-soft)]` |
| `src/features/cash-registers/components/z-reports/ZReportsRowMenu.jsx` | 38 | 8 | `admin-link flex-1 rounded px-2 py-2 text-left text-xs hover:bg-[color:var(--admin-brand-soft)]` |
| `src/features/cash-registers/components/z-reports/ZReportsTable.jsx` | 32 | 12 | `border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400` |
| `src/features/cash-registers/pages/CashRegisterConfigPage.jsx` | 25 | 19 | `inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800` |
| `src/features/cash-registers/pages/CashRegisterTransferPage.jsx` | 25 | 21 | `inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700` |
| `src/features/cash-registers/pages/ZReportsPage.jsx` | 27 | 17 | `flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700` |
| `src/features/catalog/components/suppliers/SupplierFiltersDrawer.jsx` | 18 | 12 | `relative flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl animate-[slideIn_0.2s_ease-out] dark:border-slate-700 dark:bg-slate-900` |
| `src/features/catalog/components/suppliers/SupplierFiltersDrawer.jsx` | 20 | 8 | `flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800` |
| `src/features/catalog/components/suppliers/SupplierModal.jsx` | 27 | 12 | `relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900` |
| `src/features/catalog/components/suppliers/SupplierModal.jsx` | 28 | 8 | `flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800` |
| `src/features/catalog/components/suppliers/SupplierModal.jsx` | 89 | 11 | `rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800` |
| `src/features/catalog/components/suppliers/SuppliersTable.jsx` | 33 | 12 | `border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300` |
| `src/features/catalog/components/suppliers/SuppliersTable.jsx` | 79 | 13 | `flex items-start gap-3 border-t border-sky-100 bg-sky-50 px-4 py-4 text-sm text-sky-900 dark:border-sky-900/40 dark:bg-sky-950/40 dark:text-sky-100` |
| `src/features/dashboard/pages/DashboardPage.jsx` | 30 | 11 | `rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200` |
| `src/features/pharmacy-stock/components/PharmacyReceiptPaymentFields.jsx` | 54 | 10 | `flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 px-2.5 py-2 dark:border-slate-700` |
| `src/features/pharmacy-stock/components/PharmacyReceiptPaymentFields.jsx` | 93 | 8 | `rounded-lg border border-dashed border-slate-300 px-2.5 py-2 text-sm dark:border-slate-600` |
| `src/features/reports/components/ReportExportButton.jsx` | 29 | 19 | `inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800` |
| `src/features/reports/components/product-sales/ProductSalesReportTable.jsx` | 31 | 10 | `border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-600 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400` |
| `src/features/reports/pages/DailySummaryReportPage.jsx` | 33 | 9 | `rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900` |
| `src/features/reports/pages/LowStockReportPage.jsx` | 46 | 9 | `border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-600 dark:border-slate-700 dark:bg-slate-800/80` |
| `src/features/sales/components/ReturnDetailModal.jsx` | 47 | 8 | `fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4` |
| `src/features/sales/components/ReturnDetailModal.jsx` | 48 | 10 | `w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900` |
| `src/features/sales/components/ReturnDetailModal.jsx` | 49 | 8 | `flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800` |
| `src/features/sales/components/ReturnDetailModal.jsx` | 58 | 11 | `rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200` |
| `src/features/sales/components/ReturnReasonModal.jsx` | 23 | 8 | `fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4` |
| `src/features/sales/components/ReturnReasonModal.jsx` | 26 | 9 | `w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900` |
| `src/features/sales/components/ReturnReasonModal.jsx` | 28 | 8 | `flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800` |
| `src/features/sales/components/ReturnReasonModal.jsx` | 44 | 15 | `w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white` |
| `src/features/sales/components/ReturnReasonModal.jsx` | 52 | 9 | `rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 dark:border-slate-600 dark:text-slate-300` |
| `src/features/sales/components/ReturnsFiltersDrawer.jsx` | 19 | 12 | `relative flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl animate-[slideIn_0.2s_ease-out] dark:border-slate-700 dark:bg-slate-900` |
| `src/features/sales/components/ReturnsFiltersDrawer.jsx` | 21 | 8 | `flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800` |
| `src/features/sales/components/ReturnsFiltersDrawer.jsx` | 51 | 8 | `grid grid-cols-2 gap-2 rounded-lg border border-slate-200 p-3 dark:border-slate-700` |
| `src/features/sales/components/SaleFiscalPrintModal.jsx` | 44 | 8 | `fiscal-print-scene fixed inset-0 z-[100] flex items-center justify-center p-4` |
| `src/features/sales/components/SaleFiscalPrintModal.jsx` | 54 | 16 | `fiscal-print-dialog relative z-[1] flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900` |
| `src/features/sales/components/SaleFiscalPrintModal.jsx` | 59 | 9 | `flex items-center justify-between border-b border-slate-200 px-4 py-3 print:hidden dark:border-slate-800` |
| `src/features/sales/components/SaleFiscalPrintModal.jsx` | 118 | 9 | `flex justify-end gap-2 border-t border-slate-200 px-4 py-3 print:hidden dark:border-slate-800` |
| `src/features/sales/components/SaleFiscalPrintModal.jsx` | 123 | 13 | `rounded-lg border border-slate-400 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-500 dark:text-slate-200 dark:hover:bg-slate-800` |
| `src/features/sales/components/SaleFiscalPrintModal.jsx` | 130 | 12 | `rounded-lg border border-slate-400 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 dark:border-slate-500 dark:text-slate-200 dark:hover:bg-slate-800` |
| `src/features/sales/components/SalesLedgerFiltersDrawer.jsx` | 27 | 12 | `relative flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl animate-[slideIn_0.2s_ease-out] dark:border-slate-700 dark:bg-slate-900` |
| `src/features/sales/components/SalesLedgerFiltersDrawer.jsx` | 29 | 8 | `flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800` |
| `src/features/sales/components/SalesLedgerFiltersDrawer.jsx` | 92 | 8 | `grid grid-cols-2 gap-2 rounded-lg border border-slate-200 p-3 dark:border-slate-700` |
| `src/features/sales/components/returns/ReturnsTable.jsx` | 34 | 12 | `border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400` |
| `src/features/sales/components/returns/ReturnsTable.jsx` | 55 | 14 | `m-4 flex items-start gap-3 rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900 dark:border-sky-900/40 dark:bg-sky-950/30 dark:text-sky-200` |
| `src/features/sales/components/sales-ledger/SalesLedgerRowMenu.jsx` | 17 | 12 | `fixed z-[210] min-w-[180px] rounded-lg border border-slate-200 bg-white py-1 text-left shadow-xl dark:!border-slate-700 dark:!bg-slate-900` |
| `src/features/sales/components/sales-ledger/SalesLedgerRowMenu.jsx` | 25 | 10 | `block w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700` |
| `src/features/sales/components/sales-ledger/SalesLedgerRowMenu.jsx` | 35 | 8 | `block px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700` |
| `src/features/sales/components/sales-ledger/SalesLedgerRowMenu.jsx` | 43 | 9 | `block w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30` |
| `src/features/sales/components/sales-ledger/SalesLedgerTable.jsx` | 36 | 12 | `border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400` |
| `src/features/tenant/components/barcode-print/BarcodePrintCurrentItemSection.jsx` | 18 | 9 | `rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200` |
| `src/features/tenant/components/barcode-print/BarcodePrintSearchSection.jsx` | 55 | 8 | `tasnif-search__item flex w-full flex-col border-b border-slate-100 text-left dark:border-slate-700` |
| `src/features/tenant/components/barcode-print/BarcodePrintSearchSection.jsx` | 78 | 8 | `tasnif-search__item flex w-full flex-col border-b border-slate-100 text-left dark:border-slate-700` |
| `src/features/tenant/components/stores/PharmacyIntegrationSettingsModal.jsx` | 21 | 15 | `pharm-int-settings relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900` |
| `src/features/tenant/components/stores/PharmacyIntegrationSettingsModal.jsx` | 25 | 8 | `flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800` |
| `src/features/tenant/components/stores/PlatformStoreDeleteModal.jsx` | 83 | 12 | `flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200` |
| `src/features/tenant/components/stores/PlatformStoreDeleteModal.jsx` | 112 | 11 | `p-3 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/30 text-xs text-rose-800 dark:text-rose-300 space-y-1` |
| `src/features/tenant/components/stores/PlatformStoreMobileCard.jsx` | 39 | 13 | `p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-700 transition` |
| `src/features/tenant/components/stores/PlatformStoreMobileCard.jsx` | 45 | 18 | `w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-center font-bold text-sm shrink-0 font-mono shadow-2xs` |
| `src/features/tenant/components/stores/PlatformStoreMobileCard.jsx` | 75 | 9 | `flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80 text-xs` |
| `src/features/tenant/components/stores/PlatformStoreMobileCard.jsx` | 96 | 11 | `px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900 transition` |
| `src/features/tenant/components/stores/PlatformStoreMobileCard.jsx` | 136 | 16 | `flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold gap-1 transition` |
| `src/features/tenant/components/stores/PlatformStoreMobileCard.jsx` | 145 | 16 | `flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold gap-1 transition` |
| `src/features/tenant/components/stores/PlatformStoreMobileCard.jsx` | 167 | 16 | `flex flex-col items-center justify-center p-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-[11px] font-semibold gap-1 transition` |
| `src/features/tenant/components/stores/PlatformStoreQuickDrawer.jsx` | 62 | 13 | `w-screen max-w-md bg-white dark:!bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col animate-in slide-in-from-right duration-200` |
| `src/features/tenant/components/stores/PlatformStoreQuickDrawer.jsx` | 64 | 11 | `px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/50 dark:bg-slate-850` |
| `src/features/tenant/components/stores/PlatformStoreQuickDrawer.jsx` | 66 | 18 | `w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-center shrink-0 text-base font-bold font-mono shadow-xs` |
| `src/features/tenant/components/stores/PlatformStoreQuickDrawer.jsx` | 95 | 8 | `p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors` |
| `src/features/tenant/components/stores/PlatformStoreQuickDrawer.jsx` | 109 | 10 | `p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 flex items-center justify-between gap-3` |
| `src/features/tenant/components/stores/PlatformStoreQuickDrawer.jsx` | 116 | 18 | `inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors` |
| `src/features/tenant/components/stores/PlatformStoreQuickDrawer.jsx` | 130 | 14 | `px-3 py-2 rounded-xl text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800 transition-colors` |
| `src/features/tenant/components/stores/PlatformStoreQuickDrawer.jsx` | 142 | 13 | `inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors` |
| `src/features/tenant/components/stores/PlatformStoreQuickDrawerDetails.jsx` | 18 | 8 | `rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 text-sm` |
| `src/features/tenant/components/stores/PlatformStoreQuickDrawerDetails.jsx` | 60 | 9 | `p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 bg-slate-50/40 dark:bg-slate-800/40 text-sm` |
| `src/features/tenant/components/stores/PlatformStoresGroupedView.jsx` | 56 | 10 | `absolute -top-1 left-0 right-0 z-30 h-0.5 bg-emerald-100 dark:bg-emerald-950 overflow-hidden rounded-full` |
| `src/features/tenant/components/stores/PlatformStoresGroupedView.jsx` | 102 | 8 | `rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden dark:border-slate-800 dark:bg-slate-900` |
| `src/features/tenant/components/stores/StoresPageControls.jsx` | 17 | 14 | `inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 text-xs font-semibold self-start sm:self-auto shadow-2xs` |
| `src/features/tenant/components/stores/StoresPageControls.jsx` | 28 | 10 | `ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono` |
| `src/features/tenant/components/stores/StoresPageControls.jsx` | 42 | 10 | `ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono` |
| `src/features/tenant/components/stores/StoresPageControls.jsx` | 73 | 14 | `inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 text-xs font-semibold self-start sm:self-auto shadow-2xs` |
| `src/features/tenant/components/stores/StoresTable.jsx` | 40 | 9 | `absolute top-0 left-0 right-0 z-30 h-0.5 bg-emerald-100 dark:bg-emerald-950 overflow-hidden` |
| `src/features/tenant/components/stores/StoresTable.jsx` | 54 | 10 | `border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/50` |
| `src/features/tenant/components/stores/StoresTable.jsx` | 148 | 9 | `p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse space-y-3` |
| `src/features/tenant/components/stores/StoresTableRow.jsx` | 51 | 17 | `w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-center shrink-0 text-xs font-bold font-mono` |
| `src/features/tenant/components/stores/StoresTableRow.jsx` | 54 | 8 | `font-semibold text-slate-900 dark:text-white truncate max-w-xs group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors` |
| `src/features/tenant/components/stores/stores-grouped/StoresGroupedBranchRow.jsx` | 36 | 16 | `w-6 h-6 rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 flex items-center justify-center shrink-0 group-hover:bg-emerald-50 group-hover:text-emerald-700 dark:group-hover:bg-emerald-950/60 dark:group-hover:text-emerald-300 transition-colors` |
| `src/features/tenant/components/stores/stores-grouped/StoresGroupedCompanyCard.jsx` | 68 | 15 | `hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-white text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700` |
| `src/features/tenant/components/stores/stores-grouped/StoresGroupedCompanyCard.jsx` | 82 | 12 | `flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 dark:border-slate-800` |
| `src/features/tenant/components/stores/stores-grouped/StoresGroupedCompanyCard.jsx` | 84 | 13 | `px-2.5 py-1 rounded-full text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs` |
| `src/features/tenant/components/stores/stores-grouped/StoresGroupedCompanyCard.jsx` | 87 | 12 | `px-2 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60` |
| `src/features/tenant/components/stores/stores-grouped/StoresGroupedCompanyCard.jsx` | 91 | 12 | `px-2 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60` |
| `src/features/tenant/components/stores/stores-grouped/StoresGroupedCompanyCard.jsx` | 103 | 18 | `inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/70 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors` |
| `src/features/tenant/components/stores/stores-grouped/StoresGroupedCompanyCard.jsx` | 129 | 9 | `mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline` |
| `src/features/tenant/components/stores/stores-grouped/StoresGroupedCompanyCard.jsx` | 140 | 10 | `border-b border-slate-100 dark:border-slate-800/90 text-left text-[11px] uppercase tracking-wider text-slate-400 bg-slate-50/50 dark:bg-slate-850/40` |
| `src/features/tenant/components/stores/stores-grouped/StoresGroupedEmpty.jsx` | 6 | 10 | `py-16 px-4 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs` |
| `src/features/tenant/components/stores/stores-grouped/StoresGroupedEmpty.jsx` | 7 | 12 | `w-14 h-14 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3` |
| `src/features/tenant/components/stores/stores-grouped/StoresGroupedLocationCell.jsx` | 23 | 8 | `text-slate-500 dark:text-slate-400 text-[11px] truncate flex items-center gap-1 mt-0.5` |
| `src/features/tenant/components/stores/stores-grouped/StoresGroupedSkeleton.jsx` | 6 | 12 | `flex items-center justify-between px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 animate-pulse` |
| `src/features/tenant/components/stores/stores-grouped/StoresGroupedSkeleton.jsx` | 13 | 8 | `p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse` |
| `src/features/tenant/components/stores/stores-grouped/StoresGroupedToolbar.jsx` | 15 | 15 | `flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs` |
| `src/features/tenant/components/stores/stores-grouped/StoresGroupedToolbar.jsx` | 21 | 13 | `px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-semibold text-xs border border-slate-200/80 dark:border-slate-700` |
| `src/features/tenant/components/stores/stores-grouped/StoresGroupedToolbar.jsx` | 29 | 23 | `inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-2xs transition-all active:scale-[0.98] self-start sm:self-auto` |
| `src/features/tenant/components/users/LogoUploadField.jsx` | 31 | 12 | `flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-800/50` |
| `src/features/tenant/components/users/LogoUploadField.jsx` | 52 | 14 | `inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800` |
| `src/features/tenant/components/users/PlatformUserQuickDrawer.jsx` | 155 | 14 | `w-screen max-w-md bg-white dark:!bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col animate-in slide-in-from-right duration-200 outline-none` |
| `src/features/tenant/components/users/PlatformUserQuickDrawer.jsx` | 158 | 11 | `px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/50 dark:bg-slate-850` |
| `src/features/tenant/components/users/PlatformUserQuickDrawer.jsx` | 160 | 18 | `w-12 h-12 rounded-xl bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/60 flex items-center justify-center shrink-0 text-base font-bold font-mono shadow-xs` |
| `src/features/tenant/components/users/PlatformUserQuickDrawer.jsx` | 164 | 8 | `text-base sm:text-lg font-bold text-slate-900 dark:text-white break-words line-clamp-2 leading-snug` |
| `src/features/tenant/components/users/PlatformUserQuickDrawer.jsx` | 195 | 8 | `rounded-xl p-1.5 text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors` |
| `src/features/tenant/components/users/PlatformUserQuickDrawer.jsx` | 206 | 11 | `p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-3` |
| `src/features/tenant/components/users/PlatformUserQuickDrawer.jsx` | 216 | 14 | `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/60 transition-colors shrink-0` |
| `src/features/tenant/components/users/PlatformUserQuickDrawer.jsx` | 358 | 9 | `p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 flex flex-col gap-2.5` |
| `src/features/tenant/components/users/PlatformUserQuickDrawer.jsx` | 366 | 17 | `flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-medium text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors` |
| `src/features/tenant/components/users/PlatformUserQuickDrawer.jsx` | 394 | 18 | `flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-medium text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer` |
| `src/features/tenant/components/users/PlatformUserQuickDrawer.jsx` | 403 | 14 | `flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors` |
| `src/features/tenant/components/users/PlatformUserQuickDrawer.jsx` | 416 | 14 | `flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 transition-colors` |
| `src/features/tenant/components/users/ReceiptLogoSizeControl.jsx` | 30 | 13 | `flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-white px-2 dark:border-slate-600 dark:bg-slate-800` |
| `src/features/tenant/components/users/ReceiptPrinterSettingsPanel.jsx` | 46 | 8 | `flex items-center gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-800` |
| `src/features/tenant/components/users/ReceiptPrinterSettingsPanel.jsx` | 81 | 13 | `flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-white px-2 dark:border-slate-600 dark:bg-slate-800` |
| `src/features/tenant/components/users/SettingsFieldToggles.jsx` | 7 | 13 | `flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800/50` |
| `src/features/tenant/components/users/TenantSettingsSaveBar.jsx` | 24 | 13 | `sticky bottom-0 z-10 -mx-4 mt-6 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95` |
| `src/features/tenant/components/users/TenantSettingsSaveBar.jsx` | 31 | 13 | `rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800` |
| `src/features/tenant/components/users/UserBrandingSettingsPanel.jsx` | 47 | 8 | `flex items-center gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-800` |
| `src/features/tenant/components/users/UserBrandingSettingsPanel.jsx` | 81 | 13 | `flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-800/50` |
| `src/features/tenant/components/users/UserBrandingSettingsPanel.jsx` | 91 | 11 | `flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/40` |
| `src/features/tenant/components/users/UserCredentialsCreatedModal.jsx` | 32 | 8 | `fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4` |
| `src/features/tenant/components/users/UserCredentialsCreatedModal.jsx` | 33 | 8 | `w-full max-w-md rounded-2xl border bg-white p-5 dark:border-slate-700 dark:bg-slate-900` |
| `src/features/tenant/components/users/UserCredentialsCreatedModal.jsx` | 62 | 8 | `inline-flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5` |
| `src/features/tenant/components/users/UserDeleteConfirmModal.jsx` | 8 | 8 | `fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4` |
| `src/features/tenant/components/users/UserDeleteConfirmModal.jsx` | 9 | 9 | `w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900` |
| `src/features/tenant/components/users/UserDeleteConfirmModal.jsx` | 10 | 8 | `flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800` |
| `src/features/tenant/components/users/UserDeleteConfirmModal.jsx` | 28 | 11 | `rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800` |
| `src/features/tenant/components/users/UserDeleteConfirmModal.jsx` | 36 | 9 | `rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50` |
| `src/features/tenant/components/users/UserFormModal.jsx` | 163 | 9 | `fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4` |
| `src/features/tenant/components/users/UserFormModal.jsx` | 164 | 9 | `rounded-2xl bg-white p-6 text-sm font-medium text-slate-600 shadow-xl dark:bg-slate-900 dark:text-slate-300` |
| `src/features/tenant/components/users/UserFormModal.jsx` | 180 | 10 | `fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto` |
| `src/features/tenant/components/users/UserFormModal.jsx` | 197 | 18 | `relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden animate-in fade-in zoom-in-95 duration-150` |
| `src/features/tenant/components/users/UserFormModal.jsx` | 200 | 14 | `sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur-xs dark:border-slate-800 dark:bg-slate-900/95` |
| `src/features/tenant/components/users/UserFormModal.jsx` | 214 | 8 | `rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors` |
| `src/features/tenant/components/users/UserFormModal.jsx` | 228 | 12 | `fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150` |
| `src/features/tenant/components/users/UserFormModal.jsx` | 236 | 14 | `w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95 duration-150` |
| `src/features/tenant/components/users/UserFormModal.jsx` | 256 | 13 | `px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer` |
| `src/features/tenant/components/users/UserFormModal.jsx` | 263 | 11 | `px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 shadow-xs transition-colors cursor-pointer` |
| `src/features/tenant/components/users/UserFormModalFields.jsx` | 108 | 8 | `rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3.5 dark:border-slate-800 dark:bg-slate-800/40` |
| `src/features/tenant/components/users/UserFormModalFields.jsx` | 116 | 10 | `font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs` |
| `src/features/tenant/components/users/UserFormModalFields.jsx` | 268 | 10 | `max-h-36 space-y-2 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-900/40` |
| `src/features/tenant/components/users/UserFormModalFields.jsx` | 446 | 9 | `absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200` |
| `src/features/tenant/components/users/UserFormModalFields.jsx` | 479 | 8 | `inline-flex items-center gap-1 text-[11px] font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400` |
| `src/features/tenant/components/users/UserFormModalFields.jsx` | 500 | 9 | `absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200` |
| `src/features/tenant/components/users/UserFormModalFields.jsx` | 525 | 15 | `sticky bottom-0 z-10 flex items-center justify-end gap-3 border-t border-slate-200 bg-white/95 px-6 py-4 backdrop-blur-xs dark:border-slate-800 dark:bg-slate-900/95` |
| `src/features/tenant/components/users/UserFormModalFields.jsx` | 529 | 13 | `rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors` |
| `src/features/tenant/components/users/UserFormModalFields.jsx` | 537 | 9 | `admin-btn-primary px-6 py-2.5 text-sm font-semibold rounded-xl shadow-xs disabled:opacity-50 disabled:cursor-not-allowed` |
| `src/features/tenant/components/users/UsersTable.jsx` | 113 | 10 | `absolute top-0 left-0 right-0 z-30 h-0.5 bg-purple-100 dark:bg-purple-950 overflow-hidden rounded-t-2xl` |
| `src/features/tenant/components/users/UsersTable.jsx` | 125 | 15 | `border-b border-slate-200 bg-slate-50/90 backdrop-blur-xs text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-400 sticky top-0 z-10` |
| `src/features/tenant/components/users/UsersTable.jsx` | 153 | 10 | `w-[34%] min-w-[220px] px-4 py-3.5 cursor-pointer select-none group focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-800` |
| `src/features/tenant/components/users/UsersTable.jsx` | 173 | 10 | `w-[18%] min-w-[120px] px-4 py-3.5 cursor-pointer select-none group focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-800` |
| `src/features/tenant/components/users/UsersTable.jsx` | 193 | 10 | `w-[32%] min-w-[200px] px-4 py-3.5 cursor-pointer select-none group focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-800` |
| `src/features/tenant/components/users/UsersTable.jsx` | 213 | 10 | `w-[16%] min-w-[100px] px-4 py-3.5 cursor-pointer select-none group focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-800` |
| `src/features/tenant/components/users/UsersTable.jsx` | 319 | 8 | `flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate` |
| `src/features/tenant/components/users/UsersTable.jsx` | 371 | 15 | `inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-purple-700 dark:text-purple-300 border border-slate-200 dark:border-slate-700` |
| `src/features/tenant/components/users/UsersTable.jsx` | 475 | 8 | `p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 animate-pulse` |
| `src/features/tenant/components/users/UsersTable.jsx` | 523 | 9 | `mt-1 h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-purple-600 focus:ring-purple-500 cursor-pointer` |
| `src/features/tenant/components/users/UsersTable.jsx` | 609 | 14 | `font-mono text-[10px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-200/60 dark:border-purple-800 shrink-0` |
| `src/features/tenant/components/users/UsersTable.jsx` | 616 | 8 | `inline-flex items-center gap-1 text-slate-400 dark:text-slate-500 text-[11px] truncate max-w-full` |
| `src/features/tenant/components/users/UsersTable.jsx` | 643 | 21 | `pointer-events-auto flex flex-wrap items-center gap-2 sm:gap-3 px-4 py-2.5 rounded-2xl bg-slate-900/95 dark:bg-slate-800/95 text-white shadow-2xl border border-slate-700/80 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200 max-w-full` |
| `src/features/tenant/components/users/UsersTable.jsx` | 644 | 8 | `flex items-center gap-2 pr-2 border-r border-slate-700 text-xs font-semibold` |
| `src/features/tenant/components/users/UsersTable.jsx` | 654 | 8 | `ml-1 text-[11px] text-purple-300 hover:text-purple-200 underline underline-offset-2 transition-colors cursor-pointer` |
| `src/features/tenant/components/users/UsersTable.jsx` | 670 | 16 | `flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-emerald-300 border border-slate-700 hover:border-emerald-500/40 transition-colors cursor-pointer` |
| `src/features/tenant/components/users/UsersTable.jsx` | 681 | 16 | `flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-amber-300 border border-slate-700 hover:border-amber-500/40 transition-colors cursor-pointer` |
| `src/features/tenant/components/users/UsersTable.jsx` | 691 | 16 | `flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 hover:border-slate-500 transition-colors cursor-pointer` |
| `src/features/tenant/components/users/UsersTable.jsx` | 700 | 8 | `p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1 cursor-pointer` |
| `src/features/tenant/pages/UsersPage.jsx` | 39 | 13 | `rounded-2xl border border-red-200 bg-red-50/80 p-4 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300 flex items-center justify-between gap-4` |
| `src/features/tenant/pages/UsersPage.jsx` | 54 | 16 | `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-100 hover:bg-red-200 text-red-800 dark:bg-red-900/60 dark:hover:bg-red-900 dark:text-red-200 text-xs font-semibold transition-colors shrink-0` |
| `src/features/tenant/pages/UsersPage.jsx` | 84 | 14 | `inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 text-xs font-semibold self-start sm:self-auto shadow-2xs` |
| `src/features/tenant/pages/UsersPage.jsx` | 95 | 10 | `ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono` |
| `src/features/tenant/pages/UsersPage.jsx` | 109 | 10 | `ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono` |
| `src/features/tenant/pages/UsersPage.jsx` | 123 | 10 | `ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-mono` |
| `src/features/tenant/pages/UsersPage.jsx` | 170 | 13 | `inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800` |
| `src/features/tenant/pages/UsersPage.jsx` | 183 | 13 | `inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800` |
| `src/features/tenant/pages/UsersPage.jsx` | 202 | 13 | `inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800` |
| `src/features/tenant/pages/UsersPage.jsx` | 215 | 13 | `inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800` |
| `src/features/tenant/pages/UsersPage.jsx` | 228 | 13 | `inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700` |
| `src/pharmacy/app/PharmacyAdminShell.jsx` | 88 | 10 | `admin-main min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-6 print:!bg-white print:p-4` |
| `src/pharmacy/app/PharmacyAdminSidebar.jsx` | 239 | 15 | `flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-600 transition-colors hover:bg-red-50 hover:text-red-700 dark:text-slate-300 dark:hover:bg-red-950/40 dark:hover:text-red-300` |
| `src/pharmacy/app/PharmacyAdminTopbar.jsx` | 17 | 11 | `admin-topbar print:hidden flex shrink-0 items-center justify-between gap-2 px-3 sm:h-16 sm:px-4 md:px-6` |
| `src/pharmacy/app/PharmacyAdminTopbar.jsx` | 22 | 9 | `shrink-0 rounded-lg p-2 text-slate-600 hover:bg-[color:var(--color-brand-soft)] hover:text-[color:var(--color-brand-deep)] dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white` |
| `src/pharmacy/pos/PharmacyPosShell.jsx` | 40 | 8 | `cashier-app__main flex-grow-1 overflow-hidden p-2 p-lg-3 d-flex flex-column min-h-0` |
| `src/router/guards/BillingAccessGuard.jsx` | 99 | 8 | `max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm` |
| `src/shelfLabelPrint/LabelTsplSettingsPanel.jsx` | 130 | 8 | `mt-4 rounded-xl border border-violet-200 bg-violet-50/50 p-3 dark:border-violet-900/50 dark:bg-violet-950/20` |
| `src/shelfLabelPrint/LabelTsplSettingsPanel.jsx` | 159 | 17 | `inline-flex items-center gap-1.5 rounded-lg border border-violet-300 bg-white px-2.5 py-1 text-xs font-medium text-violet-900 hover:bg-violet-50 disabled:opacity-60 dark:border-violet-700 dark:bg-slate-900 dark:text-violet-100` |
| `src/shelfLabelPrint/LabelTsplSettingsPanel.jsx` | 172 | 10 | `rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white` |
| `src/shelfLabelPrint/LabelTsplSettingsPanel.jsx` | 187 | 8 | `mb-2 flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-300` |
| `src/shelfLabelPrint/LabelTsplSettingsPanel.jsx` | 222 | 10 | `rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white` |
| `src/shelfLabelPrint/LabelTsplSettingsPanel.jsx` | 237 | 10 | `rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white` |
| `src/shelfLabelPrint/LabelTsplSettingsPanel.jsx` | 245 | 8 | `rounded-md bg-white/70 px-2 py-1.5 text-xs text-slate-600 dark:bg-slate-900/40 dark:text-slate-300` |
| `src/shelfLabelPrint/ShelfLabelPrintControls.jsx` | 3 | 9 | `flex items-center justify-between gap-3 border-b border-slate-100 py-3 last:border-b-0 dark:border-slate-700` |
| `src/shelfLabelPrint/ShelfLabelPrintControls.jsx` | 50 | 9 | `h-10 w-10 rounded-lg border border-slate-300 bg-white text-lg dark:border-slate-600 dark:bg-slate-800` |
| `src/shelfLabelPrint/ShelfLabelPrintControls.jsx` | 61 | 18 | `h-10 w-20 rounded-lg border border-slate-300 bg-white px-2 text-center font-mono text-base text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white` |
| `src/shelfLabelPrint/ShelfLabelPrintControls.jsx` | 65 | 9 | `h-10 w-10 rounded-lg border border-slate-300 bg-white text-lg dark:border-slate-600 dark:bg-slate-800` |
| `src/shelfLabelPrint/ShelfLabelPrintModal.jsx` | 39 | 11 | `shelflabel-no-print-wrap fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4` |
| `src/shelfLabelPrint/ShelfLabelPrintModal.jsx` | 44 | 12 | `relative flex max-h-[95vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl dark:bg-slate-900 sm:rounded-2xl` |
| `src/shelfLabelPrint/ShelfLabelPrintModal.jsx` | 46 | 9 | `flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700` |
| `src/shelfLabelPrint/ShelfLabelPrintModal.jsx` | 77 | 10 | `shelflabel-preview-wrap my-4 rounded-xl border border-slate-200 bg-white p-3 shadow-inner dark:border-slate-600 dark:bg-slate-950` |
| `src/shelfLabelPrint/ShelfLabelPrintModal.jsx` | 90 | 11 | `mb-4 mt-3 rounded-lg bg-emerald-50 px-3 py-2.5 text-center text-sm text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100` |
| `src/shelfLabelPrint/ShelfLabelPrintModal.jsx` | 130 | 13 | `w-full rounded-xl bg-emerald-700 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 disabled:opacity-60 dark:bg-emerald-600 dark:hover:bg-emerald-500` |
| `src/shelfLabelPrint/ShelfLabelPrintSettingsPanel.jsx` | 131 | 8 | `shelflabel-settings__group-title mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400` |
| `src/shelfLabelPrint/ShelfLabelPrintSettingsPanel.jsx` | 161 | 13 | `inline-flex shrink-0 items-center gap-0.5 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-900 dark:bg-amber-950/60 dark:text-amber-200` |
| `src/shelfLabelPrint/ShelfLabelPrintSettingsPanel.jsx` | 186 | 13 | `shelflabel-settings__printer-guide mt-4 rounded-lg border border-sky-200 bg-sky-50/60 px-3 py-2.5 text-xs text-sky-950 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-100` |
| `src/shelfLabelPrint/ShelfLabelPrintSettingsPanel.jsx` | 197 | 12 | `mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-600 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-300` |
| `src/shelfLabelPrint/ShelfLabelPrintSettingsPanel.jsx` | 220 | 8 | `mt-4 rounded-xl border border-emerald-200 bg-emerald-50/40 p-3 dark:border-emerald-900/50 dark:bg-emerald-950/20` |
| `src/shelfLabelPrint/ShelfLabelPrintSettingsPanel.jsx` | 235 | 16 | `inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200` |
| `src/shelfLabelPrint/ShelfLabelPrintSettingsPanel.jsx` | 264 | 9 | `shelflabel-settings__offset-hint rounded-md bg-white/70 px-2 py-1.5 text-xs text-slate-600 dark:bg-slate-900/40 dark:text-slate-300` |
| `src/shelfLabelPrint/ShelfLabelPrintSettingsPanel.jsx` | 288 | 17 | `mt-4 flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800` |

## 6. Shared UI Components (`src/components/ui/` & `src/components/shared/`)

### 6.1 `src/components/ui/`
- `src/components/ui/BaseButton.jsx`
- `src/components/ui/BaseInput.jsx`
- `src/components/ui/BaseModal.jsx`
- `src/components/ui/BaseSelect.jsx`
- `src/components/ui/BaseTable.jsx`
- `src/components/ui/ErrorBanner.jsx`
- `src/components/ui/PageHeader.jsx`
- `src/components/ui/PageLayout.jsx`
- `src/components/ui/PageSearchField.jsx`
- `src/components/ui/PlatformErrorState.jsx`
- `src/components/ui/Spinner.jsx`
- `src/components/ui/index.js`
- `src/components/ui/uiClasses.js`
- `src/components/ui/useBaseSelect.js`

### 6.2 `src/components/shared/`
- `src/components/shared/AdminTableNoIdColumns.jsx`
- `src/components/shared/AdminThemeSync.jsx`
- `src/components/shared/BrandMark.jsx`
- `src/components/shared/FormDraftNotice.jsx`
- `src/components/shared/GlobalOfflineBanner.jsx`
- `src/components/shared/HtmlLangSync.jsx`
- `src/components/shared/LanguageSwitcher.jsx`
- `src/components/shared/LastUpdatedBadge.jsx`
- `src/components/shared/OnScreenKeyboardButton.jsx`
- `src/components/shared/PosModalPortal.jsx`
- `src/components/shared/ReceiptPrintingOverlay.jsx`
- `src/components/shared/ReportDateBar.jsx`
- `src/components/shared/TablePagination.jsx`
- `src/components/shared/TableRowActionsMenu.jsx`
- `src/components/shared/TenantDisplayBootstrap.jsx`
- `src/components/shared/ThermalReportPrintPortal.jsx`
- `src/components/shared/UnitConversionHelper.jsx`
- `src/components/shared/VirtualKeyboardOverlay.jsx`

## 7. Modals (67) and Drawers (10) Base Component Usage

### 7.1 Modals (67)

| File | Base / Mechanism |
|---|---|
| `src/components/pos/PosReturnModal.jsx` | PosModalPortal, custom CSS classes |
| `src/components/sale-return/SalePartialReturnModal.jsx` | PosModalPortal, custom fixed inset-0 |
| `src/components/shared/PosModalPortal.jsx` | PosModalPortal, createPortal |
| `src/components/tasnif/TasnifPackagePickerModal.jsx` | custom fixed inset-0 |
| `src/components/ui/BaseModal.jsx` | BaseModal, createPortal, custom fixed inset-0 |
| `src/contexts/CashierShiftModalContext.jsx` | wrapper/delegated |
| `src/features/billing/components/BillingLedgerConfirmModal.jsx` | BaseModal |
| `src/features/billing/components/BillingLedgerDetailModal.jsx` | BaseModal |
| `src/features/billing/components/BillingPayModal.jsx` | BaseModal |
| `src/features/cash-registers/components/CashRegisterConfigAddModal.jsx` | custom fixed inset-0 |
| `src/features/cash-registers/components/CashRegisterDetailsModal.jsx` | custom fixed inset-0 |
| `src/features/cash-registers/components/CashRegisterFormModal.jsx` | custom fixed inset-0 |
| `src/features/cash-registers/components/MultikassaSettingsModal.jsx` | createPortal, custom fixed inset-0 |
| `src/features/cashier/components/CashierShiftModal.jsx` | PosModalPortal |
| `src/features/cashier/components/ShiftCashMovementModal.jsx` | PosModalPortal, custom CSS classes |
| `src/features/cashier/components/my-sales/CashierMySalesReturnModal.jsx` | wrapper/delegated |
| `src/features/cashier/components/weight-entry/WeightEntryModalBody.jsx` | wrapper/delegated |
| `src/features/catalog/components/suppliers/SupplierModal.jsx` | custom fixed inset-0 |
| `src/features/finance/components/audit/FinanceAuditDetailModal.jsx` | wrapper/delegated |
| `src/features/finance/components/dashboard/FinanceChartDayDetailModal.jsx` | wrapper/delegated |
| `src/features/finance/components/dashboard/FinanceRecentDetailModal.jsx` | wrapper/delegated |
| `src/features/finance/components/debts/FinanceDebtEntriesModal.jsx` | BaseModal |
| `src/features/finance/components/debts/FinanceDebtEntryDetailModal.jsx` | wrapper/delegated |
| `src/features/finance/components/detail/FinanceDetailModalShell.jsx` | BaseModal |
| `src/features/finance/components/shared/FinanceBulkConfirmModal.jsx` | BaseModal |
| `src/features/finance/components/shared/FinanceRecordDetailModal.jsx` | wrapper/delegated |
| `src/features/pharmacy-cashier/components/PharmacyBranchSearchModal.jsx` | PosModalPortal, custom CSS classes |
| `src/features/pharmacy-cashier/components/PharmacyCashOpsModal.jsx` | PosModalPortal, custom CSS classes |
| `src/features/pharmacy-cashier/components/PharmacyChecksModal.jsx` | PosModalPortal, custom CSS classes |
| `src/features/pharmacy-cashier/components/PharmacyMixedPayModal.jsx` | PosModalPortal, custom CSS classes |
| `src/features/pharmacy-cashier/components/PharmacyOrderDiscountModal.jsx` | PosModalPortal, custom CSS classes |
| `src/features/pharmacy-cashier/components/PharmacyParkedModal.jsx` | PosModalPortal, custom CSS classes |
| `src/features/pharmacy-cashier/components/PharmacyPosSettingsModal.jsx` | PosModalPortal |
| `src/features/pharmacy-cashier/components/PharmacyPreviewModal.jsx` | PosModalPortal, custom CSS classes |
| `src/features/pharmacy-cashier/components/PharmacyQtyModal.jsx` | custom CSS classes |
| `src/features/pharmacy-cashier/components/PharmacyWeightEntryModal.jsx` | custom CSS classes |
| `src/features/pharmacy-stock/components/PharmacyBulkNumberModal.jsx` | BaseModal |
| `src/features/pharmacy-stock/components/PharmacyProductDeleteModal.jsx` | BaseModal |
| `src/features/pharmacy-stock/components/PharmacyProductModal.jsx` | BaseModal, custom CSS classes |
| `src/features/pharmacy-stock/components/PharmacyProductModalFooter.jsx` | wrapper/delegated |
| `src/features/pharmacy-stock/components/PharmacyProductSaveConfirmModal.jsx` | BaseModal |
| `src/features/pharmacy-stock/components/PharmacyProductsImportConfirmModal.jsx` | BaseModal |
| `src/features/pharmacy-stock/components/PharmacyReceiptActivateModal.jsx` | BaseModal |
| `src/features/pharmacy-stock/components/PharmacyReceiptDeleteModal.jsx` | BaseModal |
| `src/features/pharmacy-stock/components/PharmacyReceiptDocumentModals.jsx` | wrapper/delegated |
| `src/features/pharmacy-stock/components/PharmacyReceiptHeaderModal.jsx` | BaseModal, custom CSS classes |
| `src/features/pharmacy-stock/components/PharmacyReceiptImportMarksVerifyModal.jsx` | BaseModal |
| `src/features/pharmacy-stock/components/PharmacyReceiptLineDeleteModal.jsx` | BaseModal |
| `src/features/pharmacy-stock/components/PharmacyReceiptLineModal.jsx` | BaseModal, custom CSS classes |
| `src/features/pharmacy-stock/components/PharmacyReceiptMarkScanModal.jsx` | BaseModal |
| `src/features/sales/components/ReturnDetailModal.jsx` | custom fixed inset-0 |
| `src/features/sales/components/ReturnReasonModal.jsx` | custom fixed inset-0 |
| `src/features/sales/components/SaleFiscalPrintModal.jsx` | custom fixed inset-0 |
| `src/features/sales/components/returns/ReturnsModals.jsx` | custom CSS classes |
| `src/features/sales/components/sales-ledger/SalesLedgerModals.jsx` | createPortal, custom CSS classes |
| `src/features/tenant/components/barcode-print/BarcodePrintModals.jsx` | wrapper/delegated |
| `src/features/tenant/components/stores/PharmacyIntegrationSettingsModal.jsx` | createPortal, custom fixed inset-0, custom CSS classes |
| `src/features/tenant/components/stores/PlatformStoreDeleteModal.jsx` | BaseModal |
| `src/features/tenant/components/stores/PlatformStoreToggleActiveModal.jsx` | BaseModal |
| `src/features/tenant/components/stores/StoreFormModal.jsx` | BaseModal |
| `src/features/tenant/components/stores/StoreFormModalFields.jsx` | wrapper/delegated |
| `src/features/tenant/components/stores/StoresPageModals.jsx` | custom CSS classes |
| `src/features/tenant/components/users/UserCredentialsCreatedModal.jsx` | createPortal, custom fixed inset-0 |
| `src/features/tenant/components/users/UserDeleteConfirmModal.jsx` | createPortal, custom fixed inset-0 |
| `src/features/tenant/components/users/UserFormModal.jsx` | createPortal, custom fixed inset-0 |
| `src/features/tenant/components/users/UserFormModalFields.jsx` | wrapper/delegated |
| `src/shelfLabelPrint/ShelfLabelPrintModal.jsx` | custom fixed inset-0 |

### 7.2 Drawers (10)

| File | Base / Mechanism |
|---|---|
| `src/features/cash-registers/components/CashRegisterConfigFiltersDrawer.jsx` | custom fixed inset-0, custom CSS classes |
| `src/features/cash-registers/components/CashRegistersFiltersDrawer.jsx` | custom fixed inset-0, custom CSS classes |
| `src/features/cash-registers/components/CashTransferFiltersDrawer.jsx` | custom fixed inset-0, custom CSS classes |
| `src/features/cash-registers/components/z-reports/ZReportFiltersDrawer.jsx` | custom fixed inset-0, custom CSS classes |
| `src/features/catalog/components/suppliers/SupplierFiltersDrawer.jsx` | custom fixed inset-0, custom CSS classes |
| `src/features/sales/components/ReturnsFiltersDrawer.jsx` | custom fixed inset-0, custom CSS classes |
| `src/features/sales/components/SalesLedgerFiltersDrawer.jsx` | custom fixed inset-0, custom CSS classes |
| `src/features/tenant/components/stores/PlatformStoreQuickDrawer.jsx` | createPortal, custom fixed inset-0, custom CSS classes |
| `src/features/tenant/components/stores/PlatformStoreQuickDrawerDetails.jsx` | custom CSS classes |
| `src/features/tenant/components/users/PlatformUserQuickDrawer.jsx` | createPortal, custom fixed inset-0, custom CSS classes |

## 8. Recharts & Data Visualization Usage

- `src/features/ai/components/AiAssistantChartPanel.jsx`
- `src/features/dashboard/components/DashboardChartsRow.jsx`
- `src/styles/tokens/shell-layout.css`
- Expiry date calendar component: `src/features/pharmacy-stock/components/PharmacyExpiryCalendar.jsx`

## 9. Screens List (`*Page.jsx`, Grouped)

### 9.1 POS (1)
- `src/features/pharmacy-cashier/pages/PharmacyPosPage.jsx` (routed)

### 9.2 Dashboard, Catalog, AI, Handbook & Support (5)
- `src/features/catalog/pages/SuppliersPage.jsx` (routed)
- `src/features/dashboard/pages/DashboardPage.jsx` (routed)
- `src/features/ai/pages/AiAssistantPage.jsx` (routed)
- `src/features/handbook/pages/HandbookPage.jsx` (routed)
- `src/features/support/pages/SupportPage.jsx` (routed)

### 9.3 Stock (Pharmacy Stock & Warehouse) (5)
- `src/features/pharmacy-stock/pages/PharmacyProductsPage.jsx` (routed)
- `src/features/pharmacy-stock/pages/PharmacyReceiptDocumentPage.jsx` (routed)
- `src/features/pharmacy-stock/pages/PharmacyReceiptsPage.jsx` (routed)
- `src/features/stock/pages/StockInventoryCreatePage.jsx` (routed)
- `src/features/stock/pages/StockTransferCreatePage.jsx` (routed)

### 9.4 Sales & Returns (2)
- `src/features/sales/pages/ReturnsPage.jsx` (routed)
- `src/features/sales/pages/SalesLedgerPage.jsx` (routed)

### 9.5 Reports (12)
- `src/features/reports/pages/CashierPerformanceReportPage.jsx` (routed)
- `src/features/reports/pages/DailySummaryReportPage.jsx` (routed)
- `src/features/reports/pages/DrugRegistryPage.jsx` (routed)
- `src/features/reports/pages/LowStockReportPage.jsx` (routed)
- `src/features/reports/pages/PriceRegistryJournalPage.jsx` (routed)
- `src/features/reports/pages/ProductSalesReportPage.jsx` (routed)
- `src/features/reports/pages/ReportsHubPage.jsx` (routed)
- `src/features/reports/pages/StockBalancesReportPage.jsx` (routed)
- `src/features/reports/pages/StockInventoriesReportPage.jsx` (routed)
- `src/features/reports/pages/StockReceiptsReportPage.jsx` (routed)
- `src/features/reports/pages/StockTransfersReportPage.jsx` (routed)
- `src/features/reports/pages/StoreSalesReportPage.jsx` (routed)

### 9.6 Finance, Cash Registers, Branches, Users & Billing (20)
- `src/features/billing/pages/TenantBillingPage.jsx` (routed)
- `src/features/cash-registers/pages/CashRegisterConfigPage.jsx` (routed)
- `src/features/cash-registers/pages/CashRegisterTransferPage.jsx` (routed)
- `src/features/cash-registers/pages/CashRegistersListPage.jsx` (routed)
- `src/features/cash-registers/pages/ZReportsPage.jsx` (routed)
- `src/features/finance/pages/FinanceAccountsPage.jsx` (routed)
- `src/features/finance/pages/FinanceAuditPage.jsx` (routed)
- `src/features/finance/pages/FinanceCategoriesPage.jsx` (routed)
- `src/features/finance/pages/FinanceDashboardPage.jsx` (routed)
- `src/features/finance/pages/FinanceDebtsPage.jsx` (routed)
- `src/features/finance/pages/FinanceExpensesPage.jsx` (routed)
- `src/features/finance/pages/FinanceIncomesPage.jsx` (routed)
- `src/features/finance/pages/FinanceReportsPage.jsx` (routed)
- `src/features/finance/pages/FinanceSyncPage.jsx` (routed)
- `src/features/finance/pages/FinanceTransfersPage.jsx` (routed)
- `src/features/tenant/pages/StoresPage.jsx` (routed)
- `src/features/tenant/pages/UsersBarcodePrintPage.jsx` (routed)
- `src/features/tenant/pages/UsersBrandingSettingsPage.jsx` (routed)
- `src/features/tenant/pages/UsersPage.jsx` (routed)
- `src/features/tenant/pages/UsersPrinterSettingsPage.jsx` (routed)

### 9.7 Auth (Login / PIN / Handoff) (3)
- `src/features/auth/pages/AuthAcceptPage.jsx` (routed)
- `src/features/auth/pages/LoginPage.jsx` (routed)
- `src/features/cashier/pages/CashierPinLoginPage.jsx` (not directly in main routes / embedded)

### 9.8 Other / Legacy Cashier Pages (1)
- `src/features/cashier/pages/CashierMySalesPage.jsx` (not directly in main routes / embedded)
