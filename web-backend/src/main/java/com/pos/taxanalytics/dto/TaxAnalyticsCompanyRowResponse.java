package com.pos.taxanalytics.dto;

import java.math.BigDecimal;

public record TaxAnalyticsCompanyRowResponse(
    int companyId,
    String name,
    String tin,
    String regionCode,
    String regionNameRu,
    String regionNameUz,
    String districtCode,
    String districtNameRu,
    String districtNameUz,
    boolean connected,
    BigDecimal fiscalTurnover,
    BigDecimal nonFiscalTurnover,
    BigDecimal totalTurnover,
    BigDecimal weekTurnover,
    BigDecimal prevWeekTurnover,
    BigDecimal weekDeltaAmount,
    BigDecimal weekDeltaPct
) {
}
