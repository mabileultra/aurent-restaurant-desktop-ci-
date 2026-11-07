package com.pos.identity.service.access.support;

import com.pos.identity.client.PosCoreClient;
import com.pos.identity.client.dto.CompanyDirectoryItem;
import com.pos.identity.dto.access.RoleTemplateResponse;
import com.pos.identity.entity.User;
import com.pos.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Loads all Access V2 role templates in one response to avoid N+1 page opens.
 */
@Component
@RequiredArgsConstructor
public class RoleTemplateCatalogSupport {

    private final RoleTemplateSupport roleTemplateSupport;
    private final UserRepository userRepository;
    private final PosCoreClient posCoreClient;

    @Transactional(readOnly = true)
    public List<RoleTemplateResponse> listAll(String businessTypeFilter) {
        String filter = StringUtils.hasText(businessTypeFilter)
            ? businessTypeFilter.trim().toUpperCase(Locale.ROOT)
            : null;

        List<RoleTemplateResponse> result = new ArrayList<>();
        for (String businessType : resolveBusinessTypes(filter)) {
            for (String role : RoleTemplateMatrix.rolesFor(businessType)) {
                result.add(roleTemplateSupport.get(businessType, role));
            }
        }
        return result;
    }

    private List<String> resolveBusinessTypes(String filter) {
        if (filter != null) {
            return List.of(filter);
        }
        Set<String> types = new LinkedHashSet<>();
        List<User> tenants = userRepository.findTenantUsersForModuleAccess(null);
        List<Integer> companyIds = tenants.stream()
            .map(User::getCompanyId)
            .filter(Objects::nonNull)
            .distinct()
            .toList();
        if (!companyIds.isEmpty()) {
            types.addAll(posCoreClient.findCompaniesByIds(companyIds).stream()
                .map(CompanyDirectoryItem::businessType)
                .filter(StringUtils::hasText)
                .map(v -> v.trim().toUpperCase(Locale.ROOT))
                .collect(Collectors.toCollection(LinkedHashSet::new)));
        }
        types.add(RoleTemplateMatrix.PLATFORM_STAFF);
        if (types.stream().noneMatch(t -> !RoleTemplateMatrix.PLATFORM_STAFF.equals(t))) {
            types.add("RESTAURANT");
            types.add("PHARMACY");
            types.add("UNIVERSAL");
        }
        return List.copyOf(types);
    }
}
