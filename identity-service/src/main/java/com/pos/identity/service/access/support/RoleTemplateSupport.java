package com.pos.identity.service.access.support;

import com.pos.identity.client.PosCoreClient;
import com.pos.identity.dto.access.RoleTemplateResponse;
import com.pos.identity.dto.access.UpdateRoleTemplateRequest;
import com.pos.identity.entity.RoleModuleTemplate;
import com.pos.identity.entity.RoleModuleTemplateId;
import com.pos.identity.entity.User;
import com.pos.identity.exception.BadRequestException;
import com.pos.identity.repository.RoleModuleTemplateRepository;
import com.pos.identity.repository.UserRepository;
import com.pos.identity.security.AdminModule;
import com.pos.identity.security.PlatformAdminModule;
import com.pos.identity.security.IdentityTenantContext;
import com.pos.identity.security.RoleName;
import com.pos.shared.access.ModuleVisibility;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class RoleTemplateSupport {

    public static final String PLATFORM_STAFF = "PLATFORM_STAFF";

    private final RoleModuleTemplateRepository roleModuleTemplateRepository;
    private final RoleTemplateLookup roleTemplateLookup;
    private final UserRepository userRepository;
    private final PosCoreClient posCoreClient;

    @Transactional(readOnly = true)
    public RoleTemplateResponse get(String businessType, String role) {
        String bt = normalizeBusinessType(businessType);
        String roleName = normalizeRole(role);
        List<String> scope = scopeKeys(bt, roleName);
        Map<String, Boolean> saved = roleTemplateLookup.findModules(bt, roleName).orElse(null);
        Map<String, Boolean> modules = new LinkedHashMap<>();
        for (String key : scope) {
            boolean allowed = saved != null
                ? Boolean.TRUE.equals(saved.get(key))
                : enumDefault(bt, roleName, key);
            modules.put(key, allowed);
        }
        return new RoleTemplateResponse(
            bt,
            roleName,
            modules,
            saved != null ? "TEMPLATE" : "DEFAULT",
            0
        );
    }

    @Transactional
    public RoleTemplateResponse put(String businessType, String role, UpdateRoleTemplateRequest request) {
        if (request == null || request.modules() == null || request.modules().isEmpty()) {
            throw new BadRequestException("modules required");
        }
        String bt = normalizeBusinessType(businessType);
        String roleName = normalizeRole(role);
        List<String> scope = scopeKeys(bt, roleName);
        Set<String> scopeSet = new HashSet<>(scope);

        boolean anyAllowed = false;
        List<RoleModuleTemplate> rows = new ArrayList<>();
        UUID actorId = IdentityTenantContext.userId();
        Instant now = Instant.now();
        for (String key : scope) {
            boolean allowed = Boolean.TRUE.equals(request.modules().get(key));
            if (allowed) {
                anyAllowed = true;
            }
            rows.add(RoleModuleTemplate.builder()
                .id(new RoleModuleTemplateId(bt, roleName, key))
                .allowed(allowed)
                .updatedAt(now)
                .updatedBy(actorId)
                .build());
        }
        for (String key : request.modules().keySet()) {
            if (!scopeSet.contains(key) && Boolean.TRUE.equals(request.modules().get(key))) {
                throw new BadRequestException("Module not in role scope: " + key);
            }
        }
        if (!anyAllowed) {
            throw new BadRequestException("Enable at least one module");
        }

        roleModuleTemplateRepository.deleteByBusinessTypeAndRoleName(bt, roleName);
        roleModuleTemplateRepository.saveAll(rows);

        int affected = 0;
        if (Boolean.TRUE.equals(request.applyToExisting())) {
            affected = applyToExistingUsers(bt, roleName);
        } else {
            affected = countNonCustomUsers(bt, roleName);
        }

        Map<String, Boolean> modules = new LinkedHashMap<>();
        for (String key : scope) {
            modules.put(key, Boolean.TRUE.equals(request.modules().get(key)));
        }
        return new RoleTemplateResponse(bt, roleName, modules, "TEMPLATE", affected);
    }

    private int applyToExistingUsers(String businessType, String roleName) {
        List<User> users = loadUsersForTemplate(businessType, roleName).stream()
            .filter(u -> !u.isModuleAccessCustom())
            .toList();
        // Non-custom users already resolve via template/roleDefault — nothing to materialize.
        return users.size();
    }

    private int countNonCustomUsers(String businessType, String roleName) {
        return (int) loadUsersForTemplate(businessType, roleName).stream()
            .filter(u -> !u.isModuleAccessCustom())
            .count();
    }

    private List<User> loadUsersForTemplate(String businessType, String roleName) {
        if (PLATFORM_STAFF.equals(businessType)) {
            return userRepository.findPlatformOperatorsForModuleAccess().stream()
                .filter(u -> roleName.equalsIgnoreCase(u.getRole() != null ? u.getRole().getName() : null))
                .toList();
        }
        Set<Integer> companyIds = new HashSet<>(posCoreClient.findCompanyIds(businessType, null, null));
        if (companyIds.isEmpty()) {
            return List.of();
        }
        return userRepository.findTenantUsersForModuleAccess(null).stream()
            .filter(u -> u.getCompanyId() != null && companyIds.contains(u.getCompanyId()))
            .filter(u -> roleName.equalsIgnoreCase(u.getRole() != null ? u.getRole().getName() : null))
            .toList();
    }

    private List<String> scopeKeys(String businessType, String roleName) {
        if (PLATFORM_STAFF.equals(businessType)
            || RoleName.PLATFORM_ADMIN.name().equals(roleName)
            || RoleName.PLATFORM_ANALYTICS.name().equals(roleName)) {
            if (RoleName.PLATFORM_ANALYTICS.name().equals(roleName)) {
                return List.of(PlatformAdminModule.ANALYTICS.key());
            }
            return PlatformAdminModule.grantable().stream().map(PlatformAdminModule::key).sorted().toList();
        }
        List<AdminModule> scope;
        if ("CASHIER".equals(roleName) || "WAITER".equals(roleName) || "COOK".equals(roleName)) {
            scope = AdminModule.cashierScope();
        } else if ("ACCOUNTANT".equals(roleName)) {
            scope = AdminModule.financeScope();
        } else {
            scope = AdminModule.adminScope();
        }
        return scope.stream()
            .filter(m -> ModuleVisibility.visible(m.key(), businessType))
            .map(AdminModule::key)
            .sorted()
            .collect(Collectors.toList());
    }

    private boolean enumDefault(String businessType, String roleName, String moduleKey) {
        if (PLATFORM_STAFF.equals(businessType)
            || RoleName.PLATFORM_ADMIN.name().equals(roleName)) {
            return false;
        }
        if (RoleName.PLATFORM_ANALYTICS.name().equals(roleName)) {
            return PlatformAdminModule.ANALYTICS.key().equals(moduleKey);
        }
        return AdminModule.defaultKeysForRole(roleName).contains(moduleKey);
    }

    private static String normalizeBusinessType(String businessType) {
        if (!StringUtils.hasText(businessType)) {
            throw new BadRequestException("businessType required");
        }
        return businessType.trim().toUpperCase(Locale.ROOT);
    }

    private static String normalizeRole(String role) {
        if (!StringUtils.hasText(role)) {
            throw new BadRequestException("role required");
        }
        return role.trim().toUpperCase(Locale.ROOT);
    }
}
