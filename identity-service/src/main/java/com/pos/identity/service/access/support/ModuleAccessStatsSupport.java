package com.pos.identity.service.access.support;

import com.pos.identity.client.PosCoreClient;
import com.pos.identity.client.dto.CompanyDirectoryItem;
import com.pos.identity.dto.access.ModuleAccessBusinessTypeStats;
import com.pos.identity.dto.access.ModuleAccessRoleStats;
import com.pos.identity.dto.access.ModuleAccessStatsResponse;
import com.pos.identity.entity.User;
import com.pos.identity.repository.UserRepository;
import com.pos.identity.service.support.TenantAccessSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Aggregates module-access headcounts by business type and role for Access V2.
 */
@Component
@RequiredArgsConstructor
public class ModuleAccessStatsSupport {

    public static final String PLATFORM_STAFF = "PLATFORM_STAFF";

    private final UserRepository userRepository;
    private final PosCoreClient posCoreClient;
    private final TenantAccessSupport tenantAccess;

    public ModuleAccessStatsResponse build(String businessTypeFilter) {
        String filter = StringUtils.hasText(businessTypeFilter)
            ? businessTypeFilter.trim().toUpperCase(Locale.ROOT)
            : null;

        List<User> tenants = userRepository.findTenantUsersForModuleAccess(null);
        Map<Integer, CompanyDirectoryItem> companies = loadCompanies(tenants);

        Map<String, Agg> byBusinessType = new LinkedHashMap<>();
        for (User user : tenants) {
            String bt = resolveBusinessType(user, companies);
            if (bt == null) {
                continue;
            }
            if (filter != null && !filter.equals(bt)) {
                continue;
            }
            accumulate(byBusinessType, bt, user);
        }

        if ((filter == null || PLATFORM_STAFF.equals(filter)) && tenantAccess.isSuperAdmin()) {
            for (User operator : userRepository.findPlatformOperatorsForModuleAccess()) {
                accumulate(byBusinessType, PLATFORM_STAFF, operator);
            }
        }

        List<ModuleAccessBusinessTypeStats> rows = byBusinessType.entrySet().stream()
            .sorted(Map.Entry.comparingByKey())
            .map(e -> toBusinessTypeStats(e.getKey(), e.getValue()))
            .toList();
        return new ModuleAccessStatsResponse(rows);
    }

    private Map<Integer, CompanyDirectoryItem> loadCompanies(List<User> users) {
        List<Integer> ids = users.stream()
            .map(User::getCompanyId)
            .filter(Objects::nonNull)
            .distinct()
            .toList();
        if (ids.isEmpty()) {
            return Map.of();
        }
        return posCoreClient.findCompaniesByIds(ids).stream()
            .filter(c -> c != null && c.id() != null)
            .collect(Collectors.toMap(CompanyDirectoryItem::id, Function.identity(), (a, b) -> a));
    }

    private static String resolveBusinessType(User user, Map<Integer, CompanyDirectoryItem> companies) {
        if (user.getCompanyId() == null) {
            return null;
        }
        CompanyDirectoryItem company = companies.get(user.getCompanyId());
        if (company == null || !StringUtils.hasText(company.businessType())) {
            return "UNKNOWN";
        }
        return company.businessType().trim().toUpperCase(Locale.ROOT);
    }

    private static void accumulate(Map<String, Agg> byBusinessType, String businessType, User user) {
        Agg agg = byBusinessType.computeIfAbsent(businessType, ignored -> new Agg());
        agg.totalEmployees++;
        if (user.isModuleAccessCustom()) {
            agg.exceptionCount++;
        }
        String role = user.getRole() != null && StringUtils.hasText(user.getRole().getName())
            ? user.getRole().getName().trim().toUpperCase(Locale.ROOT)
            : "UNKNOWN";
        RoleAgg roleAgg = agg.roles.computeIfAbsent(role, ignored -> new RoleAgg());
        roleAgg.totalEmployees++;
        if (user.isModuleAccessCustom()) {
            roleAgg.exceptionCount++;
        }
    }

    private static ModuleAccessBusinessTypeStats toBusinessTypeStats(String code, Agg agg) {
        List<ModuleAccessRoleStats> roles = new ArrayList<>();
        agg.roles.entrySet().stream()
            .sorted(Map.Entry.comparingByKey())
            .forEach(e -> roles.add(new ModuleAccessRoleStats(
                e.getKey(),
                e.getValue().totalEmployees,
                e.getValue().exceptionCount
            )));
        return new ModuleAccessBusinessTypeStats(code, agg.totalEmployees, agg.exceptionCount, roles);
    }

    private static final class Agg {
        private long totalEmployees;
        private long exceptionCount;
        private final Map<String, RoleAgg> roles = new HashMap<>();
    }

    private static final class RoleAgg {
        private long totalEmployees;
        private long exceptionCount;
    }
}
