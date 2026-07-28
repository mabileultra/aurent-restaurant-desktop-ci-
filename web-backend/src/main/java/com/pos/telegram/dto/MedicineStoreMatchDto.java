package com.pos.telegram.dto;

import java.math.BigDecimal;
import java.util.Map;

public record MedicineStoreMatchDto(
    Integer storeId,
    String storeName,
    String address,
    String phone,
    BigDecimal price,
    BigDecimal stockQuantity,
    Map<String, String> attributes
) {}
