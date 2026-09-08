package com.pos.platform.service;

import com.pos.platform.domain.BillingLedgerType;
import com.pos.platform.dto.billing.BillingLedgerResponse;
import com.pos.platform.dto.shared.PageResponse;
import com.pos.platform.entity.CompanyBilling;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.UUID;

public interface BillingLedgerService {

    PageResponse<BillingLedgerResponse> list(Integer companyId, BillingLedgerType type, Pageable pageable);

    BillingLedgerResponse get(Integer companyId, UUID entryId);

    void record(CompanyBilling billing, BigDecimal delta, BillingLedgerType type, String description);

    void delete(Integer companyId, UUID entryId);

    long deleteMany(Integer companyId, Collection<UUID> ids);

    long deleteAll(Integer companyId);
}
