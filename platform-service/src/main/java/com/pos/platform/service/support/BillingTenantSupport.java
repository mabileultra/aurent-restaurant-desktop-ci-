package com.pos.platform.service.support;

import com.pos.platform.exception.ForbiddenException;
import com.pos.platform.security.PlatformTenantContext;

public final class BillingTenantSupport {

    private BillingTenantSupport() {}

    public static Integer requireCompanyId() {
        Integer companyId = PlatformTenantContext.getCompanyId();
        if (companyId == null) {
            throw new ForbiddenException("Компания не определена в токене");
        }
        return companyId;
    }
}
