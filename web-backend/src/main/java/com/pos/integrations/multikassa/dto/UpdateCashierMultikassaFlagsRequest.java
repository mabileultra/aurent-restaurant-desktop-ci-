package com.pos.integrations.multikassa.dto;

/**
 * Кассир может быстро вкл/выкл налог, QR и require без полного admin-диалога.
 * null = поле не менять.
 */
public record UpdateCashierMultikassaFlagsRequest(
    Boolean printFiscalQr,
    Boolean requireBeforeSale,
    Boolean enabled
) {
}
