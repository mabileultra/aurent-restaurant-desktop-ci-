package com.pos.integrations.multikassa.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SaveMultikassaSettingsRequest(
    boolean enabled,
    @NotBlank @Size(max = 512) String baseUrl,
    @Size(max = 128) String terminalId,
    @Size(max = 128) String moduleNumber,
    @Size(max = 128) String selectedDriveId,
    @Size(max = 200) String cashierNameOverride,
    boolean requireBeforeSale,
    /** null / отсутствует в старом клиенте → печатать QR (true). */
    Boolean printFiscalQr
) {
}
