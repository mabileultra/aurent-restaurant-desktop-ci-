package com.pos.reporting.service.impl;

import com.pos.reporting.dto.ReturnsSummaryResponse;
import com.pos.reporting.repository.SaleFactRepository;
import com.pos.reporting.security.ReportingTenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReturnsSummaryServiceImplTest {

    @Mock
    private SaleFactRepository saleFactRepository;

    @InjectMocks
    private ReturnsSummaryServiceImpl service;

    @AfterEach
    void clearTenant() {
        ReportingTenantContext.clear();
    }

    @Test
    void usesReturnedAmountNotRemainingSaleTotal() {
        ReportingTenantContext.setCompanyId(7);
        LocalDate from = LocalDate.of(2026, 9, 1);
        LocalDate to = LocalDate.of(2026, 9, 19);
        when(saleFactRepository.aggregateReturns(7, from, to))
            .thenReturn(new Object[] { 2L, new BigDecimal("18500.00") });

        ReturnsSummaryResponse summary = service.summary(from, to);

        assertEquals(2L, summary.returnsCount());
        assertEquals(new BigDecimal("18500.00"), summary.returnsAmount());
    }
}
