package com.pos.identity.service.impl;

import com.pos.identity.client.PosCoreClient;
import com.pos.identity.client.dto.CompanyDto;
import com.pos.identity.dto.access.AdminModuleCatalogItem;
import com.pos.identity.dto.access.UpdateUserModuleAccessRequest;
import com.pos.identity.dto.access.UserModuleAccessDetailResponse;
import com.pos.identity.dto.access.UserModuleAccessRow;
import com.pos.identity.dto.access.UserModuleAccessSummary;
import com.pos.identity.entity.User;
import com.pos.identity.entity.UserModuleAccess;
import com.pos.identity.entity.UserModuleAccessId;
import com.pos.identity.exception.BadRequestException;
import com.pos.identity.repository.UserModuleAccessRepository;
import com.pos.identity.repository.UserRepository;
import com.pos.identity.security.RoleName;
import com.pos.identity.service.ModuleAccessService;
import com.pos.identity.service.access.ModuleAccessCatalog;
import com.pos.identity.service.access.ModuleAccessScopeResolver;
import com.pos.identity.service.access.ModuleAccessUserGate;
import com.pos.identity.service.support.TenantAccessSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ModuleAccessServiceImpl implements ModuleAccessService {

    private final UserRepository userRepository;
    private final UserModuleAccessRepository userModuleAccessRepository;
    private final PosCoreClient posCoreClient;
    private final ModuleAccessCatalog moduleAccessCatalog;
    private final ModuleAccessUserGate moduleAccessUserGate;
    private final ModuleAccessScopeResolver scopeResolver;
    private final TenantAccessSupport tenantAccess;

    @Override
    public List<AdminModuleCatalogItem> catalog() {
        return moduleAccessCatalog.allItems();
    }

    @Override
    public List<UserModuleAccessSummary> listUsers(Integer companyId) {
        String companyName = companyId != null ? resolveCompanyName(companyId) : null;
        Stream<User> tenantUsers = userRepository.findTenantUsersForModuleAccess(companyId).stream();
        Stream<User> platformOperators = companyId == null && tenantAccess.isSuperAdmin()
            ? userRepository.findPlatformOperatorsForModuleAccess().stream()
            : Stream.empty();
        return Stream.concat(tenantUsers, platformOperators)
            .sorted(Comparator.comparing(User::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
            .map(user -> toSummary(user, companyName))
            .toList();
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

        Map<String, Boolean> modules = request.modules() != null ? request.modules() : Map.of();
        userModuleAccessRepository.deleteByUserId(userId);

        List<UserModuleAccess> rows = new ArrayList<>();
        boolean anyAllowed = false;
        for (String moduleKey : scopeResolver.keysFor(user)) {
            boolean allowed = Boolean.TRUE.equals(modules.get(moduleKey));
            if (allowed) {
                anyAllowed = true;
            }
            rows.add(UserModuleAccess.builder()
                .id(new UserModuleAccessId(userId, moduleKey))
                .user(user)
                .allowed(allowed)
                .build());
        }
        if (!anyAllowed) {
            throw new BadRequestException("Включите хотя бы один модуль");
        }
        userModuleAccessRepository.saveAll(rows);
        user.setModuleAccessCustom(true);
        userRepository.save(user);
        return buildDetail(userRepository.findById(userId).orElseThrow());
    }

    @Override
    @Transactional(readOnly = false)
    public UserModuleAccessDetailResponse resetUserAccess(UUID userId) {
        User user = moduleAccessUserGate.requireConfigurable(userId);
        userModuleAccessRepository.deleteByUserId(userId);
        user.setModuleAccessCustom(false);
        userRepository.save(user);
        return buildDetail(user);
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

        Map<String, Boolean> stored = storedAccess(user.getId());
        return scope.stream()
            .filter(key -> moduleAllowedForCustomAccess(user, key, stored))
            .sorted()
            .toList();
    }

    private List<String> resolveStoredOrEmpty(User user) {
        if (!user.isModuleAccessCustom()) {
            return List.of();
        }
        Map<String, Boolean> stored = storedAccess(user.getId());
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
            ? storedAccess(user.getId())
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

    private Map<String, Boolean> storedAccess(UUID userId) {
        return userModuleAccessRepository.findByIdUserId(userId).stream()
            .collect(Collectors.toMap(UserModuleAccess::getModuleKey, UserModuleAccess::isAllowed, (a, b) -> b));
    }

    private UserModuleAccessSummary toSummary(User user, String companyName) {
        return new UserModuleAccessSummary(
            user.getId(),
            user.getUsername(),
            user.getFullName(),
            user.getRole().getName(),
            user.getCompanyId(),
            user.getCompanyId() == null ? null : companyName,
            user.isModuleAccessCustom(),
            user.getCreatedAt()
        );
    }

    private String resolveCompanyName(Integer companyId) {
        if (companyId == null) {
            return null;
        }
        CompanyDto company = posCoreClient.getCompanyById(companyId);
        return company != null ? company.name() : null;
    }
}
