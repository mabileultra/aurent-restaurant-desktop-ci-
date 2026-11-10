package com.pos.pharmacy.taxanalytics.service;

import com.pos.pharmacy.taxanalytics.dto.TaxAnalyticsReceiptDetailDto;
import com.pos.pharmacy.taxanalytics.dto.TaxAnalyticsReceiptRowDto;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface TaxAnalyticsVerticalReceiptService {

    Map<String, Object> receiptCounts(int companyId, LocalDate from, LocalDate to);

    long count(int companyId, LocalDate from, LocalDate to, String kind);

    List<TaxAnalyticsReceiptRowDto> list(int companyId, LocalDate from, LocalDate to, String kind, int limit, int offset);

    TaxAnalyticsReceiptDetailDto detail(int companyId, String saleId);

    List<Map<String, Object>> topProducts(int companyId, LocalDate from, LocalDate to, int limit);
}
