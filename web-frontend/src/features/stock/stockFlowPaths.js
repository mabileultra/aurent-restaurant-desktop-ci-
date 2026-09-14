import { createContext, createElement, useContext } from 'react';

/** Default paths for Aurent AppShell (pharmacy/retail). */
export const DEFAULT_STOCK_FLOW_PATHS = {
  products: '/stock/products',
  categories: '/categories',
  inventoriesReport: '/reports/stock/inventories',
  inventoriesNew: '/stock/inventories/new',
  receiptsReport: '/reports/stock/receipts',
  receiptsNew: '/stock/receipts/new',
  balancesReport: '/reports/stock/balances',
  lowStockReport: '/reports/stock/low',
  stockDashboard: '/reports/stock',
  lifecycleReport: '/reports/stock/lifecycle',
  suppliers: '/stock/suppliers',
};

/** Paths when the same warehouse/report UIs live inside Restaurant OS. */
export const RST_STOCK_FLOW_PATHS = {
  products: '/rst/admin/stock/products',
  categories: '/rst/admin/stock/categories',
  inventoriesReport: '/rst/admin/stock/inventories',
  inventoriesNew: '/rst/admin/stock/inventories/new',
  receiptsReport: '/rst/admin/stock/receipts',
  receiptsNew: '/rst/admin/stock/receipts/new',
  balancesReport: '/rst/admin/stock/balances',
  lowStockReport: '/rst/admin/reports/low',
  stockDashboard: '/rst/admin/stock/products',
  lifecycleReport: null,
  suppliers: '/rst/admin/stock/suppliers',
};

const StockFlowPathsContext = createContext(DEFAULT_STOCK_FLOW_PATHS);

export function StockFlowPathsProvider({ value, children }) {
  return createElement(
    StockFlowPathsContext.Provider,
    { value: value ?? DEFAULT_STOCK_FLOW_PATHS },
    children
  );
}

export function useStockFlowPaths() {
  return useContext(StockFlowPathsContext);
}
