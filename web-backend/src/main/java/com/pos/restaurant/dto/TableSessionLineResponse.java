package com.pos.restaurant.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record TableSessionLineResponse(
    UUID id,
    UUID productId,
    String productName,
    String productCode,
    BigDecimal quantity,
    BigDecimal unitPrice,
    BigDecimal lineDiscountPercent,
    BigDecimal lineTotal,
    String note,
    String kitchenStatus,
    String kitchenDepartment,
    boolean kitchenRoutable,
    int sortOrder
) {}
