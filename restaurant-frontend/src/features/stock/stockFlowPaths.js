import { createContext, createElement, useContext } from 'react';

/** Paths when warehouse/report UIs live inside Restaurant OS. */
export const RST_STOCK_FLOW_PATHS = {
  overview: '/rst/admin/stock',
  products: '/rst/admin/stock/products',
  categories: '/rst/admin/stock/categories',
  inventories: '/rst/admin/stock/inventories',
  inventoriesReport: '/rst/admin/stock/inventories',
  receipts: '/rst/admin/stock/receipts',
  receiptsReport: '/rst/admin/stock/receipts',
  receiptNew: '/rst/admin/stock/receipts/new',
  receipt: (id) => `/rst/admin/stock/receipts/${id}`,
  balances: '/rst/admin/stock/balances',
  balancesReport: '/rst/admin/stock/balances',
  writeOffs: '/rst/admin/stock/write-offs',
  expenses: '/rst/admin/stock/expenses',
  transfers: '/rst/admin/stock/transfers',
  production: '/rst/admin/stock/production',
  movements: '/rst/admin/stock/movements',
  lowStockReport: '/rst/admin/stock/balances',
  suppliers: '/rst/admin/stock/suppliers',
};

const StockFlowPathsContext = createContext(RST_STOCK_FLOW_PATHS);

export function StockFlowPathsProvider({ value, children }) {
  return createElement(
    StockFlowPathsContext.Provider,
    { value: value ?? RST_STOCK_FLOW_PATHS },
    children,
  );
}

export function useStockFlowPaths() {
  return useContext(StockFlowPathsContext);
}
