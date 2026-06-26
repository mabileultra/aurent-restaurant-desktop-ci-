package com.pos.identity.service.support;

import com.pos.identity.client.PosCoreClient;
import com.pos.identity.client.dto.CompanyDto;
import com.pos.identity.client.dto.StoreValidateRequest;
import com.pos.identity.client.dto.StoreValidateResponse;
import com.pos.identity.entity.User;
import com.pos.identity.exception.BadRequestException;
import com.pos.identity.exception.IdentityExceptions;
import com.pos.identity.security.CurrentUserProvider;
import com.pos.identity.security.RoleName;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class TenantAccessSupport {

    private final CurrentUserProvider currentUserProvider;
    private final PosCoreClient posCoreClient;

    public User currentUser() {
        return currentUserProvider.requireCurrentUser();
    }

    public boolean isSuperAdmin() {
        return currentUserProvider.isSuperAdmin(currentUser());
    }

    public Integer requireCompanyId(Integer companyId) {
        if (companyId == null) {
            throw IdentityExceptions.badRequest("Company not found");
        }
        return companyId;
    }

    public CompanyDto requireCompanyByLoginCode(String loginCode) {
        CompanyDto company = posCoreClient.getCompanyByLoginCode(loginCode);
        if (company == null) {
            throw new BadRequestException("Company not found");
        }
        return company;
    }

    public Set<Integer> resolveStoresForUser(Integer companyId, List<Integer> storeIds) {
        if (storeIds == null || storeIds.isEmpty()) {
            return Set.of();
        }
        StoreValidateResponse response = posCoreClient.validateStores(
            new StoreValidateRequest(companyId, storeIds)
        );
        if (response == null || !response.valid() || response.validStoreIds() == null || response.validStoreIds().isEmpty()) {
            throw IdentityExceptions.badRequest("Invalid store assignment");
        }
        return new HashSet<>(response.validStoreIds());
    }

    public boolean isCompanyActive(CompanyDto company) {
        return company != null && company.active();
    }

    public boolean isSuperAdmin(User user) {
        return RoleName.SUPER_ADMIN.matches(user);
    }
}
