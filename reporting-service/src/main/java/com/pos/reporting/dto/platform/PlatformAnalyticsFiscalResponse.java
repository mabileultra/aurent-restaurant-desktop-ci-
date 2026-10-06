package com.pos.reporting.dto.platform;

import java.math.BigDecimal;
import java.util.List;

public record PlatformAnalyticsFiscalResponse(
    String period,
    String periodFrom,
    String periodTo,
    boolean demo,
    boolean approximate,
    PlatformFiscalKpi kpi,
    List<PlatformFiscalStoreRow> byStore
) {
    public record PlatformFiscalKpi(
        BigDecimal fiscalTurnover,
        long fiscalReceipts,
        BigDecimal avgCheck,
        BigDecimal returnsAmount,
        long returnsReceipts,
        long cancelledReceipts,
        BigDecimal taxBase,
        BigDecimal vat,
        boolean vatAvailable
    ) {}

    public record PlatformFiscalStoreRow(
        Integer storeId,
        String name,
        BigDecimal turnover,
        long receipts,
        BigDecimal returnsAmount,
        long cancelledReceipts
    ) {}
}
