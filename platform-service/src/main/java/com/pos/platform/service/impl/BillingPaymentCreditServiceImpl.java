package com.pos.platform.service.impl;

import com.pos.platform.domain.BillingLedgerType;
import com.pos.platform.domain.BillingPaymentMethod;
import com.pos.platform.domain.BillingPaymentProvider;
import com.pos.platform.domain.BillingPaymentStatus;
import com.pos.platform.entity.BillingPaymentIntent;
import com.pos.platform.entity.CompanyBilling;
import com.pos.platform.exception.ResourceNotFoundException;
import com.pos.platform.repository.BillingPaymentIntentRepository;
import com.pos.platform.repository.CompanyBillingRepository;
import com.pos.platform.service.BillingLedgerService;
import com.pos.platform.service.BillingPaymentCreditService;
import com.pos.platform.service.CompanyBillingAccountService;
import com.pos.platform.service.support.BillingAccessCache;
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
    private final BillingAccessCache accessCache;

    @Override
    @Transactional
    public void markPaid(BillingPaymentIntent intent, String providerTransId, String description) {
        Integer companyId = intent.getCompanyId();
        // Serialize money ops per company: Click complete retries / double callbacks.
        CompanyBilling billing = companyBillingRepository.findDetailedByCompanyIdForUpdate(companyId)
            .orElseGet(() -> accountService.requireOrCreateBilling(companyId));

        BillingPaymentIntent locked = intentRepository.findByIdForUpdate(intent.getId())
            .orElseThrow(() -> new ResourceNotFoundException("Платёж не найден"));
        if (locked.getStatus() == BillingPaymentStatus.PAID) {
            return;
        }

        ledgerService.recordPayment(billing, locked.getAmount(), methodOf(locked.getProvider()), description);
        accountService.refreshAccessStatus(billing, Instant.now());
        companyBillingRepository.save(billing);

        locked.setStatus(BillingPaymentStatus.PAID);
        locked.setProviderTransId(providerTransId);
        locked.setPaidAt(Instant.now());
        intentRepository.save(locked);
        accessCache.evict(companyId);
    }

    @Override
    @Transactional
    public void reversePaid(BillingPaymentIntent intent, String description) {
        Integer companyId = intent.getCompanyId();
        CompanyBilling billing = companyBillingRepository.findDetailedByCompanyIdForUpdate(companyId)
            .orElseGet(() -> accountService.requireOrCreateBilling(companyId));

        BillingPaymentIntent locked = intentRepository.findByIdForUpdate(intent.getId())
            .orElseThrow(() -> new ResourceNotFoundException("Платёж не найден"));
        if (locked.getStatus() != BillingPaymentStatus.PAID) {
            locked.setStatus(BillingPaymentStatus.CANCELLED);
            intentRepository.save(locked);
            return;
        }

        ledgerService.record(
            billing,
            locked.getAmount().negate(),
            BillingLedgerType.ADJUST,
            description
        );
        accountService.refreshAccessStatus(billing, Instant.now());
        companyBillingRepository.save(billing);

        locked.setStatus(BillingPaymentStatus.CANCELLED);
        locked.setErrorNote(description);
        intentRepository.save(locked);
        accessCache.evict(companyId);
    }

    private static BillingPaymentMethod methodOf(BillingPaymentProvider provider) {
        return provider != null ? BillingPaymentMethod.valueOf(provider.name()) : BillingPaymentMethod.OTHER;
    }
}
