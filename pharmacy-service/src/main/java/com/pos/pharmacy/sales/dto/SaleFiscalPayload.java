package com.pos.pharmacy.sales.dto;

import jakarta.validation.constraints.Size;

/**
 * Результат фискализации на кассе (Multikassa localhost / cloud),
 * передаётся в create sale после успешного POST /api/v1/operations.
 */
public record SaleFiscalPayload(
    @Size(max = 32) String fiscalStatus,
    @Size(max = 128) String fiscalSign,
    @Size(max = 64) String fiscalReceiptSeq,
    @Size(max = 128) String multikassaSaleId,
    @Size(max = 1024) String fiscalQrUrl,
    @Size(max = 1000) String fiscalError,
    /** Terminal ID ФМ (параметр t в ofd.soliq.uz) — нужен для пересборки QR. */
    @Size(max = 128) String fiscalTerminalId
) {
}
