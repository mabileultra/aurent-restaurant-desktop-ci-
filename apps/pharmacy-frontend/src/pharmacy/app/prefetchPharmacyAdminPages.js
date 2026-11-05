/** Warm common admin chunks after shell mount (idle) so first click is faster. */
export function prefetchPharmacyAdminPages() {
  const run = () => {
    void import('../../features/pharmacy-stock/pages/PharmacyProductsPage');
    void import('../../features/pharmacy-stock/pages/PharmacyReceiptsPage');
    void import('../../features/stock/pages/StockInventoryCreatePage');
    void import('../../features/stock/pages/StockTransferCreatePage');
    void import('../../features/catalog/pages/SuppliersPage');
    void import('../../features/sales/pages/SalesLedgerPage');
  };
  if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(run, { timeout: 2500 });
    return;
  }
  window.setTimeout(run, 400);
}
