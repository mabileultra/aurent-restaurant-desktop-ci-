package com.pos.identity.service.access.support;

import com.pos.identity.client.PosCoreClient;
import com.pos.identity.client.dto.CompanyDirectoryItem;
import com.pos.identity.dto.access.UserModuleAccessSummary;
import com.pos.identity.dto.shared.PageResponse;
import com.pos.identity.entity.User;
import com.pos.identity.repository.UserRepository;
import com.pos.identity.service.support.TenantAccessSupport;
import com.pos.identity.support.IdentityUsers;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ModuleAccessUsersPagerBusinessTypeTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PosCoreClient posCoreClient;
    @Mock
    private TenantAccessSupport tenantAccess;

    @InjectMocks
    private ModuleAccessUsersPager pager;

    @Test
    void businessTypeFilterDoesNotMixPlatformOperators() {
        User cashier = IdentityUsers.user("CASHIER", 1);
        when(userRepository.findTenantUsersForModuleAccess(null)).thenReturn(List.of(cashier));
        when(posCoreClient.findCompanyIds(eq("RESTAURANT"), any(), any())).thenReturn(List.of(1));
        when(posCoreClient.findCompaniesByIds(anyList())).thenReturn(List.of(
            new CompanyDirectoryItem(1, "Rayhon", "r1", null, null, "RESTAURANT")
        ));

        PageResponse<UserModuleAccessSummary> page = pager.page(
            null, false, null, "all", "RESTAURANT", null, PageRequest.of(0, 50)
        );

        assertEquals(1, page.content().size());
        assertEquals("CASHIER", page.content().get(0).role());
    }

    @Test
    void platformStaffFilterReturnsOnlyOperators() {
        User operator = IdentityUsers.user(UUID.randomUUID(), "PLATFORM_ADMIN", null, false);
        when(tenantAccess.isSuperAdmin()).thenReturn(true);
        when(userRepository.findPlatformOperatorsForModuleAccess()).thenReturn(List.of(operator));

        PageResponse<UserModuleAccessSummary> page = pager.page(
            null, false, null, "all", "PLATFORM_STAFF", null, PageRequest.of(0, 50)
        );

        assertEquals(1, page.content().size());
        assertEquals("PLATFORM_ADMIN", page.content().get(0).role());
    }
}
