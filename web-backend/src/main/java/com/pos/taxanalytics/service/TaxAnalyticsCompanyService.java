package com.pos.taxanalytics.service;

import com.pos.taxanalytics.dto.TaxAnalyticsCompaniesResponse;
import com.pos.taxanalytics.dto.TaxAnalyticsCompanyDetailResponse;

import java.time.LocalDate;

public interface TaxAnalyticsCompanyService {

    TaxAnalyticsCompaniesResponse list(
        String period,
        LocalDate from,
        LocalDate to,
        String regionCode,
        String districtCode,
        String connectionStatus,
        String search,
        int page,
        int size
    );

    TaxAnalyticsCompanyDetailResponse detail(int companyId, String period, LocalDate from, LocalDate to);
}
