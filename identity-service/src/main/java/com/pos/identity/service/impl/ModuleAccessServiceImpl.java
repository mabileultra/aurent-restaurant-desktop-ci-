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
import com.pos.identity.exception.ResourceNotFoundException;
import com.pos.identity.repository.UserModuleAccessRepository;
import com.pos.identity.repository.UserRepository;
import com.pos.identity.security.AdminModule;
import com.pos.identity.service.ModuleAccessService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ModuleAccessServiceImpl implements ModuleAccessService {

    private final UserRepository userRepository;
    private final UserModuleAccessRepository userModuleAccessRepository;
    private final PosCoreClient posCoreClient;

    @Override
    public List<AdminModuleCatalogItem> catalog() {
        return Arrays.stream(AdminModule.values())
            .map(m -> new AdminModuleCatalogItem(m.key(), m.group()))
            .toList();
    }

    @Override
    public List<UserModuleAccessSummary> listUsers(Integer companyId) {
        String companyName = companyId != null ? resolveCompanyName(companyId) : null;
        return userRepository.findTenantUsersForModuleAccess(companyId).stream()
            .sorted(Comparator.comparing(User::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
            .map(user -> toSummary(user, companyName))
            .toList();
    }

    @Override
    public UserModuleAccessDetailResponse getUserAccess(UUID userId) {
        User user = requireTenantUser(userId);
        return buildDetail(user);
    }

    @Override
    @Transactional(readOnly = false)
    public UserModuleAccessDetailResponse updateUserAccess(UUID userId, UpdateUserModuleAccessRequest request) {
        User user = requireTenantUser(userId);
        if (Boolean.FALSE.equals(request.customAccess())) {
            return resetUserAccess(userId);
        }

        Map<String, Boolean> modules = request.modules() != null ? request.modules() : Map.of();
        userModuleAccessRepository.deleteByUserId(userId);

        List<UserModuleAccess> rows = new ArrayList<>();
        boolean anyAllowed = false;
        for (AdminModule module : modulesForUserRole(user)) {
            boolean allowed = Boolean.TRUE.equals(modules.get(module.key()));
            if (allowed) {
                anyAllowed = true;
            }
            rows.add(UserModuleAccess.builder()
                .id(new UserModuleAccessId(userId, module.key()))
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
        User user = requireTenantUser(userId);
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
        String role = user.getRole().getName();
        if ("SUPER_ADMIN".equals(role)) {
            return AdminModule.adminScope().stream().map(AdminModule::key).sorted().toList();
        }

        List<AdminModule> scope = modulesForUserRole(user);
        if (!user.isModuleAccessCustom()) {
            return scope.stream()
                .filter(m -> m.allowedForRole(role))
                .map(AdminModule::key)
                .sorted()
                .toList();
        }

        Map<String, Boolean> stored = userModuleAccessRepository.findByIdUserId(user.getId()).stream()
            .collect(Collectors.toMap(UserModuleAccess::getModuleKey, UserModuleAccess::isAllowed, (a, b) -> b));

        return scope.stream()
            .filter(m -> moduleAllowedForCustomAccess(m, role, stored))
            .map(AdminModule::key)
            .sorted()
            .toList();
    }

    private boolean moduleAllowedForCustomAccess(AdminModule module, String role, Map<String, Boolean> stored) {
        if (!stored.containsKey(module.key())) {
            return module.allowedForRole(role);
        }
        return Boolean.TRUE.equals(stored.get(module.key()));
    }

    private UserModuleAccessDetailResponse buildDetail(User user) {
        String role = user.getRole().getName();
        List<AdminModule> scope = modulesForUserRole(user);
        Map<String, Boolean> stored = user.isModuleAccessCustom()
            ? userModuleAccessRepository.findByIdUserId(user.getId()).stream()
                .collect(Collectors.toMap(UserModuleAccess::getModuleKey, UserModuleAccess::isAllowed, (a, b) -> b))
            : Map.of();

        List<UserModuleAccessRow> rows = scope.stream()
            .map(m -> {
                boolean roleDefault = m.allowedForRole(role);
                boolean allowed = user.isModuleAccessCustom()
                    ? moduleAllowedForCustomAccess(m, role, stored)
                    : roleDefault;
                return new UserModuleAccessRow(m.key(), allowed, roleDefault);
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

    private List<AdminModule> modulesForUserRole(User user) {
        String role = user.getRole().getName();
        List<AdminModule> scope;
        if ("CASHIER".equals(role) || "WAITER".equals(role)) {
            scope = AdminModule.cashierScope();
        } else if ("ACCOUNTANT".equals(role)) {
            scope = AdminModule.financeScope();
        } else {
            scope = AdminModule.adminScope();
        }
        return filterByCompanyBusinessType(scope, user.getCompanyId());
    }

    private List<AdminModule> filterByCompanyBusinessType(List<AdminModule> scope, Integer companyId) {
        if (companyId == null || scope.isEmpty()) {
            return scope;
        }
        String businessType = resolveCompanyBusinessType(companyId);
        return scope.stream()
            .filter(m -> AdminModule.visibleForBusinessType(m, businessType))
            .toList();
    }

    private String resolveCompanyBusinessType(Integer companyId) {
        try {
            CompanyDto company = posCoreClient.getCompanyById(companyId);
            return company != null ? company.businessType() : null;
        } catch (Exception ex) {
            return null;
        }
    }

    private User requireTenantUser(UUID userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (user.getRole() == null || "SUPER_ADMIN".equals(user.getRole().getName())) {
            throw new BadRequestException("Module access is not configurable for this user");
        }
        if (user.getCompanyId() == null) {
            throw new BadRequestException("User has no company");
        }
        return user;
    }

    private UserModuleAccessSummary toSummary(User user, String companyName) {
        return new UserModuleAccessSummary(
            user.getId(),
            user.getUsername(),
            user.getFullName(),
            user.getRole().getName(),
            user.getCompanyId(),
            companyName,
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
