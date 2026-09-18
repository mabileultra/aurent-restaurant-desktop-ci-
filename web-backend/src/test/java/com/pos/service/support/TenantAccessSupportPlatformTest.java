package com.pos.service.support;

import com.pos.entity.Company;
import com.pos.entity.Role;
import com.pos.entity.User;
import com.pos.exception.BadRequestException;
import com.pos.repository.CompanyRepository;
import com.pos.repository.StoreRepository;
import com.pos.security.CurrentUserProvider;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TenantAccessSupportPlatformTest {

    @Mock
    private CurrentUserProvider currentUserProvider;
    @Mock
    private CompanyRepository companyRepository;
    @Mock
    private StoreRepository storeRepository;

    @InjectMocks
    private TenantAccessSupport support;

    @Test
    void platformOperatorCanAccessAnyCompany() {
        User operator = user("PLATFORM_ADMIN");
        when(currentUserProvider.requireCurrentUser()).thenReturn(operator);
        when(currentUserProvider.isPlatformOperator(operator)).thenReturn(true);
        assertDoesNotThrow(() -> support.assertCanAccessCompany(42));
    }

    @Test
    void platformOperatorMustSupplyCompanyWhenCreating() {
        User operator = user("PLATFORM_ADMIN");
        when(currentUserProvider.requireCurrentUser()).thenReturn(operator);
        when(currentUserProvider.isPlatformOperator(operator)).thenReturn(true);
        assertThrows(BadRequestException.class, () -> support.resolveCompanyIdForCreate(null));
        assertEquals(8, support.resolveCompanyIdForCreate(8));
    }

    @Test
    void tenantUserCannotAccessOtherCompany() {
        User admin = user("ADMIN");
        admin.setCompany(Company.builder().id(4).name("Shop").loginCode("A").build());
        when(currentUserProvider.requireCurrentUser()).thenReturn(admin);
        when(currentUserProvider.isPlatformOperator(admin)).thenReturn(false);
        assertDoesNotThrow(() -> support.assertCanAccessCompany(4));
        assertThrows(BadRequestException.class, () -> support.assertCanAccessCompany(9));
    }

    private static User user(String roleName) {
        Role role = new Role();
        role.setName(roleName);
        return User.builder()
            .username("u")
            .email("u@pos.test")
            .password("hash")
            .fullName(roleName)
            .role(role)
            .isActive(true)
            .build();
    }
}
