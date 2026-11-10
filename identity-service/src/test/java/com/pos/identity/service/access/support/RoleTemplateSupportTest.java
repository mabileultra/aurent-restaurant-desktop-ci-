package com.pos.identity.service.access.support;

import com.pos.identity.client.PosCoreClient;
import com.pos.identity.dto.access.RoleTemplateResponse;
import com.pos.identity.dto.access.UpdateRoleTemplateRequest;
import com.pos.identity.entity.User;
import com.pos.identity.exception.BadRequestException;
import com.pos.identity.repository.RoleModuleTemplateRepository;
import com.pos.identity.repository.UserRepository;
import com.pos.identity.support.IdentityUsers;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
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
import static org.mockito.ArgumentMatchers.anyMap;
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
    @Mock
    private ModuleAccessHistoryWriter historyWriter;

    @InjectMocks
    private RoleTemplateSupport support;

    @Test
    void getFallsBackToEnumDefaultsAndCountsAffected() {
        when(roleTemplateLookup.findModules("RESTAURANT", "MANAGER")).thenReturn(Optional.empty());
        when(posCoreClient.findCompanyIds(eq("RESTAURANT"), any(), any())).thenReturn(List.of(1));
        User manager = IdentityUsers.user("MANAGER", 1);
        User custom = IdentityUsers.user(java.util.UUID.randomUUID(), "MANAGER", 1, true);
        when(userRepository.findTenantUsersForModuleAccess(null)).thenReturn(List.of(manager, custom));

        RoleTemplateResponse response = support.get("RESTAURANT", "MANAGER");

        assertEquals("DEFAULT", response.source());
        assertEquals(1, response.affectedCount());
        assertTrue(Boolean.TRUE.equals(response.modules().get("dashboard")));
        assertTrue(Boolean.TRUE.equals(response.modules().get("categories")));
    }

    @Test
    void putRejectsEmptyGrant() {
        when(roleTemplateLookup.findModules("RESTAURANT", "MANAGER")).thenReturn(Optional.empty());
        BadRequestException ex = assertThrows(
            BadRequestException.class,
            () -> support.put(
                "RESTAURANT",
                "MANAGER",
                new UpdateRoleTemplateRequest(Map.of("dashboard", false, "categories", false), false)
            )
        );
        assertEquals("Включите хотя бы один модуль", ex.getMessage());
    }

    @Test
    void putRejectsOutOfScopeModuleEvenWhenDisabled() {
        when(roleTemplateLookup.findModules("RESTAURANT", "COOK")).thenReturn(Optional.empty());
        BadRequestException ex = assertThrows(
            BadRequestException.class,
            () -> support.put(
                "RESTAURANT",
                "COOK",
                new UpdateRoleTemplateRequest(Map.of("restaurantKitchen", true, "categories", false), false)
            )
        );
        assertTrue(ex.getMessage().contains("Модуль не входит в область роли"));
    }

    @Test
    void putSavesTemplateRowsAndWritesHistory() {
        when(roleTemplateLookup.findModules("RESTAURANT", "MANAGER")).thenReturn(Optional.empty());
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
        verify(historyWriter).writeTemplate(eq("RESTAURANT"), eq("MANAGER"), anyMap(), anyMap());
    }
}
