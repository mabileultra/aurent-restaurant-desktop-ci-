package com.pos.integrations.multikassa.dto;

public record CashierMultikassaCapabilitiesResponse(
    boolean enabled,
    Long cashRegisterId,
    String baseUrl,
    String terminalId,
    String moduleNumber,
    String selectedDriveId,
    String cashierNameOverride,
    boolean requireBeforeSale,
    boolean printFiscalQr,
    /** Провайдер фискализации кассы; без кассы — MULTIKASSA. */
    String fiscalProvider,
    /** FactoryID ФМ (только для FISCAL_DRIVE). */
    String factoryId
) {
}
