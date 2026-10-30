package com.pos.identity.service.user.support;

import com.pos.identity.client.PosCoreClient;
import com.pos.identity.dto.user.UserListCriteria;
import com.pos.identity.entity.User;
import com.pos.identity.exception.IdentityExceptions;
import com.pos.identity.repository.UserRepository;
import com.pos.identity.service.support.TenantAccessSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class UserListScopeResolver {

    private final TenantAccessSupport tenantAccess;
    private final PosCoreClient posCoreClient;
    private final UserRepository userRepository;

    public UserListScope resolve(UserListCriteria criteria) {
        Integer forcedCompanyId = forcedCompanyId();
        List<Integer> companyIds = companyIds(criteria, forcedCompanyId);
        String search = criteria.search();
        List<Integer> searchCompanyIds = List.of();
        List<UUID> searchUserIds = List.of();
        if (StringUtils.hasText(search)) {
            searchCompanyIds = posCoreClient.findCompanyIdsBySearch(search);
            List<Integer> storeIds = posCoreClient.findStoreIdsBySearch(search);
            if (!storeIds.isEmpty()) {
                searchUserIds = userRepository.findIdsHavingStoreIds(storeIds);
            }
        }
        return new UserListScope(
            companyIds,
            searchCompanyIds,
            searchUserIds,
            UserListRoleConstraint.allowedRoles(criteria.businessType()),
            tenantAccess.isSuperAdmin()
        );
    }

    private Integer forcedCompanyId() {
        if (tenantAccess.isPlatformOperator()) {
            return null;
        }
        User actor = tenantAccess.currentUser();
        if (actor.getCompanyId() == null) {
            throw IdentityExceptions.badRequest("Your account is not linked to a company");
        }
        return actor.getCompanyId();
    }

    private List<Integer> companyIds(UserListCriteria criteria, Integer forcedCompanyId) {
        boolean directoryFilter = StringUtils.hasText(criteria.businessType())
            || StringUtils.hasText(criteria.regionCode())
            || StringUtils.hasText(criteria.districtCode());
        if (directoryFilter) {
            List<Integer> matched = posCoreClient.findCompanyIds(
                criteria.businessType(),
                criteria.regionCode(),
                criteria.districtCode()
            );
            Integer pinned = forcedCompanyId != null ? forcedCompanyId : criteria.companyId();
            if (pinned != null) {
                return matched.contains(pinned) ? List.of(pinned) : List.of();
            }
            return matched;
        }
        if (forcedCompanyId != null) {
            return List.of(forcedCompanyId);
        }
        if (criteria.companyId() != null) {
            return List.of(criteria.companyId());
        }
        return null;
    }
}
