package com.pos.platform.service;

import com.pos.platform.dto.billing.CompanyBillingResponse;
import com.pos.platform.dto.billing.GrantDeferralRequest;

/** Индивидуальная отсрочка оплаты компании (без блокировки до указанной даты). */
public interface BillingDeferralService {

    CompanyBillingResponse grantDeferral(Integer companyId, GrantDeferralRequest request);

    CompanyBillingResponse cancelDeferral(Integer companyId);
}
