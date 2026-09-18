package com.pos.security;

import com.pos.entity.Role;
import com.pos.entity.User;

import java.util.Arrays;

/**
 * Канонические имена ролей. Любые сравнения по строке роли должны идти через этот enum,
 * чтобы при добавлении новой роли не править условия по всему коду.
 */
public enum RoleName {
    SUPER_ADMIN("SUPER_ADMIN"),
    PLATFORM_ADMIN("PLATFORM_ADMIN"),
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

    public static boolean isPlatformScope(User user) {
        return SUPER_ADMIN.matches(user) || PLATFORM_ADMIN.matches(user);
    }
}
