import { createContext, useContext } from 'react';

/** Default paths for Aurent AppShell (pharmacy/retail). */
export const DEFAULT_STOCK_FLOW_PATHS = {
  products: '/stock/products',
  inventoriesReport: '/reports/stock/inventories',
  inventoriesNew: '/stock/inventories/new',
  receiptsReport: '/reports/stock/receipts',
  receiptsNew: '/stock/receipts/new',
  balancesReport: '/reports/stock/balances',
  lowStockReport: '/reports/stock/low',
  stockDashboard: '/reports/stock',
};

/** Paths when the same warehouse/report UIs live inside Restaurant OS. */
export const RST_STOCK_FLOW_PATHS = {
  products: '/rst/admin/stock',
  inventoriesReport: '/rst/admin/reports/inventories',
  inventoriesNew: '/rst/admin/stock/inventories/new',
  receiptsReport: '/rst/admin/reports/inventories',
  receiptsNew: '/rst/admin/stock/receipts/new',
  balancesReport: '/rst/admin/reports/balances',
  lowStockReport: '/rst/admin/reports/low',
  stockDashboard: '/rst/admin/reports',
};

const StockFlowPathsContext = createContext(DEFAULT_STOCK_FLOW_PATHS);

export function StockFlowPathsProvider({ value, children }) {
  return (
    <StockFlowPathsContext.Provider value={value ?? DEFAULT_STOCK_FLOW_PATHS}>
      {children}
    </StockFlowPathsContext.Provider>
  );
}

export function useStockFlowPaths() {
  return useContext(StockFlowPathsContext);
}
