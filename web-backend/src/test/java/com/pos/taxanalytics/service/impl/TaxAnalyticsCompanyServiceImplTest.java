package com.pos.taxanalytics.service.impl;

import com.pos.exception.ResourceNotFoundException;
import com.pos.taxanalytics.dto.TaxAnalyticsCompaniesResponse;
import com.pos.taxanalytics.dto.TaxAnalyticsCompanyDetailResponse;
import com.pos.taxanalytics.repository.TaxAnalyticsCompanyQueryRepository;
import com.pos.taxanalytics.support.TaxAnalyticsPeriod;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TaxAnalyticsCompanyServiceImplTest {

    @Mock
    private TaxAnalyticsCompanyQueryRepository repository;

    @InjectMocks
    private TaxAnalyticsCompanyServiceImpl service;

    @Test
    void listMapsWeekDeltaFromRepositoryRows() {
        when(repository.countCompanies(isNull(), isNull(), isNull(), isNull())).thenReturn(1L);
        when(repository.listCompanies(any(), any(), isNull(), isNull(), isNull(), isNull(), eq(20), eq(0)))
            .thenReturn(List.of(companyRow()));

        TaxAnalyticsCompaniesResponse response = service.list("30d", null, null, null, null, null, null, 0, 20);

        assertEquals(1, response.rows().size());
        assertEquals(7, response.rows().get(0).companyId());
        assertEquals(new BigDecimal("100"), response.rows().get(0).totalTurnover());
        assertEquals(new BigDecimal("10"), response.rows().get(0).weekDeltaAmount());
        assertEquals(new BigDecimal("25.0"), response.rows().get(0).weekDeltaPct());
        assertEquals(true, response.rows().get(0).connected());
    }

    @Test
    void detailRejectsUnknownCompany() {
        when(repository.findCompany(9)).thenReturn(null);
        assertThrows(ResourceNotFoundException.class, () -> service.detail(9, "30d", null, null));
    }

    @Test
    void detailUsesPeriodTurnoverAndEightWeeks() {
        when(repository.findCompany(3)).thenReturn(Map.of(
            "name", "Firma",
            "connected", 0
        ));
        when(repository.periodTurnover(eq(3), any(TaxAnalyticsPeriod.class))).thenReturn(Map.of(
            "fiscal_turnover", new BigDecimal("15"),
            "non_fiscal_turnover", new BigDecimal("5")
        ));
        when(repository.dailyTurnover(eq(3), any(), any())).thenReturn(List.of());
        when(repository.topProducts(eq(3), any(TaxAnalyticsPeriod.class), eq(200))).thenReturn(List.of());
        when(repository.supplySummary(eq(3), any(TaxAnalyticsPeriod.class))).thenReturn(Map.of(
            "receipt_count", 0L,
            "total_quantity", BigDecimal.ZERO,
            "total_cost", BigDecimal.ZERO,
            "total_retail", BigDecimal.ZERO
        ));
        when(repository.supplyRows(eq(3), any(TaxAnalyticsPeriod.class), eq(200))).thenReturn(List.of());

        TaxAnalyticsCompanyDetailResponse detail = service.detail(3, "7d", null, null);

        assertEquals(new BigDecimal("20"), detail.totalTurnover());
        assertEquals(false, detail.connected());
        assertEquals(8, detail.weeks().size());
        assertEquals(7, detail.days().size());
        assertEquals(0, detail.topProducts().size());
        assertEquals(0, detail.supplies().receiptCount());
        verify(repository).dailyTurnover(eq(3), any(), any());
        verify(repository).periodTurnover(eq(3), any(TaxAnalyticsPeriod.class));
        verify(repository).findCompany(anyInt());
    }

    private static Map<String, Object> companyRow() {
        Map<String, Object> row = new HashMap<>();
        row.put("company_id", 7);
        row.put("name", "Firma");
        row.put("tin", "123");
        row.put("region_code", "01");
        row.put("region_name_ru", "Ташкент");
        row.put("region_name_uz", "Toshkent");
        row.put("district_code", "0101");
        row.put("district_name_ru", "Юнусабад");
        row.put("district_name_uz", "Yunusobod");
        row.put("connected", 1);
        row.put("fiscal_turnover", new BigDecimal("80"));
        row.put("non_fiscal_turnover", new BigDecimal("20"));
        row.put("week_turnover", new BigDecimal("50"));
        row.put("prev_week_turnover", new BigDecimal("40"));
        return row;
    }
}
