package com.pos.identity.service;

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
import com.pos.identity.dto.access.UserModuleAccessSummary;
import com.pos.identity.dto.shared.PageResponse;
import com.pos.identity.entity.User;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface ModuleAccessService {

    List<AdminModuleCatalogItem> catalog();

    /** @deprecated Prefer {@link #listUsersPaged} — kept for any internal callers. */
    List<UserModuleAccessSummary> listUsers(Integer companyId);

    PageResponse<UserModuleAccessSummary> listUsersPaged(
        Integer companyId,
        boolean platformOnly,
        String search,
        String accessFilter,
        String businessType,
        String role,
        Pageable pageable
    );

    ModuleAccessStatsResponse stats(String businessType);

    RoleTemplateResponse getRoleTemplate(String businessType, String role);

    RoleTemplateResponse updateRoleTemplate(String businessType, String role, UpdateRoleTemplateRequest request);

    UserModuleAccessDetailResponse getUserAccess(UUID userId);

    UserModuleAccessDetailResponse updateUserAccess(UUID userId, UpdateUserModuleAccessRequest request);

    UserModuleAccessDetailResponse resetUserAccess(UUID userId);

    ModuleAccessMutationResponse copyAccess(CopyModuleAccessRequest request);

    ModuleAccessMutationResponse bulkResetAccess(BulkResetModuleAccessRequest request);

    PageResponse<ModuleAccessHistoryItem> history(UUID targetUserId, Pageable pageable);

    ModuleAccessHistoryItem revertHistory(UUID historyId);

    List<String> resolveAllowedModuleIds(User user);
}
