package com.pos.platform.dto.billing;

import com.pos.platform.domain.BillingAccountStatus;

public record BillingAccessResponse(
    Integer companyId,
    boolean billingEnabled,
    boolean accessAllowed,
    BillingAccountStatus status
) {}
