package com.pos.shared.access;

import java.util.Set;

/**
 * Какие ключи модулей видны компании данного типа бизнеса.
 * UNIVERSAL / OTHER и пустой тип показывают весь каталог.
 */
public final class ModuleVisibility {

    public static final String RESTAURANT_REQUEST_BILL = "restaurantRequestBill";
    public static final String RESTAURANT_PICKUP_LABEL = "restaurantPickupLabel";
    public static final String RESTAURANT_CUSTOMER_DISPLAY = "restaurantCustomerDisplay";
    public static final String RESTAURANT_QUICK_SALE = "restaurantQuickSale";

    private static final Set<String> RESTAURANT_KEYS = Set.of(
        "restaurantFloor",
        "restaurantBooking",
        "restaurantDelivery",
        "restaurantKitchen",
        "restaurantPos",
        RESTAURANT_REQUEST_BILL,
        RESTAURANT_PICKUP_LABEL,
        RESTAURANT_CUSTOMER_DISPLAY,
        RESTAURANT_QUICK_SALE
    );

    private static final Set<String> GROCERY_CATALOG_KEYS = Set.of(
        "products",
        "categories",
        "scalesStation",
        "scalesPlu"
    );

    private ModuleVisibility() {
    }

    public static boolean visible(String moduleKey, String businessType) {
        if (moduleKey == null || moduleKey.isBlank()) {
            return false;
        }
        String code = normalize(businessType);
        if (code == null || "UNIVERSAL".equals(code) || "OTHER".equals(code)) {
            return true;
        }
        if ("PHARMACY".equals(code)) {
            return !RESTAURANT_KEYS.contains(moduleKey) && !GROCERY_CATALOG_KEYS.contains(moduleKey);
        }
        if ("RESTAURANT".equals(code) || "CANTEEN".equals(code)) {
            if ("categories".equals(moduleKey)) {
                return true;
            }
            return !GROCERY_CATALOG_KEYS.contains(moduleKey) && !"cashierPos".equals(moduleKey);
        }
        return !RESTAURANT_KEYS.contains(moduleKey);
    }

    public static boolean allowsRestaurant(String businessType) {
        String code = normalize(businessType);
        return code == null
            || "UNIVERSAL".equals(code)
            || "OTHER".equals(code)
            || "RESTAURANT".equals(code)
            || "CANTEEN".equals(code);
    }

    static String normalize(String businessType) {
        if (businessType == null || businessType.isBlank()) {
            return null;
        }
        String code = businessType.trim().toUpperCase();
        return "RETAIL".equals(code) ? "UNIVERSAL" : code;
    }
}
