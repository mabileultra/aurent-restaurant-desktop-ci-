import { createContext, createElement, useContext } from 'react';

/** Default paths for Aurent AppShell (pharmacy/retail). Restaurant stock is on r-aurent. */
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
