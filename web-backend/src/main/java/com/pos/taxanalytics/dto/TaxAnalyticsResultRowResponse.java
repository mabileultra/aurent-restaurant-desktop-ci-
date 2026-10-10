package com.pos.taxanalytics.dto;

import java.math.BigDecimal;

public record TaxAnalyticsResultRowResponse(
    String code,
    String nameRu,
    String nameUz,
    long enterprises,
    long connected,
    BigDecimal connectedSharePct,
    long notConnected,
    BigDecimal notConnectedSharePct,
    BigDecimal fiscalTurnover,
    BigDecimal nonFiscalTurnover,
    BigDecimal totalTurnover,
    BigDecimal fiscalSharePct,
    BigDecimal turnoverDeltaPct,
    /** REGION | DISTRICT | ENTERPRISE */
    String level
) {}
