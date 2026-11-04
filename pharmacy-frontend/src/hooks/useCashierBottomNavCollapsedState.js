import { useCallback, useState } from 'react';
import {
  readCashierBottomNavCollapsed,
  writeCashierBottomNavCollapsed,
} from './useCashierBottomNavCollapsed';

export function useCashierBottomNavCollapsedState() {
  const [collapsed, setCollapsed] = useState(readCashierBottomNavCollapsed);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      writeCashierBottomNavCollapsed(next);
      return next;
    });
  }, []);

  return { collapsed, toggleCollapsed };
}
