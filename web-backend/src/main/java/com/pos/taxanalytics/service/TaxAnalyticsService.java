package com.pos.taxanalytics.service;

import com.pos.taxanalytics.dto.TaxAnalyticsOverviewResponse;
import com.pos.taxanalytics.dto.TaxAnalyticsResultsResponse;

import java.time.LocalDate;

public interface TaxAnalyticsService {

    TaxAnalyticsOverviewResponse overview(String period, LocalDate from, LocalDate to);

    TaxAnalyticsResultsResponse results(
        String period,
        LocalDate from,
        LocalDate to,
        String regionCode,
        String districtCode,
        String connectionStatus,
        String search,
        String level,
        int page,
        int size
    );
}
