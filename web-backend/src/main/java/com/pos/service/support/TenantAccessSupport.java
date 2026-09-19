package com.pos.service.support;

import com.pos.entity.Company;
import com.pos.catalog.entity.Product;
import com.pos.entity.Store;
import com.pos.entity.User;
import com.pos.exception.BadRequestException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.repository.CompanyRepository;
import com.pos.repository.StoreRepository;
import com.pos.security.CurrentUserProvider;
import com.pos.security.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class TenantAccessSupport {

    private final CurrentUserProvider currentUserProvider;
    private final CompanyRepository companyRepository;
    private final StoreRepository storeRepository;

    public User currentUser() {
        return currentUserProvider.requireCurrentUser();
    }

    public boolean isSuperAdmin() {
        return currentUserProvider.isSuperAdmin(currentUser());
    }

    public boolean isPlatformOperator() {
        return currentUserProvider.isPlatformOperator(currentUser());
    }

    public Integer resolveCompanyIdForCreate(Integer requestedCompanyId) {
        User actor = currentUser();
        if (currentUserProvider.isPlatformOperator(actor)) {
            if (requestedCompanyId == null) {
                throw new BadRequestException("Company is required");
            }
            return requestedCompanyId;
        }
        Integer companyId = companyIdFromUserOrJwt(actor);
        if (companyId == null) {
            throw new BadRequestException("Your account is not linked to a company");
        }
        return companyId;
    }

    public Company requireCompany(Integer companyId) {
        return companyRepository.findById(companyId)
            .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
    }

    public void assertCanAccessCompany(Integer companyId) {
        User actor = currentUser();
        if (currentUserProvider.isPlatformOperator(actor)) {
            return;
        }
        if (actor.getCompany() != null) {
            if (!actor.getCompany().getId().equals(companyId)) {
                throw new BadRequestException("Access denied to this company");
            }
            return;
        }
        Integer jwtCompanyId = TenantContext.companyId().orElse(null);
        if (jwtCompanyId != null && jwtCompanyId.equals(companyId)) {
            return;
        }
        throw new BadRequestException("Access denied to this company");
    }

    public void assertCanAccessStore(Store store) {
        if (store.getCompany() == null) {
            return;
        }
        assertCanAccessCompany(store.getCompany().getId());
    }

    public Set<Store> resolveStoresForUser(Integer companyId, List<Integer> storeIds) {
        if (storeIds == null || storeIds.isEmpty()) {
            return Set.of();
        }
        Set<Store> stores = new HashSet<>();
        for (Integer storeId : storeIds) {
            Store store = storeRepository.findByIdWithCompany(storeId)
                .orElseThrow(() -> new BadRequestException("Store not found: " + storeId));
            Integer storeCompanyId = store.getCompany() != null ? store.getCompany().getId() : null;
            if (storeCompanyId == null || !storeCompanyId.equals(companyId)) {
                throw new BadRequestException("Store does not belong to the selected company");
            }
            stores.add(store);
        }
        return stores;
    }

    /** companyId для текущего запроса: user.company → JWT → ошибка. */
    public Integer requireEffectiveCompanyId() {
        User actor = currentUser();
        if (currentUserProvider.isPlatformOperator(actor)) {
            return TenantContext.companyId()
                .orElseThrow(() -> new BadRequestException("Company context is required"));
        }
        Integer companyId = companyIdFromUserOrJwt(actor);
        if (companyId == null) {
            throw new BadRequestException("Your account is not linked to a company");
        }
        return companyId;
    }

    /** Для read-only операций: null у SUPER_ADMIN / внутреннего сервиса без company в контексте. */
    public Integer effectiveCompanyIdOrNull() {
        if (currentUserProvider.isInternalService()) {
            return TenantContext.companyId().orElse(null);
        }
        User actor = currentUser();
        if (currentUserProvider.isPlatformOperator(actor)) {
            return TenantContext.companyId().orElse(null);
        }
        return companyIdFromUserOrJwt(actor);
    }

    private Integer companyIdFromUserOrJwt(User actor) {
        if (actor.getCompany() != null) {
            return actor.getCompany().getId();
        }
        return TenantContext.companyId().orElse(null);
    }

    public void assertProductBelongsToTenant(Product product) {
        if (product == null || product.getCompany() == null) {
            return;
        }
        Integer productCompanyId = product.getCompany().getId();
        User actor = currentUser();
        if (currentUserProvider.isPlatformOperator(actor)) {
            Integer scopedCompanyId = TenantContext.companyId().orElse(null);
            if (scopedCompanyId != null && !productCompanyId.equals(scopedCompanyId)) {
                throw new BadRequestException("Access denied to this product");
            }
            return;
        }
        Integer companyId = requireEffectiveCompanyId();
        if (!productCompanyId.equals(companyId)) {
            throw new BadRequestException("Access denied to this product");
        }
    }

    /**
     * Query/path companyId: super-admin may scope freely; others must match their tenant.
     */
    public Integer resolveScopedCompanyId(Integer requestedCompanyId) {
        if (isPlatformOperator()) {
            return requestedCompanyId;
        }
        if (requestedCompanyId != null) {
            assertCanAccessCompany(requestedCompanyId);
        }
        return requireEffectiveCompanyId();
    }
}
