package com.pos.security;

import com.pos.entity.Role;
import com.pos.entity.User;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RoleNamePlatformScopeTest {

    @Test
    void platformScopeMatchesSuperAdminAndOperator() {
        assertTrue(RoleName.isPlatformScope(user("SUPER_ADMIN")));
        assertTrue(RoleName.isPlatformScope(user("PLATFORM_ADMIN")));
        assertFalse(RoleName.isPlatformScope(user("ADMIN")));
        assertFalse(RoleName.isPlatformScope(user("CASHIER")));
        assertFalse(RoleName.isPlatformScope(null));
        assertTrue(RoleName.PLATFORM_ADMIN.matches("PLATFORM_ADMIN"));
        assertFalse(RoleName.SUPER_ADMIN.matches("PLATFORM_ADMIN"));
    }

    private static User user(String roleName) {
        Role role = new Role();
        role.setName(roleName);
        return User.builder().role(role).build();
    }
}
