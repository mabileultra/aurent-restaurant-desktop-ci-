package com.pos.dto.report.sales;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record ProductSalesRowResponse(
    UUID productId,
    String productName,
    String sku,
    String barcode,
    String categoryName,
    long quantitySold,
    long quantityReturned,
    long netQuantity,
    BigDecimal revenue,
    BigDecimal costEstimate,
    BigDecimal margin,
    LocalDate firstSaleDate,
    LocalDate lastSaleDate,
    Instant lastActivityAt,
    Integer storeId,
    String storeName
) {}
