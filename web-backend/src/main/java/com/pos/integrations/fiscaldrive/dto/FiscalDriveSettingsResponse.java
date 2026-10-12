package com.pos.integrations.fiscaldrive.dto;

public record FiscalDriveSettingsResponse(
    Long cashRegisterId,
    String baseUrl,
    String factoryId,
    String terminalId,
    String ownerTin,
    String defaultBaseUrl,
    String fiscalProvider,
    boolean useForFiscalization
) {
}
