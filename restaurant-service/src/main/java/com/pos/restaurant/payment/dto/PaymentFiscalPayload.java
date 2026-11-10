package com.pos.restaurant.payment.dto;

import jakarta.validation.constraints.Size;

/**
 * Multikassa / OFD proof for a paid order.
 * QR URL is never stored — rebuild from sign + seq + terminal on the client.
 */
public record PaymentFiscalPayload(
    @Size(max = 32) String fiscalStatus,
    @Size(max = 128) String fiscalSign,
    @Size(max = 64) String fiscalReceiptSeq,
    @Size(max = 128) String multikassaSaleId,
    @Size(max = 64) String fiscalTerminalId
) {}
