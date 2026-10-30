package com.pos.identity.service.user.support;

import org.springframework.util.StringUtils;

import java.util.List;

public final class UserListRoleGroups {

    public static final List<String> MANAGEMENT = List.of(
        "ADMIN",
        "MANAGER",
        "SUPER_ADMIN",
        "PLATFORM_ADMIN",
        "PLATFORM_ANALYTICS"
    );

    public static final List<String> STAFF = List.of(
        "CASHIER",
        "WAITER",
        "COOK",
        "COURIER",
        "ACCOUNTANT"
    );

    private UserListRoleGroups() {
    }

    public static List<String> resolve(String roleFilter) {
        if (!StringUtils.hasText(roleFilter) || "ALL".equalsIgnoreCase(roleFilter.trim())) {
            return null;
        }
        String code = roleFilter.trim().toUpperCase();
        if ("MANAGEMENT".equals(code)) {
            return MANAGEMENT;
        }
        if ("STAFF".equals(code)) {
            return STAFF;
        }
        return List.of(code);
    }
}
