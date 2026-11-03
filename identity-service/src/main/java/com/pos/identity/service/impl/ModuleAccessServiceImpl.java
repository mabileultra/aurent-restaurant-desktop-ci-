package com.pos.identity.service.impl;

import com.pos.identity.dto.access.AdminModuleCatalogItem;
import com.pos.identity.dto.access.BulkResetModuleAccessRequest;
import com.pos.identity.dto.access.CopyModuleAccessRequest;
import com.pos.identity.dto.access.ModuleAccessHistoryItem;
import com.pos.identity.dto.access.ModuleAccessMutationResponse;
import com.pos.identity.dto.access.ModuleAccessStatsResponse;
import com.pos.identity.dto.access.RoleTemplateResponse;
import com.pos.identity.dto.access.UpdateRoleTemplateRequest;
import com.pos.identity.dto.access.UpdateUserModuleAccessRequest;
import com.pos.identity.dto.access.UserModuleAccessDetailResponse;
import com.pos.identity.dto.access.UserModuleAccessRow;
import com.pos.identity.dto.access.UserModuleAccessSummary;
import com.pos.identity.dto.shared.PageResponse;
import com.pos.identity.entity.User;
import com.pos.identity.security.RoleName;
import com.pos.identity.service.ModuleAccessService;
import com.pos.identity.service.access.ModuleAccessCatalog;
import com.pos.identity.service.access.ModuleAccessScopeResolver;
import com.pos.identity.service.access.ModuleAccessUserGate;
import com.pos.identity.service.access.support.ModuleAccessMutationSupport;
import com.pos.identity.service.access.support.ModuleAccessHistoryWriter;
import com.pos.identity.service.access.support.ModuleAccessSnapshotSupport;
import com.pos.identity.service.access.support.ModuleAccessStatsSupport;
import com.pos.identity.service.access.support.ModuleAccessUsersPager;
import com.pos.identity.service.access.support.RoleTemplateSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ModuleAccessServiceImpl implements ModuleAccessService {

    private final ModuleAccessCatalog moduleAccessCatalog;
    private final ModuleAccessUserGate moduleAccessUserGate;
    private final ModuleAccessScopeResolver scopeResolver;
    private final ModuleAccessUsersPager moduleAccessUsersPager;
    private final ModuleAccessStatsSupport moduleAccessStatsSupport;
    private final RoleTemplateSupport roleTemplateSupport;
    private final ModuleAccessSnapshotSupport snapshotSupport;
    private final ModuleAccessHistoryWriter historyWriter;
    private final ModuleAccessMutationSupport mutationSupport;

    @Override
    public List<AdminModuleCatalogItem> catalog() {
        return moduleAccessCatalog.allItems();
    }

    @Override
    public List<UserModuleAccessSummary> listUsers(Integer companyId) {
        return listUsersPaged(companyId, false, null, "all", null, null, Pageable.unpaged()).content();
    }

    @Override
    public PageResponse<UserModuleAccessSummary> listUsersPaged(
        Integer companyId,
        boolean platformOnly,
        String search,
        String accessFilter,
        String businessType,
        String role,
        Pageable pageable
    ) {
        return moduleAccessUsersPager.page(
            companyId, platformOnly, search, accessFilter, businessType, role, pageable
        );
    }

    @Override
    public ModuleAccessStatsResponse stats(String businessType) {
        return moduleAccessStatsSupport.build(businessType);
    }

    @Override
    public RoleTemplateResponse getRoleTemplate(String businessType, String role) {
        return roleTemplateSupport.get(businessType, role);
    }

    @Override
    @Transactional(readOnly = false)
    public RoleTemplateResponse updateRoleTemplate(
        String businessType,
        String role,
        UpdateRoleTemplateRequest request
    ) {
        return roleTemplateSupport.put(businessType, role, request);
    }

    @Override
    public UserModuleAccessDetailResponse getUserAccess(UUID userId) {
        return buildDetail(moduleAccessUserGate.requireConfigurable(userId));
    }

    @Override
    @Transactional(readOnly = false)
    public UserModuleAccessDetailResponse updateUserAccess(UUID userId, UpdateUserModuleAccessRequest request) {
        User user = moduleAccessUserGate.requireConfigurable(userId);
        if (Boolean.FALSE.equals(request.customAccess())) {
            return resetUserAccess(userId);
        }

        boolean beforeCustom = user.isModuleAccessCustom();
        Map<String, Boolean> before = snapshotSupport.effectiveModules(user);
        snapshotSupport.applyCustomModules(user, request.modules());
        Map<String, Boolean> after = snapshotSupport.effectiveModules(user);
        historyWriter.write("UPDATE", user, null, beforeCustom, true, before, after);
        return buildDetail(moduleAccessUserGate.requireConfigurable(userId));
    }

    @Override
    @Transactional(readOnly = false)
    public UserModuleAccessDetailResponse resetUserAccess(UUID userId) {
        User user = moduleAccessUserGate.requireConfigurable(userId);
        boolean beforeCustom = user.isModuleAccessCustom();
        Map<String, Boolean> before = snapshotSupport.effectiveModules(user);
        snapshotSupport.resetToTemplate(user);
        Map<String, Boolean> after = snapshotSupport.effectiveModules(user);
        historyWriter.write("RESET", user, null, beforeCustom, false, before, after);
        return buildDetail(user);
    }

    @Override
    @Transactional(readOnly = false)
    public ModuleAccessMutationResponse copyAccess(CopyModuleAccessRequest request) {
        return mutationSupport.copy(request);
    }

    @Override
    @Transactional(readOnly = false)
    public ModuleAccessMutationResponse bulkResetAccess(BulkResetModuleAccessRequest request) {
        return mutationSupport.bulkReset(request);
    }

    @Override
    public PageResponse<ModuleAccessHistoryItem> history(UUID targetUserId, Pageable pageable) {
        return mutationSupport.history(targetUserId, pageable);
    }

    @Override
    @Transactional(readOnly = false)
    public ModuleAccessHistoryItem revertHistory(UUID historyId) {
        return mutationSupport.revert(historyId);
    }

    @Override
    public List<String> resolveAllowedModuleIds(User user) {
        if (user == null || user.getRole() == null) {
            return List.of();
        }
        if (RoleName.SUPER_ADMIN.matches(user)) {
            return scopeResolver.keysFor(user).stream().sorted().toList();
        }
        if (RoleName.PLATFORM_ADMIN.matches(user)) {
            return resolveStoredOrEmpty(user);
        }

        List<String> scope = scopeResolver.keysFor(user);
        if (!user.isModuleAccessCustom()) {
            return scope.stream()
                .filter(key -> scopeResolver.roleDefault(user, key))
                .sorted()
                .toList();
        }

        Map<String, Boolean> stored = snapshotSupport.storedAccess(user.getId());
        return scope.stream()
            .filter(key -> moduleAllowedForCustomAccess(user, key, stored))
            .sorted()
            .toList();
    }

    private List<String> resolveStoredOrEmpty(User user) {
        if (!user.isModuleAccessCustom()) {
            return List.of();
        }
        Map<String, Boolean> stored = snapshotSupport.storedAccess(user.getId());
        return scopeResolver.keysFor(user).stream()
            .filter(key -> Boolean.TRUE.equals(stored.get(key)))
            .sorted()
            .toList();
    }

    private boolean moduleAllowedForCustomAccess(User user, String moduleKey, Map<String, Boolean> stored) {
        if (!stored.containsKey(moduleKey)) {
            return scopeResolver.roleDefault(user, moduleKey);
        }
        return Boolean.TRUE.equals(stored.get(moduleKey));
    }

    private UserModuleAccessDetailResponse buildDetail(User user) {
        String role = user.getRole().getName();
        List<String> scope = scopeResolver.keysFor(user);
        Map<String, Boolean> stored = user.isModuleAccessCustom()
            ? snapshotSupport.storedAccess(user.getId())
            : Map.of();

        List<UserModuleAccessRow> rows = scope.stream()
            .map(key -> {
                boolean roleDefault = scopeResolver.roleDefault(user, key);
                boolean allowed = user.isModuleAccessCustom()
                    ? moduleAllowedForCustomAccess(user, key, stored)
                    : roleDefault;
                return new UserModuleAccessRow(key, allowed, roleDefault);
            })
            .toList();

        return new UserModuleAccessDetailResponse(
            user.getId(),
            user.getUsername(),
            user.getFullName(),
            role,
            user.isModuleAccessCustom(),
            rows
        );
    }
}
