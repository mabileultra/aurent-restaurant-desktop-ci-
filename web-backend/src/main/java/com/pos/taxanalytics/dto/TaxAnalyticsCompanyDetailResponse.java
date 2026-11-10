package com.pos.taxanalytics.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.util.List;

public record TaxAnalyticsCompanyDetailResponse(
    int companyId,
    String name,
    String tin,
    String businessType,
    String legalName,
    String address,
    String phone,
    String regionCode,
    String regionNameRu,
    String regionNameUz,
    String districtCode,
    String districtNameRu,
    String districtNameUz,
    boolean connected,
    String period,
    String from,
    String to,
    BigDecimal fiscalTurnover,
    BigDecimal nonFiscalTurnover,
    BigDecimal totalTurnover,
    long fiscalReceiptCount,
    long nonFiscalReceiptCount,
    BigDecimal averageCheck,
    String fiscalTerminalId,
    String firstSaleDate,
    String lastSaleDate,
    List<TaxAnalyticsCompanyWeekResponse> weeks,
    List<TaxAnalyticsCompanyDayResponse> days,
    List<TaxAnalyticsCompanyProductResponse> topProducts,
    TaxAnalyticsCompanySupplyResponse supplies
) {
    @JsonProperty("totalReceiptsCount")
    public long totalReceiptsCount() {
        return fiscalReceiptCount + nonFiscalReceiptCount;
    }

    @JsonProperty("fiscalReceiptsCount")
    public long fiscalReceiptsCount() {
        return fiscalReceiptCount;
    }

    @JsonProperty("nonFiscalReceiptsCount")
    public long nonFiscalReceiptsCount() {
        return nonFiscalReceiptCount;
    }

    @JsonProperty("avgReceiptAmount")
    public BigDecimal avgReceiptAmount() {
        return averageCheck;
    }
}
