package com.pos.restaurant.config;

/** Spring bean names for restaurant async executors. */
public final class RestaurantExecutorNames {

    public static final String DASHBOARD = "dashboardExecutor";
    public static final String REVENUE_OUTBOX = "restaurantRevenueOutboxExecutor";

    private RestaurantExecutorNames() {
    }
}
