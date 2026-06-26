package com.pos.reporting.mapper;

import com.pos.reporting.dto.CategorySalesRowResponse;
import com.pos.reporting.dto.ProductSalesRowResponse;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

@Component
public class SaleReportRowMapper {

    public ProductSalesRowResponse toProductSalesRow(Object[] row) {
        UUID productId = parseProductId(row[0]);
        String name = row[1] != null ? row[1].toString() : "";
        String sku = row[2] != null ? row[2].toString() : "";
        String barcode = row[3] != null ? row[3].toString() : "";
        String category = row[4] != null ? row[4].toString() : "";
        long netQty = toLong(row[5]);
        long returnedQty = toLong(row[6]);
        BigDecimal revenue = toBigDecimal(row[7]);
        BigDecimal cost = toBigDecimal(row[8]);
        long soldQty = netQty + returnedQty;
        BigDecimal margin = revenue.subtract(cost).setScale(2, RoundingMode.HALF_UP);
        return new ProductSalesRowResponse(
            productId,
            name,
            sku,
            barcode,
            category,
            soldQty,
            returnedQty,
            netQty,
            revenue,
            cost,
            margin
        );
    }

    public CategorySalesRowResponse toCategorySalesRow(Object[] row) {
        Integer categoryId = row[0] != null ? ((Number) row[0]).intValue() : null;
        String categoryName = row[1] != null ? row[1].toString() : "";
        long receiptCount = toLong(row[2]);
        long netQty = toLong(row[3]);
        long returnedQty = toLong(row[4]);
        BigDecimal revenue = toBigDecimal(row[5]);
        BigDecimal cost = toBigDecimal(row[6]);
        BigDecimal margin = revenue.subtract(cost).setScale(2, RoundingMode.HALF_UP);
        return new CategorySalesRowResponse(
            categoryId,
            categoryName,
            receiptCount,
            netQty,
            returnedQty,
            revenue,
            cost,
            margin
        );
    }

    private static long toLong(Object value) {
        if (value == null) {
            return 0L;
        }
        return ((Number) value).longValue();
    }

    private static BigDecimal toBigDecimal(Object value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        if (value instanceof BigDecimal bd) {
            return bd;
        }
        return new BigDecimal(value.toString());
    }

    private static UUID parseProductId(Object value) {
        if (value == null || value.toString().isBlank()) {
            return null;
        }
        try {
            return UUID.fromString(value.toString());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }
}
