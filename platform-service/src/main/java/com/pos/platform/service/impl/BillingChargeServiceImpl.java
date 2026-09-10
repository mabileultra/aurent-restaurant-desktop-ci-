package com.pos.platform.service.impl;

import com.pos.platform.entity.CompanyBilling;
import com.pos.platform.repository.CompanyBillingRepository;
import com.pos.platform.service.BillingChargeService;
import com.pos.platform.service.CompanyBillingAccountService;
import com.pos.platform.service.support.BillingAccessCache;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class BillingChargeServiceImpl implements BillingChargeService {

    private final CompanyBillingRepository companyBillingRepository;
    private final CompanyBillingAccountService accountService;
    private final BillingAccessCache accessCache;

    @Override
    @Transactional
    public int runDueCharges() {
        Instant now = Instant.now();
        int charged = 0;
        for (CompanyBilling due : companyBillingRepository.findDueForCharge(now)) {
            CompanyBilling billing = companyBillingRepository
                .findDetailedByCompanyIdForUpdate(due.getCompanyId())
                .orElse(due);
            int applied = accountService.applyDueCharges(billing, now);
            if (applied > 0) {
                charged += applied;
                accessCache.evict(billing.getCompanyId());
            }
            companyBillingRepository.save(billing);
        }
        return charged;
    }
}
