package com.pos.restaurant.config;

/**
 * Shared Spring Cache names for Caffeine and Redis managers.
 */
public final class RestaurantCacheNames {

    public static final String MENU = "rstMenu";
    public static final String FLOOR = "rstFloor";
    public static final String KITCHEN_BOARD = "rstKitchenBoard";
    public static final String FOREIGN_TABLE_ORDERS = "rstForeignTableOrders";

    private RestaurantCacheNames() {
    }
}
