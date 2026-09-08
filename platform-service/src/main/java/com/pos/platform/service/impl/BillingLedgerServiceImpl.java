package com.pos.platform.service.impl;

import com.pos.platform.domain.BillingLedgerType;
import com.pos.platform.dto.billing.BillingLedgerResponse;
import com.pos.platform.dto.shared.PageResponse;
import com.pos.platform.entity.BillingLedgerEntry;
import com.pos.platform.entity.CompanyBilling;
import com.pos.platform.repository.BillingLedgerRepository;
import com.pos.platform.security.PlatformTenantContext;
import com.pos.platform.service.BillingLedgerService;
import com.pos.platform.service.support.BillingMapper;
import com.pos.platform.service.support.BillingMoney;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class BillingLedgerServiceImpl implements BillingLedgerService {

    private final BillingLedgerRepository ledgerRepository;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<BillingLedgerResponse> list(Integer companyId, BillingLedgerType type, Pageable pageable) {
        Page<BillingLedgerEntry> page = type == null
            ? ledgerRepository.findByCompanyIdOrderByCreatedAtDesc(companyId, pageable)
            : ledgerRepository.findByCompanyIdAndEntryTypeOrderByCreatedAtDesc(companyId, type, pageable);
        return PageResponse.from(page.map(BillingMapper::toLedger));
    }

    @Override
    @Transactional
    public void record(CompanyBilling billing, BigDecimal delta, BillingLedgerType type, String description) {
        BigDecimal next = BillingMoney.of(billing.getBalance().add(delta));
        billing.setBalance(next);
        ledgerRepository.save(BillingLedgerEntry.builder()
            .companyId(billing.getCompanyId())
            .entryType(type)
            .amount(BillingMoney.of(delta))
            .balanceAfter(next)
            .description(description)
            .actorUserId(PlatformTenantContext.getUserId())
            .actorRole(PlatformTenantContext.getRole())
            .build());
    }
}
