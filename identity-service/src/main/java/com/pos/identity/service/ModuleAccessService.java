package com.pos.identity.service;

import com.pos.identity.dto.access.AdminModuleCatalogItem;
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
        Pageable pageable
    );

    UserModuleAccessDetailResponse getUserAccess(UUID userId);

    UserModuleAccessDetailResponse updateUserAccess(UUID userId, UpdateUserModuleAccessRequest request);

    UserModuleAccessDetailResponse resetUserAccess(UUID userId);

    List<String> resolveAllowedModuleIds(User user);
}
