import { useEffect } from 'react';
import { pushMenuImageBusy, popMenuImageBusy } from '../utils/menuImageLoadQueue';
import {
  resetMenuImagePreloadMarks,
  stopMenuImageShift,
  syncMenuImageShift,
} from '../utils/menuImageShiftPreload';

/** One quiet photo pass for the open shift. Leaving the POS or closing the shift drops them. */
export function useMenuImageShiftPreload({ shiftId, menuItems, photosEnabled, payPending }) {
  useEffect(() => {
    if (!photosEnabled) {
      stopMenuImageShift();
      return undefined;
    }
    syncMenuImageShift(shiftId ?? null, menuItems);
    return undefined;
  }, [shiftId, menuItems, photosEnabled]);

  useEffect(() => () => {
    stopMenuImageShift();
    resetMenuImagePreloadMarks();
  }, []);

  useEffect(() => {
    if (!payPending) return undefined;
    pushMenuImageBusy();
    return () => popMenuImageBusy();
  }, [payPending]);
}
