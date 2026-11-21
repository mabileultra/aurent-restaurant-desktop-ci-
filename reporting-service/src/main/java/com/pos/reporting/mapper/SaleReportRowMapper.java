package com.pos.reporting.mapper;

import com.pos.reporting.dto.CategorySalesRowResponse;
import com.pos.reporting.dto.ProductSalesRowResponse;
import com.pos.reporting.support.ReportingJdbcValues;
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
        long netQty = ReportingJdbcValues.toLong(row[5]);
        long returnedQty = ReportingJdbcValues.toLong(row[6]);
        BigDecimal revenue = ReportingJdbcValues.toMoney(row[7]);
        BigDecimal cost = ReportingJdbcValues.toMoney(row[8]);
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
            margin,
            ReportingJdbcValues.toLocalDate(row[9]),
            ReportingJdbcValues.toLocalDate(row[10]),
            ReportingJdbcValues.toInstant(row[11]),
            ReportingJdbcValues.toInteger(row[12]),
            row[13] != null ? row[13].toString() : null
        );
    }

    public CategorySalesRowResponse toCategorySalesRow(Object[] row) {
        Integer categoryId = ReportingJdbcValues.toInteger(row[0]);
        String categoryName = row[1] != null ? row[1].toString() : "";
        long receiptCount = ReportingJdbcValues.toLong(row[2]);
        long netQty = ReportingJdbcValues.toLong(row[3]);
        long returnedQty = ReportingJdbcValues.toLong(row[4]);
        BigDecimal revenue = ReportingJdbcValues.toMoney(row[5]);
        BigDecimal cost = ReportingJdbcValues.toMoney(row[6]);
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
