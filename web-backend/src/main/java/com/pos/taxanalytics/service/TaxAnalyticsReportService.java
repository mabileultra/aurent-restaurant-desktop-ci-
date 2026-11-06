package com.pos.taxanalytics.service;

import com.pos.taxanalytics.dto.TaxAnalyticsCompareResponse;
import com.pos.taxanalytics.dto.TaxAnalyticsDailyResponse;
import com.pos.taxanalytics.dto.TaxAnalyticsReceiptListResponse;

import java.time.LocalDate;

public interface TaxAnalyticsReportService {

    TaxAnalyticsDailyResponse daily(String period, LocalDate from, LocalDate to);

    TaxAnalyticsReceiptListResponse receipts(
        String period,
        LocalDate from,
        LocalDate to,
        String regionCode,
        String connectionStatus,
        String search,
        int page,
        int size
    );

    TaxAnalyticsCompareResponse compare(
        String period,
        LocalDate from,
        LocalDate to,
        String comparePeriod,
        LocalDate compareFrom,
        LocalDate compareTo
    );

    String exportCsv(String period, LocalDate from, LocalDate to);
}
