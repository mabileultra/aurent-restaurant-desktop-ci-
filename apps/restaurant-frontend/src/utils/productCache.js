const PRODUCT_QUERY_SEGMENTS = [
  'products',
  'product',
  'warehouse-products',
  'product-stock',
  'pos-products',
  'dashboard-low-stock',
  'low-stock',
  'reports-low-stock',
  'stock-inventories-report',
  'stock-balances',
];

function isProductQueryKey(queryKey) {
  if (!Array.isArray(queryKey)) return false;
  if (queryKey[0] === 'tenant' && queryKey.length > 2) {
    return PRODUCT_QUERY_SEGMENTS.includes(queryKey[2]);
  }
  return PRODUCT_QUERY_SEGMENTS.includes(queryKey[0]);
}

export function invalidateProductCaches(qc) {
  qc.invalidateQueries({ predicate: ({ queryKey }) => isProductQueryKey(queryKey) });
}
