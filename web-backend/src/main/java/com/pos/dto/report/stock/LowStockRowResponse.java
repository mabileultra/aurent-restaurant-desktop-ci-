package com.pos.dto.report.stock;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record LowStockRowResponse(
    UUID productId,
    String productName,
    String sku,
    String barcode,
    Integer storeId,
    String storeName,
    BigDecimal stockQuantity,
    int lowStockAlert,
    BigDecimal deficit,
    BigDecimal costPrice,
    BigDecimal stockValueEstimate,
    Instant stockUpdatedAt
) {}
