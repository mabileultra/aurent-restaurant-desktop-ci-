package com.pos.inventory.dto.warehouse;

import java.math.BigDecimal;
import java.util.UUID;

public record StockExpenseLineResponse(
    UUID id,
    UUID productId,
    String productName,
    String sku,
    BigDecimal quantity
) {}
