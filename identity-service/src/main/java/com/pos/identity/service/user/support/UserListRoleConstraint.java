package com.pos.identity.service.user.support;

import org.springframework.util.StringUtils;

import java.util.List;

public final class UserListRoleConstraint {

    private UserListRoleConstraint() {
    }

    public static List<String> allowedRoles(String businessType) {
        String type = normalize(businessType);
        if (type == null || "UNIVERSAL".equals(type) || "OTHER".equals(type)) {
            return null;
        }
        if ("RESTAURANT".equals(type) || "CANTEEN".equals(type)) {
            return List.of("ADMIN", "MANAGER", "CASHIER", "WAITER", "COOK");
        }
        if ("PHARMACY".equals(type)) {
            return List.of("ADMIN", "MANAGER", "CASHIER", "ACCOUNTANT");
        }
        return List.of("ADMIN", "MANAGER", "CASHIER", "COURIER", "ACCOUNTANT");
    }

    private static String normalize(String raw) {
        if (!StringUtils.hasText(raw)) {
            return null;
        }
        String code = raw.trim().toUpperCase();
        if ("RETAIL".equals(code)) {
            return "UNIVERSAL";
        }
        return code;
    }
}
