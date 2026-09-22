package com.pos.inventory.dto.warehouse;

import java.math.BigDecimal;
import java.util.UUID;

public record StockProductionLineResponse(
    UUID id,
    UUID productId,
    String productName,
    String sku,
    BigDecimal quantity,
    BigDecimal unitCost,
    BigDecimal lineCost
) {}
