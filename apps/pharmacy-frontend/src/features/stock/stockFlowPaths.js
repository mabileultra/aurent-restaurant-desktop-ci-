import { createContext, createElement, useContext } from 'react';
import { PHARM_STOCK_PATHS } from '../../pharmacy/app/pharmacyPaths';

/** Stock deep-links inside pharmacy SPA (reports ↔ warehouse). */
export const DEFAULT_STOCK_FLOW_PATHS = {
  products: PHARM_STOCK_PATHS.products,
  categories: '/categories',
  inventoriesReport: '/reports/stock/inventories',
  inventoriesNew: '/stock/inventories/new',
  receiptsReport: '/reports/stock/receipts',
  receiptsNew: PHARM_STOCK_PATHS.receiptsNew,
  receiptEdit: (id) => PHARM_STOCK_PATHS.receipt(id),
  balancesReport: '/reports/stock/balances',
  lowStockReport: '/reports/stock/low',
  stockDashboard: '/reports/stock',
  lifecycleReport: '/reports/stock/lifecycle',
  suppliers: '/stock/suppliers',
  transfersNew: '/stock/transfers/new',
  transfersReport: '/reports/stock/transfers',
};

const StockFlowPathsContext = createContext(DEFAULT_STOCK_FLOW_PATHS);

export function StockFlowPathsProvider({ value, children }) {
  return createElement(
    StockFlowPathsContext.Provider,
    { value: value ?? DEFAULT_STOCK_FLOW_PATHS },
    children,
  );
}

export function useStockFlowPaths() {
  return useContext(StockFlowPathsContext);
}
