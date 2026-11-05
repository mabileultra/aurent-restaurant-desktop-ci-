package com.pos.taxanalytics.service;

import com.pos.taxanalytics.dto.TaxAnalyticsReceiptDetailResponse;
import com.pos.taxanalytics.dto.TaxAnalyticsReceiptsResponse;

import java.time.LocalDate;
import java.util.UUID;

public interface TaxAnalyticsCompanyReceiptService {

    TaxAnalyticsReceiptsResponse list(
        int companyId,
        LocalDate date,
        LocalDate from,
        LocalDate to,
        String kind,
        int page,
        int size
    );

    TaxAnalyticsReceiptDetailResponse detail(int companyId, UUID saleId);
}
