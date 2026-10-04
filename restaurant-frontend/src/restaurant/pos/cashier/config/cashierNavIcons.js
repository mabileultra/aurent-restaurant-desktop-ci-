import {
  ArrowLeftRight,
  Banknote,
  CalendarDays,
  ClipboardList,
  LayoutGrid,
  Percent,
  Receipt,
  ShoppingBag,
  TimerReset,
  Undo2,
} from 'lucide-react';

export const CASHIER_TAB_ICONS = {
  hall: LayoutGrid,
  paid: Receipt,
  returns: Undo2,
  sales: ShoppingBag,
  orders: ClipboardList,
  bookings: CalendarDays,
  payment: Banknote,
  discount: Percent,
  cash: ArrowLeftRight,
  shift: TimerReset,
};
