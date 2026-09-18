package com.pos.identity.service.auth.support;

import com.pos.identity.client.dto.CompanyDto;
import com.pos.identity.entity.Role;
import com.pos.identity.entity.User;
import com.pos.identity.exception.BadRequestException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class LoginGuardTest {

    private final LoginGuard guard = new LoginGuard();

    @Test
    void allowsPlatformAdminWithoutCompany() {
        User user = user("PLATFORM_ADMIN", null, true);
        assertDoesNotThrow(() -> guard.assertAllowed(user, null));
    }

    @Test
    void rejectsPlatformAdminLinkedToCompany() {
        User user = user("PLATFORM_ADMIN", 12, true);
        assertThrows(BadRequestException.class, () -> guard.assertAllowed(user, company(true)));
    }

    @Test
    void rejectsTenantUserWithoutCompany() {
        User user = user("ADMIN", null, true);
        assertThrows(BadRequestException.class, () -> guard.assertAllowed(user, null));
    }

    @Test
    void allowsSuperAdminWithoutCompany() {
        assertDoesNotThrow(() -> guard.assertAllowed(user("SUPER_ADMIN", null, true), null));
    }

    @Test
    void rejectsSuperAdminLinkedToCompany() {
        assertThrows(BadRequestException.class, () -> guard.assertAllowed(user("SUPER_ADMIN", 12, true), company(true)));
    }

    @Test
    void allowsTenantUserInActiveCompany() {
        assertDoesNotThrow(() -> guard.assertAllowed(user("ADMIN", 1, true), company(true)));
    }

    @Test
    void rejectsTenantUserInInactiveCompany() {
        assertThrows(BadRequestException.class, () -> guard.assertAllowed(user("ADMIN", 1, true), company(false)));
    }

    @Test
    void rejectsDisabledUser() {
        assertThrows(BadRequestException.class, () -> guard.assertAllowed(user("PLATFORM_ADMIN", null, false), null));
        assertThrows(BadRequestException.class, () -> guard.assertAllowed(user("ADMIN", 1, false), company(true)));
    }

    private static User user(String roleName, Integer companyId, boolean active) {
        Role role = new Role();
        role.setName(roleName);
        return User.builder()
            .username("op")
            .role(role)
            .companyId(companyId)
            .isActive(active)
            .build();
    }

    private static CompanyDto company(boolean active) {
        return new CompanyDto(1, "A", "A", active, "UNIVERSAL");
    }
}
