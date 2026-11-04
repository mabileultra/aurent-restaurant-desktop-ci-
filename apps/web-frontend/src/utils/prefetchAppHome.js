/**
 * Прогрев home-chunk до navigate — каскад: shell сразу, страница почти без паузы.
 * @param {string} path
 */
export function prefetchAppHome(path) {
  if (!path || typeof path !== 'string') return;

  if (path.startsWith('/platform')) {
    void import('../features/platform/pages/PlatformCompaniesPage');
    return;
  }
  if (path.startsWith('/pharm/')) {
    void import('../features/pharmacy-stock/pages/PharmacyProductsPage');
    return;
  }
  if (path.startsWith('/finance')) {
    void import('../features/finance/pages/FinanceDashboardPage');
    return;
  }
  if (path.startsWith('/cashier')) {
    void import('../features/cashier/pages/PosPage');
    return;
  }
  void import('../features/dashboard/pages/DashboardPage');
}
