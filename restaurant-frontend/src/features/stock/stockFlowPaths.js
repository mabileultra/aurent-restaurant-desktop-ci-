export const RST_STOCK_FLOW_PATHS = {
  products: '/rst/admin/stock/products',
  categories: '/rst/admin/stock/categories',
  balances: '/rst/admin/stock/balances',
  inventories: '/rst/admin/stock/inventories',
  inventoriesNew: '/rst/admin/stock/inventories/new',
  receipts: '/rst/admin/stock/receipts',
  receiptsNew: '/rst/admin/stock/receipts/new',
  suppliers: '/rst/admin/stock/suppliers',
};

export function StockFlowPathsProvider({ children }) {
  return children;
}
