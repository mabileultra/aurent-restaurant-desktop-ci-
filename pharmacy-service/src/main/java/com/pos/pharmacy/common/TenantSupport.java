package com.pos.pharmacy.common;

import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.exception.errorcode.PharmacyCommonErrors;
import com.pos.pharmacy.security.PharmacyTenantContext;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class TenantSupport {

    public Integer requireCompanyId() {
        Integer companyId = PharmacyTenantContext.getCompanyId();
        if (companyId == null) {
            throw PharmacyErrors.of(PharmacyCommonErrors.PHARM_COMPANY_REQUIRED);
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
