package com.pos.catalog.dto.edge;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record EdgeStockIngestItem(
    UUID id,
    String sku,
    String name,
    String barcode,
    String unitCode,
    BigDecimal taxRate,
    BigDecimal costPrice,
    BigDecimal sellingPrice,
    BigDecimal stockQuantity,
    Integer lowStockAlert,
    String ikpu,
    String packageCode,
    String unitOfMeasure,
    String unitMeasureCode,
    Boolean markedProduct,
    Boolean active,
    Instant updatedAt
) {}
