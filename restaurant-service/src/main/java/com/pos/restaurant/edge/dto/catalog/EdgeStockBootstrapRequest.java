package com.pos.restaurant.edge.dto.catalog;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record EdgeStockBootstrapRequest(
    String bootstrapSecret,
    @NotNull Integer companyId,
    @NotNull Integer storeId,
    @NotEmpty List<ProductRow> products
) {
    public record ProductRow(
        @NotNull UUID id,
        String sku,
        @NotNull String name,
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
        Boolean active
    ) {}
}
