import { useEffect, useState } from 'react';

function readTouchPrefer() {
  if (typeof window === 'undefined') return false;
  if (window.desktopCashier?.isDesktop) return true;
  try {
    return window.matchMedia('(pointer: coarse)').matches
      || window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  } catch {
    return false;
  }
}

/** Larger PIN keypad targets on touch / Electron POS. */
export function useCashierPosTouchLayout() {
  const [touch, setTouch] = useState(readTouchPrefer);

  useEffect(() => {
    const update = () => setTouch(readTouchPrefer());
    update();
    const mq = window.matchMedia('(pointer: coarse)');
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);

  return touch;
}
