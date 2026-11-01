package com.pos.identity.service.access.support;

import com.pos.identity.client.PosCoreClient;
import com.pos.identity.dto.access.RoleTemplateResponse;
import com.pos.identity.dto.access.UpdateRoleTemplateRequest;
import com.pos.identity.exception.BadRequestException;
import com.pos.identity.repository.RoleModuleTemplateRepository;
import com.pos.identity.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RoleTemplateSupportTest {

    @Mock
    private RoleModuleTemplateRepository roleModuleTemplateRepository;
    @Mock
    private RoleTemplateLookup roleTemplateLookup;
    @Mock
    private UserRepository userRepository;
    @Mock
    private PosCoreClient posCoreClient;

    @InjectMocks
    private RoleTemplateSupport support;

    @Test
    void getFallsBackToEnumDefaults() {
        when(roleTemplateLookup.findModules("RESTAURANT", "MANAGER")).thenReturn(Optional.empty());

        RoleTemplateResponse response = support.get("RESTAURANT", "MANAGER");

        assertEquals("DEFAULT", response.source());
        assertTrue(Boolean.TRUE.equals(response.modules().get("dashboard")));
        assertTrue(Boolean.TRUE.equals(response.modules().get("categories")));
    }

    @Test
    void putRejectsEmptyGrant() {
        assertThrows(
            BadRequestException.class,
            () -> support.put(
                "RESTAURANT",
                "MANAGER",
                new UpdateRoleTemplateRequest(Map.of("dashboard", false, "categories", false), false)
            )
        );
    }

    @Test
    void putSavesTemplateRows() {
        when(userRepository.findTenantUsersForModuleAccess(null)).thenReturn(List.of());
        when(posCoreClient.findCompanyIds(eq("RESTAURANT"), any(), any())).thenReturn(List.of(1));

        RoleTemplateResponse response = support.put(
            "restaurant",
            "manager",
            new UpdateRoleTemplateRequest(Map.of("categories", true, "dashboard", true), false)
        );

        assertEquals("TEMPLATE", response.source());
        assertEquals("RESTAURANT", response.businessType());
        assertEquals("MANAGER", response.role());
        verify(roleModuleTemplateRepository).deleteByBusinessTypeAndRoleName("RESTAURANT", "MANAGER");
        verify(roleModuleTemplateRepository).saveAll(any());
    }
}
