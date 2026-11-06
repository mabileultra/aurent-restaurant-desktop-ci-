package com.pos.pharmacy.warehouse.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record PharmacyInventoryLineResponse(
    UUID id,
    UUID productId,
    String productName,
    String productSku,
    BigDecimal systemQuantity,
    BigDecimal countedQuantity,
    BigDecimal difference
) {}
