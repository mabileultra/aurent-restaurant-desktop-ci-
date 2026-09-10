package com.pos.platform.service.impl;

import com.pos.platform.domain.BillingAccountStatus;
import com.pos.platform.domain.BillingLedgerType;
import com.pos.platform.entity.CompanyBilling;
import com.pos.platform.repository.BillingTopUpRequestRepository;
import com.pos.platform.repository.CompanyBillingRepository;
import com.pos.platform.repository.CompanyRepository;
import com.pos.platform.service.BillingLedgerService;
import com.pos.platform.service.BillingPlanService;
import com.pos.platform.service.support.BillingAccessCache;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;

@ExtendWith(MockitoExtension.class)
class CompanyBillingAccountServiceImplApplyDueChargesTest {

    @Mock
    private CompanyBillingRepository companyBillingRepository;
    @Mock
    private CompanyRepository companyRepository;
    @Mock
    private BillingTopUpRequestRepository topUpRepository;
    @Mock
    private BillingPlanService planService;
    @Mock
    private BillingLedgerService ledgerService;
    @Mock
    private BillingAccessCache accessCache;

    private CompanyBillingAccountServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new CompanyBillingAccountServiceImpl(
            companyBillingRepository,
            companyRepository,
            topUpRepository,
            planService,
            ledgerService,
            accessCache
        );
        ReflectionTestUtils.setField(service, "graceDays", 3);
    }

    @Test
    void applyDueCharges_prepaidThreeMonths_chargesExactlyThreeThenGrace() {
        Instant start = Instant.parse("2026-01-01T00:00:00Z");
        CompanyBilling billing = CompanyBilling.builder()
            .companyId(1)
            .balance(new BigDecimal("300000.00"))
            .addonMonthlyAmount(new BigDecimal("100000.00"))
            .billingEnabled(true)
            .autoChargeEnabled(true)
            .status(BillingAccountStatus.ACTIVE)
            .nextChargeAt(start)
            .paidUntil(start.plus(30, ChronoUnit.DAYS))
            .build();

        AtomicInteger charges = new AtomicInteger();
        doAnswer(inv -> {
            BigDecimal delta = inv.getArgument(1);
            billing.setBalance(billing.getBalance().add(delta));
            charges.incrementAndGet();
            return null;
        }).when(ledgerService).record(eq(billing), any(), eq(BillingLedgerType.CHARGE), anyString());

        Instant now = start.plus(100, ChronoUnit.DAYS);
        int applied = service.applyDueCharges(billing, now);

        assertThat(applied).isEqualTo(3);
        assertThat(charges.get()).isEqualTo(3);
        assertThat(billing.getBalance()).isEqualByComparingTo("0.00");
        assertThat(billing.getStatus()).isEqualTo(BillingAccountStatus.GRACE);

        int again = service.applyDueCharges(billing, now.plus(1, ChronoUnit.DAYS));
        assertThat(again).isEqualTo(0);
        assertThat(charges.get()).isEqualTo(3);
    }

    @Test
    void applyDueCharges_zeroTariff_advancesWithoutDebit() {
        Instant start = Instant.now().minus(1, ChronoUnit.DAYS);
        CompanyBilling billing = CompanyBilling.builder()
            .companyId(1)
            .balance(new BigDecimal("50000.00"))
            .addonMonthlyAmount(BigDecimal.ZERO)
            .billingEnabled(true)
            .autoChargeEnabled(true)
            .status(BillingAccountStatus.ACTIVE)
            .nextChargeAt(start)
            .build();

        int applied = service.applyDueCharges(billing, Instant.now());

        assertThat(applied).isEqualTo(0);
        assertThat(billing.getBalance()).isEqualByComparingTo("50000.00");
        assertThat(billing.getNextChargeAt()).isAfter(start);
        assertThat(billing.getStatus()).isEqualTo(BillingAccountStatus.ACTIVE);
    }
}
