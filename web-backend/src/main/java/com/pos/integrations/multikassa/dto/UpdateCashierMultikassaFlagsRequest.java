package com.pos.integrations.multikassa.dto;

/**
 * Кассир может быстро вкл/выкл QR (и опционально require) без полного admin-диалога.
 * null = поле не менять.
 */
public record UpdateCashierMultikassaFlagsRequest(
    Boolean printFiscalQr,
    Boolean requireBeforeSale
) {
}
