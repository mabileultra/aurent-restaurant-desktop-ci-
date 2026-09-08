package com.pos.platform.service.impl;

import com.pos.platform.entity.CompanyBilling;
import com.pos.platform.repository.CompanyBillingRepository;
import com.pos.platform.service.BillingChargeService;
import com.pos.platform.service.CompanyBillingAccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class BillingChargeServiceImpl implements BillingChargeService {

    private final CompanyBillingRepository companyBillingRepository;
    private final CompanyBillingAccountService accountService;

    @Override
    @Transactional
    public int runDueCharges() {
        Instant now = Instant.now();
        int charged = 0;
        for (CompanyBilling billing : companyBillingRepository.findDueForCharge(now)) {
            charged += accountService.applyDueCharges(billing, now);
            companyBillingRepository.save(billing);
        }
        return charged;
    }
}
