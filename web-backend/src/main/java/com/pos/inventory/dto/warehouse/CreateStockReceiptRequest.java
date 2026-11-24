package com.pos.inventory.dto.warehouse;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record CreateStockReceiptRequest(
    UUID supplierId,
    Integer storeId,
    String notes,
    String paymentType,
    /** Внешний номер фактуры / e-счёт-фактуры (не путать с внутренним REC-…). */
    String invoiceNumber,
    LocalDate invoiceDate,
    String contractNumber,
    @NotEmpty @Valid List<StockReceiptLineRequest> lines
) {}
