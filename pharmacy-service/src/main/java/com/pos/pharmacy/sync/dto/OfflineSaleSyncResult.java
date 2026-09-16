package com.pos.pharmacy.sync.dto;

import java.util.UUID;

public record OfflineSaleSyncResult(
    UUID clientSaleId,
    UUID serverSaleId,
    String serverReceiptNumber,
    String status,
    String errorMessage
) {}
