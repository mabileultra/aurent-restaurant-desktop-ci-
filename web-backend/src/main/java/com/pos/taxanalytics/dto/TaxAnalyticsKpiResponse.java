package com.pos.taxanalytics.dto;

import java.math.BigDecimal;

public record TaxAnalyticsKpiResponse(
    long totalEnterprises,
    BigDecimal totalEnterprisesDeltaPct,
    long connected,
    BigDecimal connectedSharePct,
    BigDecimal connectedDeltaPct,
    long notConnected,
    BigDecimal notConnectedSharePct,
    BigDecimal notConnectedDeltaPct,
    BigDecimal totalTurnover,
    BigDecimal totalTurnoverDeltaPct,
    long newConnections,
    BigDecimal newConnectionsDeltaPct,
    long connectionErrors,
    BigDecimal connectionErrorsDeltaPct
) {}
