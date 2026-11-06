package com.pos.pharmacy.warehouse.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record PharmacyTransferResponse(
    UUID id,
    String transferNumber,
    Integer fromStoreId,
    Integer toStoreId,
    String fromStoreName,
    String toStoreName,
    UUID sourceReceiptId,
    String sourceReceiptNumber,
    String notes,
    BigDecimal totalQuantity,
    Instant createdAt,
    List<PharmacyTransferLineResponse> lines
) {}
