package com.pos.identity.security;

import com.pos.identity.support.IdentityUsers;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RoleNameTest {

    @Test
    void platformScopeCoversSuperAdminAndOperatorOnly() {
        assertTrue(RoleName.isPlatformScope("SUPER_ADMIN"));
        assertTrue(RoleName.isPlatformScope("PLATFORM_ADMIN"));
        assertFalse(RoleName.isPlatformScope("ADMIN"));
        assertFalse(RoleName.isPlatformScope("MANAGER"));
        assertFalse(RoleName.isPlatformScope((String) null));
        assertFalse(RoleName.isPlatformScope(""));
    }

    @Test
    void platformScopeReadsUserRole() {
        assertTrue(RoleName.isPlatformScope(IdentityUsers.user("SUPER_ADMIN", null)));
        assertTrue(RoleName.isPlatformScope(IdentityUsers.user("PLATFORM_ADMIN", null)));
        assertFalse(RoleName.isPlatformScope(IdentityUsers.user("ADMIN", 1)));
        assertFalse(RoleName.isPlatformScope((com.pos.identity.entity.User) null));
    }

    @Test
    void fromKeyResolvesCanonicalRoles() {
        assertEquals(RoleName.PLATFORM_ADMIN, RoleName.fromKey("PLATFORM_ADMIN"));
        assertEquals(RoleName.SUPER_ADMIN, RoleName.fromKey("SUPER_ADMIN"));
        assertEquals(RoleName.TENANT_ADMIN, RoleName.fromKey("ADMIN"));
        assertNull(RoleName.fromKey("unknown"));
        assertNull(RoleName.fromKey(null));
    }
}
