// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './i18n/config';
import App from './App.jsx';
import './index.css';
import { syncRootTheme } from './store/themeStore';
import { readCashierTheme } from './utils/cashierTheme';
import { syncCashierDocumentPaint } from './utils/cashierDocumentPaint';
import { usePrintSettingsStore } from './store/printSettingsStore';
import { useTenantDisplayStore } from './store/tenantDisplayStore';
import { syncPrintCssVars } from './utils/syncPrintCssVars';
import { syncReceiptDisplayCssVars } from './utils/syncReceiptDisplayCssVars';
import { resetCashierDocumentUiState } from './utils/resetCashierDocumentUiState';
resetCashierDocumentUiState();

const isCashierRoute =
  typeof window !== 'undefined' && window.location.pathname.startsWith('/cashier');
if (isCashierRoute) {
  syncCashierDocumentPaint(readCashierTheme());
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
