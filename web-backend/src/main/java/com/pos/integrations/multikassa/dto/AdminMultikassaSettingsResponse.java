package com.pos.integrations.multikassa.dto;

public record AdminMultikassaSettingsResponse(
    Long cashRegisterId,
    Integer storeId,
    Integer registerNumber,
    boolean enabled,
    String baseUrl,
    String terminalId,
    String moduleNumber,
    String selectedDriveId,
    String cashierNameOverride,
    boolean requireBeforeSale,
    boolean printFiscalQr,
    String suggestedLocalUrl8080,
    String suggestedLocalUrl12346,
    String suggestedCloudV3,
    String suggestedCloudV4,
    String fiscalProvider
) {
}
