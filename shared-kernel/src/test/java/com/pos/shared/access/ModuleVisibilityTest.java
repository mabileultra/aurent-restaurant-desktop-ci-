package com.pos.shared.access;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ModuleVisibilityTest {

    @Test
    void blankOrUniversalShowsCatalogKeys() {
        assertTrue(ModuleVisibility.visible("categories", null));
        assertTrue(ModuleVisibility.visible("restaurantPos", "  "));
        assertTrue(ModuleVisibility.visible("products", "UNIVERSAL"));
        assertTrue(ModuleVisibility.visible("cashierPos", "retail"));
        assertTrue(ModuleVisibility.visible("stockTransfers", "OTHER"));
    }

    @Test
    void blankKeyIsHidden() {
        assertFalse(ModuleVisibility.visible(null, "PHARMACY"));
        assertFalse(ModuleVisibility.visible(" ", "PHARMACY"));
    }

    @Test
    void pharmacyHidesGroceryCatalogAndRestaurantButKeepsTransfersAndCashier() {
        assertTrue(ModuleVisibility.visible("stockTransfers", "PHARMACY"));
        assertTrue(ModuleVisibility.visible("stockReceipts", "PHARMACY"));
        assertTrue(ModuleVisibility.visible("cashierPos", "pharmacy"));
        assertTrue(ModuleVisibility.visible("cashierSales", "PHARMACY"));
        assertFalse(ModuleVisibility.visible("categories", "PHARMACY"));
        assertFalse(ModuleVisibility.visible("products", "PHARMACY"));
        assertFalse(ModuleVisibility.visible("scalesStation", "PHARMACY"));
        assertFalse(ModuleVisibility.visible("scalesPlu", "PHARMACY"));
        assertFalse(ModuleVisibility.visible("restaurantFloor", "PHARMACY"));
        assertFalse(ModuleVisibility.visible("restaurantRequestBill", "PHARMACY"));
        assertFalse(ModuleVisibility.visible("restaurantPickupLabel", "PHARMACY"));
        assertFalse(ModuleVisibility.visible("restaurantCustomerDisplay", "PHARMACY"));
        assertFalse(ModuleVisibility.visible("restaurantQuickSale", "PHARMACY"));
        assertFalse(ModuleVisibility.visible("restaurantPos", "PHARMACY"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"RESTAURANT", "canteen"})
    void restaurantKeepsFloorAndCategoriesButHidesGroceryPos(String businessType) {
        assertTrue(ModuleVisibility.allowsRestaurant(businessType));
        assertTrue(ModuleVisibility.visible("restaurantFloor", businessType));
        assertTrue(ModuleVisibility.visible("restaurantPos", businessType));
        assertTrue(ModuleVisibility.visible("restaurantRequestBill", businessType));
        assertTrue(ModuleVisibility.visible("restaurantPickupLabel", businessType));
        assertTrue(ModuleVisibility.visible("restaurantCustomerDisplay", businessType));
        assertTrue(ModuleVisibility.visible("restaurantQuickSale", businessType));
        assertTrue(ModuleVisibility.visible("categories", businessType));
        assertFalse(ModuleVisibility.visible("products", businessType));
        assertFalse(ModuleVisibility.visible("scalesPlu", businessType));
        assertFalse(ModuleVisibility.visible("cashierPos", businessType));
    }

    @Test
    void clothingHidesRestaurantWorld() {
        assertFalse(ModuleVisibility.allowsRestaurant("CLOTHING"));
        assertFalse(ModuleVisibility.visible("restaurantKitchen", "CLOTHING"));
        assertFalse(ModuleVisibility.visible("restaurantRequestBill", "CLOTHING"));
        assertFalse(ModuleVisibility.visible("restaurantPickupLabel", "CLOTHING"));
        assertFalse(ModuleVisibility.visible("restaurantCustomerDisplay", "CLOTHING"));
        assertFalse(ModuleVisibility.visible("restaurantQuickSale", "CLOTHING"));
        assertFalse(ModuleVisibility.visible("restaurantPos", "CLOTHING"));
        assertTrue(ModuleVisibility.visible("products", "CLOTHING"));
        assertTrue(ModuleVisibility.visible("cashierPos", "CLOTHING"));
    }
}
