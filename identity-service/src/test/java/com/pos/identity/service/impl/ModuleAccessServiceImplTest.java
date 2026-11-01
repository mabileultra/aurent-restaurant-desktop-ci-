package com.pos.identity.service.impl;

import com.pos.identity.client.PosCoreClient;
import com.pos.identity.client.dto.CompanyDto;
import com.pos.identity.dto.access.UpdateUserModuleAccessRequest;
import com.pos.identity.dto.access.UserModuleAccessSummary;
import com.pos.identity.dto.shared.PageResponse;
import com.pos.identity.entity.User;
import com.pos.identity.entity.UserModuleAccess;
import com.pos.identity.entity.UserModuleAccessId;
import com.pos.identity.exception.BadRequestException;
import com.pos.identity.repository.UserModuleAccessRepository;
import com.pos.identity.repository.UserRepository;
import com.pos.identity.security.PlatformAdminModule;
import com.pos.identity.service.access.ModuleAccessCatalog;
import com.pos.identity.service.access.ModuleAccessScopeResolver;
import com.pos.identity.service.access.ModuleAccessUserGate;
import com.pos.identity.service.access.support.ModuleAccessUsersPager;
import com.pos.identity.support.IdentityUsers;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ModuleAccessServiceImplTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private UserModuleAccessRepository userModuleAccessRepository;
    @Mock
    private PosCoreClient posCoreClient;
    @Mock
    private ModuleAccessUserGate moduleAccessUserGate;
    @Mock
    private ModuleAccessUsersPager moduleAccessUsersPager;

    private ModuleAccessServiceImpl service;

    @BeforeEach
    void setUp() {
        ModuleAccessCatalog catalog = new ModuleAccessCatalog();
        ModuleAccessScopeResolver scopeResolver = new ModuleAccessScopeResolver(posCoreClient);
        service = new ModuleAccessServiceImpl(
            userRepository,
            userModuleAccessRepository,
            catalog,
            moduleAccessUserGate,
            scopeResolver,
            moduleAccessUsersPager
        );
    }

    @Test
    void platformAdminWithoutCustomAccessHasNoModules() {
        User operator = IdentityUsers.user("PLATFORM_ADMIN", null);
        assertTrue(service.resolveAllowedModuleIds(operator).isEmpty());
    }

    @Test
    void platformAdminCustomAccessReturnsOnlyGrantedKeys() {
        UUID id = UUID.randomUUID();
        User operator = IdentityUsers.user(id, "PLATFORM_ADMIN", null, true);
        when(userModuleAccessRepository.findByIdUserId(id)).thenReturn(List.of(
            row(id, "platformCompanies", true),
            row(id, "platformBilling", false)
        ));
        assertEquals(List.of("platformCompanies"), service.resolveAllowedModuleIds(operator));
    }

    @Test
    void superAdminDoesNotReceiveEmptyOperatorDefaults() {
        User superAdmin = IdentityUsers.user("SUPER_ADMIN", null);
        List<String> allowed = service.resolveAllowedModuleIds(superAdmin);
        assertTrue(allowed.contains("dashboard"));
        assertTrue(allowed.size() > PlatformAdminModule.grantable().size());
    }

    @Test
    void updateRejectsEmptyGrantSet() {
        UUID id = UUID.randomUUID();
        User operator = IdentityUsers.user(id, "PLATFORM_ADMIN", null);
        when(moduleAccessUserGate.requireConfigurable(id)).thenReturn(operator);
        assertThrows(
            BadRequestException.class,
            () -> service.updateUserAccess(id, new UpdateUserModuleAccessRequest(true, Map.of()))
        );
        verify(userRepository, never()).save(any());
        verify(userModuleAccessRepository, never()).saveAll(any());
    }

    @Test
    void listUsersIncludesOperatorsOnlyForSuperAdmin() {
        UserModuleAccessSummary tenant = summary("ADMIN");
        UserModuleAccessSummary operator = summary("PLATFORM_ADMIN");
        when(moduleAccessUsersPager.page(
            isNull(), eq(false), isNull(), eq("all"), isNull(), any(Pageable.class)
        )).thenReturn(PageResponse.slice(List.of(operator, tenant), Pageable.unpaged()));

        List<UserModuleAccessSummary> all = service.listUsers(null);
        assertEquals(List.of("PLATFORM_ADMIN", "ADMIN"), all.stream().map(UserModuleAccessSummary::role).toList());
    }

    @Test
    void listUsersHidesOperatorsForPlatformAdminActor() {
        UserModuleAccessSummary tenant = summary("ADMIN");
        when(moduleAccessUsersPager.page(
            isNull(), eq(false), isNull(), eq("all"), isNull(), any(Pageable.class)
        )).thenReturn(PageResponse.slice(List.of(tenant), Pageable.unpaged()));

        List<UserModuleAccessSummary> all = service.listUsers(null);
        assertEquals(List.of("ADMIN"), all.stream().map(UserModuleAccessSummary::role).toList());
    }

    @Test
    void listUsersSkipsOperatorsWhenCompanyFilterIsSet() {
        UserModuleAccessSummary tenant = summary("ADMIN");
        when(moduleAccessUsersPager.page(
            eq(9), eq(false), isNull(), eq("all"), isNull(), any(Pageable.class)
        )).thenReturn(PageResponse.slice(List.of(tenant), Pageable.unpaged()));

        List<UserModuleAccessSummary> companyOnly = service.listUsers(9);
        assertEquals(List.of("ADMIN"), companyOnly.stream().map(UserModuleAccessSummary::role).toList());
    }

    @Test
    void resetClearsCustomAccess() {
        UUID id = UUID.randomUUID();
        User operator = IdentityUsers.user(id, "PLATFORM_ADMIN", null, true);
        when(moduleAccessUserGate.requireConfigurable(id)).thenReturn(operator);
        when(userRepository.save(operator)).thenReturn(operator);

        var detail = service.resetUserAccess(id);
        assertTrue(service.resolveAllowedModuleIds(operator).isEmpty());
        assertEquals("PLATFORM_ADMIN", detail.role());
        verify(userModuleAccessRepository).deleteByUserId(id);
    }

    @Test
    void catalogStartsWithGrantablePlatformModules() {
        assertEquals("platformCompanies", service.catalog().get(0).id());
        assertEquals("platform", service.catalog().get(0).group());
    }

    @Test
    void updateSavesGrantedPlatformModulesAndIgnoresUnknownKeys() {
        UUID id = UUID.randomUUID();
        User operator = IdentityUsers.user(id, "PLATFORM_ADMIN", null);
        when(moduleAccessUserGate.requireConfigurable(id)).thenReturn(operator);
        when(userRepository.save(operator)).thenReturn(operator);
        when(userRepository.findById(id)).thenReturn(Optional.of(operator));

        service.updateUserAccess(id, new UpdateUserModuleAccessRequest(
            true,
            Map.of("platformCompanies", true, "dashboard", true, "platformBilling", false)
        ));

        ArgumentCaptor<List<UserModuleAccess>> captor = ArgumentCaptor.forClass(List.class);
        verify(userModuleAccessRepository).saveAll(captor.capture());
        List<UserModuleAccess> saved = captor.getValue();
        assertTrue(saved.stream().anyMatch(row -> "platformCompanies".equals(row.getModuleKey()) && row.isAllowed()));
        assertTrue(saved.stream().noneMatch(row -> "dashboard".equals(row.getModuleKey())));
        assertTrue(saved.stream().anyMatch(row -> "platformBilling".equals(row.getModuleKey()) && !row.isAllowed()));
        assertTrue(operator.isModuleAccessCustom());
    }

    @Test
    void tenantCustomAccessKeepsRoleDefaultsForMissingKeys() {
        UUID id = UUID.randomUUID();
        User admin = IdentityUsers.user(id, "ADMIN", 4, true);
        when(posCoreClient.getCompanyById(4)).thenReturn(new CompanyDto(4, "Shop", "11111", true, "UNIVERSAL"));
        when(userModuleAccessRepository.findByIdUserId(id)).thenReturn(List.of(row(id, "dashboard", false)));

        List<String> allowed = service.resolveAllowedModuleIds(admin);
        assertTrue(allowed.stream().noneMatch("dashboard"::equals));
        assertTrue(allowed.contains("products"));
    }

    private static UserModuleAccessSummary summary(String role) {
        return new UserModuleAccessSummary(
            UUID.randomUUID(),
            "user",
            "User",
            role,
            null,
            null,
            false,
            Instant.parse("2026-01-01T00:00:00Z")
        );
    }

    private static UserModuleAccess row(UUID userId, String key, boolean allowed) {
        return UserModuleAccess.builder()
            .id(new UserModuleAccessId(userId, key))
            .allowed(allowed)
            .build();
    }
}
