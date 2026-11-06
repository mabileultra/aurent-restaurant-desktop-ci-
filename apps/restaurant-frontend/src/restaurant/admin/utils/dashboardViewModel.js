/** Flatten nested dashboard API payload for panel components. */
export function toDashboardViewModel(payload) {
  if (!payload) return null;
  const finance = payload.finance ?? {};
  const ops = payload.ops ?? {};
  const live = payload.live ?? {};
  return {
    periodKey: payload.periodKey,
    from: payload.from,
    to: payload.to,
    ...finance,
    ...ops,
    liveTables: live.tables ?? [],
    kitchenQueue: live.kitchenQueue ?? [],
    recentOrders: live.recentOrders ?? [],
  };
}
