package com.pos.identity.service.access.support;

import com.pos.identity.client.PosCoreClient;
import com.pos.identity.client.dto.CompanyDirectoryItem;
import com.pos.identity.dto.access.UserModuleAccessSummary;
import com.pos.identity.dto.shared.PageResponse;
import com.pos.identity.entity.User;
import com.pos.identity.repository.UserRepository;
import com.pos.identity.service.support.TenantAccessSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Builds a paged module-access user directory without dumping the full list to the browser.
 */
@Component
@RequiredArgsConstructor
public class ModuleAccessUsersPager {

    public static final long NEW_USER_MAX_AGE_MS = 7L * 24 * 60 * 60 * 1000;

    private final UserRepository userRepository;
    private final PosCoreClient posCoreClient;
    private final TenantAccessSupport tenantAccess;

    public PageResponse<UserModuleAccessSummary> page(
        Integer companyId,
        boolean platformOnly,
        String search,
        String accessFilter,
        String businessType,
        Pageable pageable
    ) {
        List<User> users = loadUsers(companyId, platformOnly, businessType);
        Map<Integer, CompanyDirectoryItem> companies = loadCompanies(users);
        Instant now = Instant.now();
        String q = StringUtils.hasText(search) ? search.trim().toLowerCase(Locale.ROOT) : "";
        String filter = StringUtils.hasText(accessFilter) ? accessFilter.trim().toLowerCase(Locale.ROOT) : "all";

        List<UserModuleAccessSummary> rows = users.stream()
            .map(user -> toSummary(user, companies))
            .filter(row -> matchesSearch(row, q))
            .filter(row -> matchesAccess(row, filter, now))
            .sorted(Comparator
                .comparing(UserModuleAccessSummary::createdAt, Comparator.nullsLast(Comparator.reverseOrder()))
                .thenComparing(UserModuleAccessSummary::fullName, Comparator.nullsLast(String::compareToIgnoreCase)))
            .toList();

        return PageResponse.slice(rows, pageable);
    }

    private List<User> loadUsers(Integer companyId, boolean platformOnly, String businessType) {
        if (platformOnly) {
            if (!tenantAccess.isSuperAdmin()) {
                return List.of();
            }
            return userRepository.findPlatformOperatorsForModuleAccess();
        }

        Stream<User> tenant = userRepository.findTenantUsersForModuleAccess(companyId).stream();
        if (StringUtils.hasText(businessType) && companyId == null) {
            Set<Integer> ids = new HashSet<>(posCoreClient.findCompanyIds(businessType.trim(), null, null));
            tenant = tenant.filter(u -> u.getCompanyId() != null && ids.contains(u.getCompanyId()));
        }

        Stream<User> operators = companyId == null && tenantAccess.isSuperAdmin()
            ? userRepository.findPlatformOperatorsForModuleAccess().stream()
            : Stream.empty();

        return Stream.concat(tenant, operators).toList();
    }

    private Map<Integer, CompanyDirectoryItem> loadCompanies(List<User> users) {
        List<Integer> ids = users.stream()
            .map(User::getCompanyId)
            .filter(Objects::nonNull)
            .distinct()
            .toList();
        return posCoreClient.findCompaniesByIds(ids).stream()
            .filter(c -> c != null && c.id() != null)
            .collect(Collectors.toMap(CompanyDirectoryItem::id, Function.identity(), (a, b) -> a));
    }

    private UserModuleAccessSummary toSummary(User user, Map<Integer, CompanyDirectoryItem> companies) {
        CompanyDirectoryItem company = user.getCompanyId() != null ? companies.get(user.getCompanyId()) : null;
        String role = user.getRole() != null ? user.getRole().getName() : null;
        return new UserModuleAccessSummary(
            user.getId(),
            user.getUsername(),
            user.getFullName(),
            role,
            user.getCompanyId(),
            company != null ? company.name() : null,
            user.isModuleAccessCustom(),
            user.getCreatedAt()
        );
    }

    private static boolean matchesSearch(UserModuleAccessSummary row, String q) {
        if (q.isEmpty()) {
            return true;
        }
        return Stream.of(row.fullName(), row.username(), row.role(), row.companyName())
            .filter(Objects::nonNull)
            .anyMatch(v -> v.toLowerCase(Locale.ROOT).contains(q));
    }

    private static boolean matchesAccess(UserModuleAccessSummary row, String filter, Instant now) {
        return switch (filter) {
            case "custom" -> row.moduleAccessCustom();
            case "unconfigured" -> !row.moduleAccessCustom();
            case "new" -> isNew(row.createdAt(), now);
            default -> true;
        };
    }

    private static boolean isNew(Instant createdAt, Instant now) {
        if (createdAt == null) {
            return false;
        }
        return now.toEpochMilli() - createdAt.toEpochMilli() <= NEW_USER_MAX_AGE_MS;
    }
}
