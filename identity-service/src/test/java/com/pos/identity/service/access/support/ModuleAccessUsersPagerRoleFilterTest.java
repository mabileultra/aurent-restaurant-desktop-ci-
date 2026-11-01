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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ModuleAccessUsersPagerRoleFilterTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PosCoreClient posCoreClient;
    @Mock
    private TenantAccessSupport tenantAccess;

    @InjectMocks
    private ModuleAccessUsersPager pager;

    @Test
    void filtersUsersByRole() {
        User cashier = IdentityUsers.user("CASHIER", 1);
        User manager = IdentityUsers.user("MANAGER", 1);
        when(tenantAccess.isSuperAdmin()).thenReturn(false);
        when(userRepository.findTenantUsersForModuleAccess(null)).thenReturn(List.of(cashier, manager));
        when(posCoreClient.findCompaniesByIds(anyList())).thenReturn(List.of(
            new CompanyDirectoryItem(1, "Rayhon", "r1", null, null, "RESTAURANT")
        ));

        PageResponse<UserModuleAccessSummary> page = pager.page(
            null, false, null, "all", null, "CASHIER", PageRequest.of(0, 50)
        );

        assertEquals(1, page.content().size());
        assertEquals("CASHIER", page.content().get(0).role());
    }
}
