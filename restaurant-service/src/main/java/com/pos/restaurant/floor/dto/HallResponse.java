package com.pos.restaurant.floor.dto;

import java.math.BigDecimal;

public record HallResponse(
    Integer id,
    Integer storeId,
    String name,
    int sortOrder,
    boolean active,
    int tableCount,
    BigDecimal servicePercent
) {}
