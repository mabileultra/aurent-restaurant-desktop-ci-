package com.pos.platform.service.impl;

import com.pos.platform.domain.BillingLedgerType;
import com.pos.platform.domain.BillingPaymentStatus;
import com.pos.platform.entity.BillingPaymentIntent;
import com.pos.platform.entity.CompanyBilling;
import com.pos.platform.repository.BillingPaymentIntentRepository;
import com.pos.platform.repository.CompanyBillingRepository;
import com.pos.platform.service.BillingLedgerService;
import com.pos.platform.service.BillingPaymentCreditService;
import com.pos.platform.service.CompanyBillingAccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class BillingPaymentCreditServiceImpl implements BillingPaymentCreditService {

    private final CompanyBillingAccountService accountService;
    private final BillingLedgerService ledgerService;
    private final CompanyBillingRepository companyBillingRepository;
    private final BillingPaymentIntentRepository intentRepository;

    @Override
    @Transactional
    public void markPaid(BillingPaymentIntent intent, String providerTransId, String description) {
        if (intent.getStatus() == BillingPaymentStatus.PAID) {
            return;
        }
        CompanyBilling billing = accountService.requireOrCreateBilling(intent.getCompanyId());
        ledgerService.record(billing, intent.getAmount(), BillingLedgerType.TOP_UP, description);
        accountService.refreshAccessStatus(billing, Instant.now());
        companyBillingRepository.save(billing);

        intent.setStatus(BillingPaymentStatus.PAID);
        intent.setProviderTransId(providerTransId);
        intent.setPaidAt(Instant.now());
        intentRepository.save(intent);
    }
}
