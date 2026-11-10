package com.pos.identity.service.access.support;

import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Known business-type → role pairs for Access V2 templates (mirrors frontend rolesByBusinessType).
 */
public final class RoleTemplateMatrix {

    public static final String PLATFORM_STAFF = "PLATFORM_STAFF";

    private static final List<String> PLATFORM_STAFF_ROLES = List.of(
        "PLATFORM_ADMIN",
        "PLATFORM_ANALYTICS"
    );

    private static final List<String> RESTAURANT_ROLES = List.of(
        "ADMIN", "MANAGER", "CASHIER", "WAITER", "COOK"
    );

    private static final List<String> PHARMACY_ROLES = List.of(
        "ADMIN", "MANAGER", "CASHIER", "ACCOUNTANT"
    );

    private static final List<String> RETAIL_ROLES = List.of(
        "ADMIN", "MANAGER", "CASHIER", "COURIER", "ACCOUNTANT"
    );

    private static final List<String> COMPANY_ROLES = List.of(
        "ADMIN", "MANAGER", "CASHIER", "WAITER", "COURIER", "COOK", "ACCOUNTANT"
    );

    private static final Set<String> RESTAURANT_TYPES = Set.of("RESTAURANT", "CANTEEN");

    private RoleTemplateMatrix() {
    }

    public static List<String> rolesFor(String businessType) {
        if (!hasText(businessType)) {
            return COMPANY_ROLES;
        }
        String code = businessType.trim().toUpperCase(Locale.ROOT);
        if (PLATFORM_STAFF.equals(code)) {
            return PLATFORM_STAFF_ROLES;
        }
        if (RESTAURANT_TYPES.contains(code)) {
            return RESTAURANT_ROLES;
        }
        if ("PHARMACY".equals(code)) {
            return PHARMACY_ROLES;
        }
        if ("UNIVERSAL".equals(code) || "OTHER".equals(code)) {
            return COMPANY_ROLES;
        }
        return RETAIL_ROLES;
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
