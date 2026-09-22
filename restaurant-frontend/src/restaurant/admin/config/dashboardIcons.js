import {
  Banknote,
  ChefHat,
  ClipboardList,
  LayoutGrid,
  Plus,
  Receipt,
  TrendingUp,
  UtensilsCrossed,
  Warehouse,
} from 'lucide-react';

export const DASHBOARD_KPI_ICONS = {
  sales: Banknote,
  orders: ClipboardList,
  avg: Receipt,
  tables: LayoutGrid,
  kitchen: ChefHat,
  profit: TrendingUp,
};

export const DASHBOARD_ACTION_ICONS = {
  newOrder: Plus,
  receipt: Warehouse,
  floor: LayoutGrid,
  pos: Banknote,
  kitchen: ChefHat,
  reports: TrendingUp,
  myOrders: UtensilsCrossed,
};
