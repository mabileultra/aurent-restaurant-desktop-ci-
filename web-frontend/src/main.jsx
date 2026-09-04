// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './i18n/config';
import { initSentry } from './observability/initSentry';
import App from './App.jsx';
import './index.css';
import { syncRootTheme, syncPublicTheme, syncRestaurantTheme } from './store/themeStore';
import { isPublicAppPath } from './utils/publicAppPaths';
import { readCashierTheme, syncCashierThemeDocument } from './utils/cashierTheme';
import { usePrintSettingsStore } from './store/printSettingsStore';
import { useTenantDisplayStore } from './store/tenantDisplayStore';
import { syncPrintCssVars } from './utils/syncPrintCssVars';
import { syncReceiptDisplayCssVars } from './utils/syncReceiptDisplayCssVars';
import { resetCashierDocumentUiState } from './utils/resetCashierDocumentUiState';
resetCashierDocumentUiState();
initSentry();

const isCashierRoute =
  typeof window !== 'undefined' && window.location.pathname.startsWith('/cashier');
const isRstRoute =
  typeof window !== 'undefined' && window.location.pathname.startsWith('/rst');
if (isCashierRoute) {
  syncCashierThemeDocument(readCashierTheme());
} else if (isRstRoute) {
  syncRestaurantTheme();
} else if (typeof window !== 'undefined' && isPublicAppPath(window.location.pathname)) {
  syncPublicTheme();
} else {
  syncRootTheme();
}
syncPrintCssVars(usePrintSettingsStore.getState());
syncReceiptDisplayCssVars(useTenantDisplayStore.getState().committed);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
