package com.pos.identity.service.access.support;

import com.pos.identity.client.PosCoreClient;
import com.pos.identity.client.dto.CompanyDirectoryItem;
import com.pos.identity.dto.access.ModuleAccessStatsResponse;
import com.pos.identity.entity.User;
import com.pos.identity.repository.UserRepository;
import com.pos.identity.service.support.TenantAccessSupport;
import com.pos.identity.support.IdentityUsers;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ModuleAccessStatsSupportTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PosCoreClient posCoreClient;
    @Mock
    private TenantAccessSupport tenantAccess;

    @InjectMocks
    private ModuleAccessStatsSupport support;

    @Test
    void aggregatesByBusinessTypeAndRole() {
        User cashier = IdentityUsers.user("CASHIER", 1);
        User managerCustom = IdentityUsers.user(UUID.randomUUID(), "MANAGER", 1, true);
        User pharmacyAdmin = IdentityUsers.user("ADMIN", 2);

        when(userRepository.findTenantUsersForModuleAccess(null))
            .thenReturn(List.of(cashier, managerCustom, pharmacyAdmin));
        when(posCoreClient.findCompaniesByIds(anyList())).thenReturn(List.of(
            new CompanyDirectoryItem(1, "Rayhon", "r1", null, null, "RESTAURANT"),
            new CompanyDirectoryItem(2, "Apteka", "a1", null, null, "PHARMACY")
        ));
        when(tenantAccess.isSuperAdmin()).thenReturn(false);

        ModuleAccessStatsResponse stats = support.build(null);

        assertEquals(2, stats.businessTypes().size());
        var restaurant = stats.businessTypes().stream()
            .filter(b -> "RESTAURANT".equals(b.code()))
            .findFirst()
            .orElseThrow();
        assertEquals(2, restaurant.totalEmployees());
        assertEquals(1, restaurant.exceptionCount());
        assertEquals(2, restaurant.roles().size());
    }

    @Test
    void filtersByBusinessType() {
        User cashier = IdentityUsers.user("CASHIER", 1);
        User pharmacyAdmin = IdentityUsers.user("ADMIN", 2);
        when(userRepository.findTenantUsersForModuleAccess(null))
            .thenReturn(List.of(cashier, pharmacyAdmin));
        when(posCoreClient.findCompaniesByIds(anyList())).thenReturn(List.of(
            new CompanyDirectoryItem(1, "Rayhon", "r1", null, null, "RESTAURANT"),
            new CompanyDirectoryItem(2, "Apteka", "a1", null, null, "PHARMACY")
        ));

        ModuleAccessStatsResponse stats = support.build("RESTAURANT");

        assertEquals(1, stats.businessTypes().size());
        assertEquals("RESTAURANT", stats.businessTypes().get(0).code());
        assertEquals(1, stats.businessTypes().get(0).totalEmployees());
    }
}
