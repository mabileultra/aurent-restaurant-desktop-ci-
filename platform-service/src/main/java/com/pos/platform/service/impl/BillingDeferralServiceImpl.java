package com.pos.platform.service.impl;

import com.pos.platform.domain.BillingAccountStatus;
import com.pos.platform.dto.billing.CompanyBillingResponse;
import com.pos.platform.dto.billing.GrantDeferralRequest;
import com.pos.platform.entity.CompanyBilling;
import com.pos.platform.exception.ResourceNotFoundException;
import com.pos.platform.repository.CompanyBillingRepository;
import com.pos.platform.service.BillingDeferralService;
import com.pos.platform.service.CompanyBillingAccountService;
import com.pos.platform.service.support.BillingAccessCache;
import com.pos.platform.service.support.BillingMapper;
import com.pos.platform.service.support.BillingTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class BillingDeferralServiceImpl implements BillingDeferralService {

    private final CompanyBillingRepository companyBillingRepository;
    private final CompanyBillingAccountService accountService;
    private final BillingAccessCache accessCache;

    @Override
    @Transactional
    public CompanyBillingResponse grantDeferral(Integer companyId, GrantDeferralRequest request) {
        CompanyBilling billing = companyBillingRepository.findDetailedByCompanyIdForUpdate(companyId)
            .orElseGet(() -> accountService.requireOrCreateBilling(companyId));
        Instant until = BillingTime.startOfDay(request.until().plusDays(1));
        billing.setDeferredUntil(until);
        billing.setDeferralReason(request.reason() != null && !request.reason().isBlank() ? request.reason().trim() : null);
        if (billing.getStatus() == BillingAccountStatus.BLOCKED || billing.getStatus() == BillingAccountStatus.GRACE) {
            billing.setStatus(BillingAccountStatus.GRACE);
            billing.setGraceUntil(until);
        }
        CompanyBillingResponse saved = BillingMapper.toCompany(companyBillingRepository.save(billing));
        accessCache.evict(companyId);
        return saved;
    }

    @Override
    @Transactional
    public CompanyBillingResponse cancelDeferral(Integer companyId) {
        CompanyBilling billing = companyBillingRepository.findDetailedByCompanyIdForUpdate(companyId)
            .orElseThrow(() -> new ResourceNotFoundException("Биллинг для компании не настроен"));
        Instant now = Instant.now();
        billing.setDeferredUntil(null);
        billing.setDeferralReason(null);
        if (billing.getStatus() == BillingAccountStatus.GRACE
            && billing.getGraceUntil() != null && billing.getGraceUntil().isAfter(now)) {
            billing.setGraceUntil(now);
        }
        CompanyBillingResponse saved = BillingMapper.toCompany(companyBillingRepository.save(billing));
        accessCache.evict(companyId);
        return saved;
    }
}
