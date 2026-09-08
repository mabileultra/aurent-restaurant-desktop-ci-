package com.pos.platform.service;

import com.pos.platform.domain.BillingLedgerType;
import com.pos.platform.dto.billing.BillingLedgerResponse;
import com.pos.platform.dto.shared.PageResponse;
import com.pos.platform.entity.CompanyBilling;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;

public interface BillingLedgerService {

    PageResponse<BillingLedgerResponse> list(Integer companyId, BillingLedgerType type, Pageable pageable);

    void record(CompanyBilling billing, BigDecimal delta, BillingLedgerType type, String description);
}
