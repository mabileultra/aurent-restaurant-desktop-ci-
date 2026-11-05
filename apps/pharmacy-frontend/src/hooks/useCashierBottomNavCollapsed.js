const STORAGE_KEY = 'pos.cashierBottomNavCollapsed';

export function readCashierBottomNavCollapsed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function writeCashierBottomNavCollapsed(collapsed) {
  try {
    localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0');
  } catch {
    /* ignore */
  }
}
