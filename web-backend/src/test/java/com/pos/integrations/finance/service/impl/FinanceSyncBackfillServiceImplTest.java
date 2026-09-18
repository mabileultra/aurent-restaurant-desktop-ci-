package com.pos.integrations.finance.service.impl;

import com.pos.integrations.finance.service.support.FinanceIntegrationPublisher;
import com.pos.inventory.repository.StockReceiptRepository;
import com.pos.sales.repository.ZReportRepository;
import com.pos.service.support.TenantAccessSupport;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FinanceSyncBackfillServiceImplTest {

    @Mock
    private ZReportRepository zReportRepository;

    @Mock
    private StockReceiptRepository stockReceiptRepository;

    @Mock
    private FinanceIntegrationPublisher integrationPublisher;

    @Mock
    private TenantAccessSupport tenantAccess;

    private FinanceSyncBackfillServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new FinanceSyncBackfillServiceImpl(
            zReportRepository,
            stockReceiptRepository,
            integrationPublisher,
            tenantAccess
        );
        when(tenantAccess.effectiveCompanyIdOrNull()).thenReturn(7);
    }

    @Test
    void doesNotEnqueueZReportsWhenBackfillTypeIsSales() {
        var response = service.backfill(LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 19), Set.of("sales"));

        assertEquals(0, response.zReportsEnqueued());
        verify(zReportRepository, never()).findForFinanceBackfill(any(), any(), any());
        verify(integrationPublisher, never()).publishZReportIncomeAfterCommit(any());
    }
}
