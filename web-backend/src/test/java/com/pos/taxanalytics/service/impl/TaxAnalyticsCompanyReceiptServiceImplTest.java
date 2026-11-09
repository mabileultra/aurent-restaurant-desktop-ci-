package com.pos.taxanalytics.service.impl;

import com.pos.taxanalytics.dto.TaxAnalyticsReceiptsResponse;
import com.pos.taxanalytics.repository.TaxAnalyticsReceiptQueryRepository;
import com.pos.taxanalytics.support.TaxAnalyticsPeriod;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TaxAnalyticsCompanyReceiptServiceImplTest {

    @Mock
    private TaxAnalyticsReceiptQueryRepository receipts;

    @InjectMocks
    private TaxAnalyticsCompanyReceiptServiceImpl service;

    @Test
    void withoutDatesFallsBackToLast30Days() {
        TaxAnalyticsPeriod expected = TaxAnalyticsPeriod.resolve("30d", null, null);
        when(receipts.count(eq(5), eq(expected.from()), eq(expected.to()), eq("ALL"))).thenReturn(0L);
        when(receipts.list(eq(5), eq(expected.from()), eq(expected.to()), eq("ALL"), anyInt(), anyInt()))
            .thenReturn(List.of());

        TaxAnalyticsReceiptsResponse response = service.list(5, null, null, null, "ALL", 0, 10);

        assertEquals(expected.from().toString(), response.from());
        assertEquals(expected.to().toString(), response.to());
        verify(receipts).count(5, expected.from(), expected.to(), "ALL");
    }

    @Test
    void fromToRangeDoesNotRequireDate() {
        LocalDate from = LocalDate.of(2026, 11, 1);
        LocalDate to = LocalDate.of(2026, 11, 8);
        when(receipts.count(eq(5), eq(from), eq(to), eq("ALL"))).thenReturn(2L);
        when(receipts.list(eq(5), eq(from), eq(to), eq("ALL"), eq(10), eq(0))).thenReturn(List.of());

        TaxAnalyticsReceiptsResponse response = service.list(5, null, from, to, "ALL", 0, 10);

        assertEquals("2026-11-01", response.from());
        assertEquals("2026-11-08", response.to());
        assertEquals(2L, response.totalElements());
        verify(receipts).list(5, from, to, "ALL", 10, 0);
    }
}
