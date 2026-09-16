package com.pos.pharmacy.common;

import com.pos.pharmacy.exception.BusinessException;
import com.pos.pharmacy.security.PharmacyTenantContext;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class TenantSupport {

    public Integer requireCompanyId() {
        Integer companyId = PharmacyTenantContext.getCompanyId();
        if (companyId == null) {
            throw new BusinessException("Company context is required");
        }
        return companyId;
    }

    public Integer effectiveCompanyIdOrNull() {
        return PharmacyTenantContext.getCompanyId();
    }

    public UUID currentUserId() {
        return PharmacyTenantContext.getUserId();
    }
}
