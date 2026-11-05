/** Overlay dashboard current-stock KPIs with live catalog totals. */
export function mergeDashboardLiveStock(dashboard, live) {
  if (!dashboard) return dashboard;
  if (!live || live.stockValueTotal == null) return dashboard;

  const qty = live.stockQuantityTotal;
  return {
    ...dashboard,
    currentStockUnits:
      qty == null || qty === ''
        ? dashboard.currentStockUnits
        : Math.round(Number(qty)),
    currentStockRetailEstimate: live.stockValueTotal,
    currentStockCostEstimate:
      live.stockCostTotal != null
        ? live.stockCostTotal
        : dashboard.currentStockCostEstimate,
  };
}
