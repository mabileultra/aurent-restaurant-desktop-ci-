package com.pos.integrations.fiscal.dto;

/** Нейтральные возможности фискализации кассы. Не DTO Multikassa и не настройки админки FD. */
public record CashierFiscalCapabilitiesResponse(
    boolean enabled,
    Long cashRegisterId,
    String fiscalProvider,
    String baseUrl,
    String terminalId,
    String factoryId,
    String moduleNumber,
    boolean requireBeforeSale,
    boolean printFiscalQr
) {
}
