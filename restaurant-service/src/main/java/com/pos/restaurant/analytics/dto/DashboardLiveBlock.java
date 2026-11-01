package com.pos.restaurant.analytics.dto;

import java.util.List;

/**
 * Live panel rows. Optional hallId / waiterUserId filters apply here only.
 */
public record DashboardLiveBlock(
    List<DashboardTableLiveRow> tables,
    List<DashboardKitchenLiveRow> kitchenQueue,
    List<DashboardRecentOrderRow> recentOrders
) {
}
