package com.pos.identity.service.auth.support;

import com.pos.identity.client.dto.CompanyDto;
import com.pos.identity.dto.auth.SpaAudience;
import com.pos.identity.entity.Role;
import com.pos.identity.entity.User;
import com.pos.identity.exception.BadRequestException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class SpaAudienceGuardTest {

    private final SpaAudienceGuard guard = new SpaAudienceGuard();

    @Test
    void pharmacyCompanyAllowedForPharmacyAudience() {
        User user = tenantUser("ADMIN");
        CompanyDto company = new CompanyDto(1, "Pharm", "PH01", true, "PHARMACY");
        assertDoesNotThrow(() -> guard.assertCreateAllowed(user, SpaAudience.PHARMACY, company));
    }

    @Test
    void groceryRejectedForPharmacyAudience() {
        User user = tenantUser("CASHIER");
        CompanyDto company = new CompanyDto(1, "Shop", "SH01", true, "GROCERY");
        assertThrows(BadRequestException.class,
            () -> guard.assertCreateAllowed(user, SpaAudience.PHARMACY, company));
    }

    @Test
    void platformRejectedForPharmacy() {
        User user = User.builder()
            .role(Role.builder().name("SUPER_ADMIN").build())
            .build();
        assertThrows(BadRequestException.class,
            () -> guard.assertCreateAllowed(user, SpaAudience.PHARMACY, null));
    }

    private static User tenantUser(String role) {
        return User.builder()
            .role(Role.builder().name(role).build())
            .companyId(1)
            .build();
    }
}
