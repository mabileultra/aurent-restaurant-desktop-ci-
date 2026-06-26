package com.pos.identity.security;

import com.pos.identity.entity.Role;
import com.pos.identity.entity.User;

import java.util.Arrays;

public enum RoleName {
    SUPER_ADMIN("SUPER_ADMIN"),
    TENANT_ADMIN("ADMIN"),
    MANAGER("MANAGER"),
    CASHIER("CASHIER"),
    WAITER("WAITER"),
    COURIER("COURIER"),
    COOK("COOK"),
    ACCOUNTANT("ACCOUNTANT");

    private final String key;

    RoleName(String key) {
        this.key = key;
    }

    public String key() {
        return key;
    }

    public boolean matches(String roleName) {
        return key.equals(roleName);
    }

    public boolean matches(Role role) {
        return role != null && key.equals(role.getName());
    }

    public boolean matches(User user) {
        return user != null && matches(user.getRole());
    }

    public static RoleName fromKey(String key) {
        return Arrays.stream(values())
            .filter(r -> r.key.equals(key))
            .findFirst()
            .orElse(null);
    }
}
