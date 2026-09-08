package com.pos.platform.service.impl;

import com.pos.platform.domain.BillingAccountStatus;
import com.pos.platform.domain.BillingLedgerType;
import com.pos.platform.entity.CompanyBilling;
import com.pos.platform.repository.CompanyBillingRepository;
import com.pos.platform.service.BillingChargeService;
import com.pos.platform.service.BillingLedgerService;
import com.pos.platform.service.CompanyBillingAccountService;
import com.pos.platform.service.support.BillingMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class BillingChargeServiceImpl implements BillingChargeService {

    private final CompanyBillingRepository companyBillingRepository;
    private final CompanyBillingAccountService accountService;
    private final BillingLedgerService ledgerService;

    @Value("${app.billing.grace-days:3}")
    private int graceDays;

    @Override
    @Transactional
    public int runDueCharges() {
        Instant now = Instant.now();
        int charged = 0;
        for (CompanyBilling billing : companyBillingRepository.findDueForCharge(now)) {
            if (tryCharge(billing, now)) {
                charged++;
            }
            companyBillingRepository.save(billing);
        }
        return charged;
    }

    private boolean tryCharge(CompanyBilling billing, Instant now) {
        BigDecimal total = BillingMapper.monthlyTotal(billing);
        if (total.signum() <= 0) {
            accountService.advancePeriod(billing, now);
            billing.setStatus(BillingAccountStatus.ACTIVE);
            billing.setGraceUntil(null);
            return false;
        }
        if (billing.getBalance().compareTo(total) >= 0) {
            ledgerService.record(
                billing,
                total.negate(),
                BillingLedgerType.CHARGE,
                "Ежемесячное списание: " + (billing.getPlan() != null ? billing.getPlan().getName() : "тариф")
            );
            accountService.advancePeriod(billing, now);
            billing.setStatus(BillingAccountStatus.ACTIVE);
            billing.setGraceUntil(null);
            return true;
        }
        if (billing.getStatus() != BillingAccountStatus.GRACE && billing.getStatus() != BillingAccountStatus.BLOCKED) {
            billing.setStatus(BillingAccountStatus.GRACE);
            billing.setGraceUntil(now.plus(graceDays, ChronoUnit.DAYS));
            return false;
        }
        if (billing.getGraceUntil() != null && now.isAfter(billing.getGraceUntil())) {
            billing.setStatus(BillingAccountStatus.BLOCKED);
            return false;
        }
        if (billing.getStatus() == BillingAccountStatus.GRACE
            && billing.getGraceUntil() != null
            && !now.isAfter(billing.getGraceUntil())) {
            return false;
        }
        billing.setStatus(BillingAccountStatus.BLOCKED);
        return false;
    }
}
