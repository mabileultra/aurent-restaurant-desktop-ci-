package com.pos.reporting.service.impl;

import com.pos.reporting.dto.SalesReportResponse;
import com.pos.reporting.repository.SaleFactRepository;
import com.pos.reporting.repository.SaleItemFactRepository;
import com.pos.reporting.security.ReportingTenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SalesReportServiceImplTest {

    @Mock
    private SaleFactRepository saleFactRepository;
    @Mock
    private SaleItemFactRepository saleItemFactRepository;
    @InjectMocks
    private SalesReportServiceImpl service;

    private MockedStatic<ReportingTenantContext> tenant;

    @BeforeEach
    void setUp() {
        tenant = mockStatic(ReportingTenantContext.class);
        tenant.when(ReportingTenantContext::requireCompanyId).thenReturn(7);
    }

    @AfterEach
    void tearDown() {
        tenant.close();
    }

    @Test
    void salesReportIncludesCashAndCardTotals() {
        LocalDate from = LocalDate.of(2026, 11, 21);
        LocalDate to = from;
        when(saleFactRepository.sumTotalByCompanyAndDateRange(7, from, to))
            .thenReturn(new BigDecimal("1607000.00"));
        when(saleFactRepository.countByCompanyIdAndTransactionDateBetween(7, from, to)).thenReturn(23L);
        when(saleFactRepository.sumItemsSoldByCompanyAndDateRange(7, from, to)).thenReturn(39L);
        when(saleItemFactRepository.sumCostEstimateByCompanyAndDateRange(7, from, to))
            .thenReturn(new BigDecimal("1096940.43"));
        when(saleFactRepository.sumCashByCompanyAndDateRange(eq(7), eq(from), eq(to)))
            .thenReturn(new BigDecimal("500000.00"));
        when(saleFactRepository.sumCardByCompanyAndDateRange(eq(7), eq(from), eq(to)))
            .thenReturn(new BigDecimal("1107000.00"));
        when(saleFactRepository.dailyRevenueByCompanyAndDateRange(any(), any(), any()))
            .thenReturn(List.of());

        SalesReportResponse report = service.salesReport(from, to);

        assertThat(report.cashTotal()).isEqualByComparingTo("500000.00");
        assertThat(report.cardTotal()).isEqualByComparingTo("1107000.00");
        assertThat(report.totalRevenue()).isEqualByComparingTo("1607000.00");
    }
}
