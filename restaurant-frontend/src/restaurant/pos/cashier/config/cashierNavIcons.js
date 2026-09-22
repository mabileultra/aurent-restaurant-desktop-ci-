import {
  Banknote,
  CalendarDays,
  ClipboardList,
  LayoutGrid,
  RotateCcw,
  ShoppingBag,
  TimerReset,
} from 'lucide-react';

export const CASHIER_TAB_ICONS = {
  hall: LayoutGrid,
  sales: ShoppingBag,
  orders: ClipboardList,
  bookings: CalendarDays,
  payment: Banknote,
  returns: RotateCcw,
  shift: TimerReset,
};
