package com.pos.platform.service.impl;

import com.pos.platform.domain.BillingPaymentMethod;
import com.pos.platform.domain.BillingPaymentProvider;
import com.pos.platform.domain.BillingPaymentStatus;
import com.pos.platform.entity.BillingPaymentIntent;
import com.pos.platform.entity.CompanyBilling;
import com.pos.platform.repository.BillingPaymentIntentRepository;
import com.pos.platform.repository.CompanyBillingRepository;
import com.pos.platform.service.BillingLedgerService;
import com.pos.platform.service.CompanyBillingAccountService;
import com.pos.platform.service.support.BillingAccessCache;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BillingPaymentCreditServiceImplTest {

    private static final UUID INTENT_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");

    @Mock
    private CompanyBillingAccountService accountService;
    @Mock
    private BillingLedgerService ledgerService;
    @Mock
    private CompanyBillingRepository companyBillingRepository;
    @Mock
    private BillingPaymentIntentRepository intentRepository;
    @Mock
    private BillingAccessCache accessCache;

    private BillingPaymentCreditServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new BillingPaymentCreditServiceImpl(
            accountService,
            ledgerService,
            companyBillingRepository,
            intentRepository,
            accessCache
        );
    }

    @Test
    void markPaid_alreadyPaid_skipsLedger() {
        BillingPaymentIntent intent = intent(BillingPaymentStatus.PAID);
        CompanyBilling billing = CompanyBilling.builder().companyId(7).balance(BigDecimal.ZERO).build();
        when(companyBillingRepository.findDetailedByCompanyIdForUpdate(7)).thenReturn(Optional.of(billing));
        when(intentRepository.findByIdForUpdate(INTENT_ID)).thenReturn(Optional.of(intent));

        service.markPaid(intent, "tx-1", "Пополнение через Click");

        verify(ledgerService, never()).recordPayment(any(), any(), any(), anyString());
        verify(accessCache, never()).evict(any());
    }

    @Test
    void markPaid_pending_creditsOnceAndEvictsAccess() {
        BillingPaymentIntent intent = intent(BillingPaymentStatus.PENDING);
        CompanyBilling billing = CompanyBilling.builder().companyId(7).balance(BigDecimal.ZERO).build();
        when(companyBillingRepository.findDetailedByCompanyIdForUpdate(7)).thenReturn(Optional.of(billing));
        when(intentRepository.findByIdForUpdate(INTENT_ID)).thenReturn(Optional.of(intent));
        when(intentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(companyBillingRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.markPaid(intent, "tx-1", "Пополнение через Click");

        verify(ledgerService).recordPayment(
            eq(billing), eq(new BigDecimal("100000.00")), eq(BillingPaymentMethod.valueOf(intent.getProvider().name())), anyString());
        assertThat(intent.getStatus()).isEqualTo(BillingPaymentStatus.PAID);
        verify(accessCache).evict(7);
    }

    @Test
    void markPaid_underSimulatedRowLock_onlyFirstCredits() throws Exception {
        BillingPaymentIntent shared = intent(BillingPaymentStatus.PENDING);
        CompanyBilling billing = CompanyBilling.builder().companyId(7).balance(BigDecimal.ZERO).build();
        Object rowLock = new Object();
        when(companyBillingRepository.findDetailedByCompanyIdForUpdate(7)).thenAnswer(inv -> {
            synchronized (rowLock) {
                return Optional.of(billing);
            }
        });
        when(intentRepository.findByIdForUpdate(INTENT_ID)).thenAnswer(inv -> {
            synchronized (rowLock) {
                return Optional.of(shared);
            }
        });
        when(intentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(companyBillingRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        AtomicInteger credits = new AtomicInteger();
        org.mockito.Mockito.doAnswer(inv -> {
            synchronized (rowLock) {
                credits.incrementAndGet();
            }
            return null;
        }).when(ledgerService).recordPayment(any(), any(), any(), anyString());

        // Simulate DB row lock: whole markPaid critical path under one lock via mock answers
        // is not enough alone — wrap service call in same lock order as production (billing then intent).
        int threads = 20;
        CountDownLatch start = new CountDownLatch(1);
        CountDownLatch done = new CountDownLatch(threads);
        ExecutorService pool = Executors.newFixedThreadPool(threads);
        for (int i = 0; i < threads; i++) {
            pool.submit(() -> {
                try {
                    start.await();
                    synchronized (rowLock) {
                        service.markPaid(shared, "tx-1", "Пополнение через Click");
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                } finally {
                    done.countDown();
                }
            });
        }
        start.countDown();
        assertThat(done.await(5, TimeUnit.SECONDS)).isTrue();
        pool.shutdownNow();

        assertThat(credits.get()).isEqualTo(1);
        assertThat(shared.getStatus()).isEqualTo(BillingPaymentStatus.PAID);
        verify(ledgerService, times(1)).recordPayment(any(), any(), any(), anyString());
    }

    private static BillingPaymentIntent intent(BillingPaymentStatus status) {
        return BillingPaymentIntent.builder()
            .id(INTENT_ID)
            .companyId(7)
            .provider(BillingPaymentProvider.CLICK)
            .amount(new BigDecimal("100000.00"))
            .currency("UZS")
            .status(status)
            .build();
    }
}
