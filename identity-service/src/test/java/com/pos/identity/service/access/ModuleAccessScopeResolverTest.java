package com.pos.identity.service.access;

import com.pos.identity.client.PosCoreClient;
import com.pos.identity.client.dto.CompanyDto;
import com.pos.identity.entity.User;
import com.pos.identity.security.PlatformAdminModule;
import com.pos.identity.support.IdentityUsers;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import java.util.List;

@ExtendWith(MockitoExtension.class)
class ModuleAccessScopeResolverTest {

    @Mock
    private PosCoreClient posCoreClient;

    @InjectMocks
    private ModuleAccessScopeResolver resolver;

    @Test
    void platformAdminGetsOnlyGrantablePlatformKeysWithNoRoleDefaults() {
        User operator = IdentityUsers.user("PLATFORM_ADMIN", null);
        assertTrue(resolver.isPlatformAdmin(operator));
        assertEquals(
            PlatformAdminModule.grantable().stream().map(PlatformAdminModule::key).toList(),
            resolver.keysFor(operator)
        );
        assertFalse(resolver.roleDefault(operator, "platformCompanies"));
        assertTrue(resolver.keysFor(operator).contains("platformAccess"));
        assertFalse(resolver.keysFor(operator).contains("platformSecurity"));
        assertFalse(resolver.keysFor(operator).contains("dashboard"));
    }

    @Test
    void platformAnalyticsGetsOnlyAnalyticsWithDefaultOn() {
        User analyst = IdentityUsers.user("PLATFORM_ANALYTICS", null);
        assertFalse(resolver.isPlatformAdmin(analyst));
        assertEquals(List.of("platformAnalytics"), resolver.keysFor(analyst));
        assertTrue(resolver.roleDefault(analyst, "platformAnalytics"));
        assertFalse(resolver.roleDefault(analyst, "platformCompanies"));
    }

    @Test
    void tenantAdminKeepsCompanyDashboardDefault() {
        User admin = IdentityUsers.user("ADMIN", 4);
        when(posCoreClient.getCompanyById(4)).thenReturn(new CompanyDto(4, "Shop", "11111", true, "UNIVERSAL"));
        assertFalse(resolver.isPlatformAdmin(admin));
        assertTrue(resolver.keysFor(admin).contains("dashboard"));
        assertTrue(resolver.roleDefault(admin, "dashboard"));
        assertFalse(resolver.keysFor(admin).contains("platformCompanies"));
    }

    @Test
    void cashierScopeDoesNotIncludeAdminDashboard() {
        User cashier = IdentityUsers.user("CASHIER", 4);
        when(posCoreClient.getCompanyById(4)).thenReturn(new CompanyDto(4, "Shop", "11111", true, "UNIVERSAL"));
        assertFalse(resolver.keysFor(cashier).contains("dashboard"));
        assertTrue(resolver.keysFor(cashier).contains("cashierPos"));
    }
}
