import { useCashierTouchLayout } from './useCashierTouchLayout';
import { useCashierPosDesktopLayout } from './useCashierPosDesktopLayout';

function readIsDesktopApp() {
  return typeof window !== 'undefined' && Boolean(window.desktopCashier?.isDesktop);
}

/**
 * Крупные touch-таргеты: сенсор, Electron или десктоп ≥1024px (POS-монитор в браузере).
 */
export function useCashierPosTouchLayout() {
  const touchFromMedia = useCashierTouchLayout();
  const posDesktop = useCashierPosDesktopLayout();
  const isDesktopApp = readIsDesktopApp();

  return touchFromMedia || isDesktopApp || posDesktop;
}
