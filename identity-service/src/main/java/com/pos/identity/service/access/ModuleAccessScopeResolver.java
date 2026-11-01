package com.pos.identity.service.access;

import com.pos.identity.client.PosCoreClient;
import com.pos.identity.client.dto.CompanyDto;
import com.pos.identity.entity.User;
import com.pos.identity.security.AdminModule;
import com.pos.identity.security.PlatformAdminModule;
import com.pos.identity.security.RoleName;
import com.pos.identity.service.access.support.ModuleAccessStatsSupport;
import com.pos.identity.service.access.support.RoleTemplateLookup;
import com.pos.shared.access.ModuleVisibility;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
public class ModuleAccessScopeResolver {

    private final PosCoreClient posCoreClient;
    private final RoleTemplateLookup roleTemplateLookup;

    public boolean isPlatformAdmin(User user) {
        return RoleName.PLATFORM_ADMIN.matches(user);
    }

    public List<String> keysFor(User user) {
        if (RoleName.PLATFORM_ANALYTICS.matches(user)) {
            return List.of(PlatformAdminModule.ANALYTICS.key());
        }
        if (isPlatformAdmin(user)) {
            return PlatformAdminModule.grantable().stream().map(PlatformAdminModule::key).toList();
        }
        return tenantModules(user).stream().map(AdminModule::key).toList();
    }

    public List<AdminModule> tenantModules(User user) {
        String role = user.getRole().getName();
        List<AdminModule> scope;
        if ("CASHIER".equals(role) || "WAITER".equals(role) || "COOK".equals(role)) {
            scope = AdminModule.cashierScope();
        } else if ("ACCOUNTANT".equals(role)) {
            scope = AdminModule.financeScope();
        } else {
            scope = AdminModule.adminScope();
        }
        return filterByCompanyBusinessType(scope, user.getCompanyId());
    }

    public boolean roleDefault(User user, String moduleKey) {
        if (RoleName.PLATFORM_ANALYTICS.matches(user)) {
            return roleTemplateLookup.isAllowed(
                ModuleAccessStatsSupport.PLATFORM_STAFF,
                RoleName.PLATFORM_ANALYTICS.key(),
                moduleKey,
                PlatformAdminModule.ANALYTICS.key().equals(moduleKey)
            );
        }
        if (isPlatformAdmin(user)) {
            return roleTemplateLookup.isAllowed(
                ModuleAccessStatsSupport.PLATFORM_STAFF,
                RoleName.PLATFORM_ADMIN.key(),
                moduleKey,
                false
            );
        }
        boolean enumDefault = Arrays.stream(AdminModule.values())
            .filter(module -> module.key().equals(moduleKey))
            .findFirst()
            .map(module -> module.allowedForRole(user.getRole().getName()))
            .orElse(false);
        String businessType = resolveCompanyBusinessType(user.getCompanyId());
        if (businessType == null) {
            return enumDefault;
        }
        return roleTemplateLookup.isAllowed(businessType, user.getRole().getName(), moduleKey, enumDefault);
    }

    private List<AdminModule> filterByCompanyBusinessType(List<AdminModule> scope, Integer companyId) {
        if (companyId == null || scope.isEmpty()) {
            return scope;
        }
        String businessType = resolveCompanyBusinessType(companyId);
        return scope.stream()
            .filter(m -> ModuleVisibility.visible(m.key(), businessType))
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
}
