package com.pos.dto.order;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record CustomerOrderDetailResponse(
    long id,
    Integer storeId,
    String storeName,
    Instant createdAt,
    String externalNumber,
    String clientName,
    String clientPhone,
    String deliveryAddress,
    String comment,
    UUID courierId,
    String courierName,
    BigDecimal totalAmount,
    String status
) {}
