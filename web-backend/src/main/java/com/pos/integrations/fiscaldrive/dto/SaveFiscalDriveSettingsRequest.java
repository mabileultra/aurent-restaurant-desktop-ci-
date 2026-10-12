package com.pos.integrations.fiscaldrive.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record SaveFiscalDriveSettingsRequest(
    @NotBlank @Size(max = 512) String baseUrl,
    @Size(max = 64) String factoryId,
    @Size(max = 32) String terminalId,
    @Pattern(regexp = "^$|^\\d{9}$|^\\d{14}$", message = "ИНН — 9 цифр или ПИНФЛ — 14 цифр")
    String ownerTin,
    /** true → касса фискализирует через FiscalDrive; false → вернуть Multikassa; null → не менять. */
    Boolean useForFiscalization
) {
}
