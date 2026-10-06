package com.pos.platform.dto.billing;

import com.pos.platform.domain.BillingPaymentMethod;
import com.pos.platform.domain.BillingPaymentState;

import java.time.Instant;

public record CompanyPaymentRowResponse(
    CompanyBillingResponse billing,
    BillingPaymentState paymentState,
    Long daysUntilDue,
    Long daysOverdue,
    boolean newCompany,
    Instant companyCreatedAt,
    String companyPhone,
    String companyTin,
    BillingPaymentMethod lastPaymentMethod,
    Instant lastPaymentAt
) {}
