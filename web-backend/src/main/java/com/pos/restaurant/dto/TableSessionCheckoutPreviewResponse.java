package com.pos.restaurant.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record TableSessionCheckoutPreviewResponse(
    UUID sessionId,
    Integer tableId,
    String tableCode,
    BigDecimal subtotal,
    BigDecimal orderDiscountAmount,
    BigDecimal total,
    List<TableSessionLineResponse> lines
) {}
