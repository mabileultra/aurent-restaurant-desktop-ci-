package com.pos.identity.security;

import com.pos.identity.exception.BadRequestException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class PlatformStaffRoleTest {

    @Test
    void defaultsBlankRoleToPlatformAdmin() {
        assertEquals("PLATFORM_ADMIN", PlatformStaffRole.resolveCreateRole(null));
        assertEquals("PLATFORM_ADMIN", PlatformStaffRole.resolveCreateRole(""));
        assertEquals("PLATFORM_ADMIN", PlatformStaffRole.resolveCreateRole("  "));
        assertEquals("PLATFORM_ADMIN", PlatformStaffRole.resolveCreateRole("PLATFORM_ADMIN"));
        assertEquals("PLATFORM_ADMIN", PlatformStaffRole.resolveCreateRole(" PLATFORM_ADMIN "));
    }

    @Test
    void acceptsExplicitAnalyticsAndSuperAdmin() {
        assertEquals("PLATFORM_ANALYTICS", PlatformStaffRole.resolveCreateRole("PLATFORM_ANALYTICS"));
        assertEquals("SUPER_ADMIN", PlatformStaffRole.resolveCreateRole("SUPER_ADMIN"));
    }

    @Test
    void rejectsTenantRoles() {
        assertThrows(BadRequestException.class, () -> PlatformStaffRole.resolveCreateRole("ADMIN"));
        assertThrows(BadRequestException.class, () -> PlatformStaffRole.resolveCreateRole("CASHIER"));
    }
}
