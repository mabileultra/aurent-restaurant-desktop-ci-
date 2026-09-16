package com.pos.pharmacy.revenue.support;

import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.catalog.support.PharmacyPackSupport;
import com.pos.pharmacy.sales.entity.Sale;
import com.pos.pharmacy.sales.entity.SaleItem;
import com.pos.pharmacy.util.QuantityUtil;
import com.pos.shared.event.SaleCompletedEvent;
import com.pos.shared.event.SaleLineSnapshot;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public final class PharmacySaleCompletedFactory {

    private static final ZoneId DEFAULT_ZONE = ZoneId.of("Asia/Tashkent");

    private PharmacySaleCompletedFactory() {}

    public static SaleCompletedEvent from(
        Sale sale,
        Map<UUID, Map<String, String>> attributesByProductId,
        String storeName
    ) {
        Map<UUID, Map<String, String>> attrs = attributesByProductId != null ? attributesByProductId : Map.of();
        LocalDate transactionDate = sale.getCreatedAt() != null
            ? sale.getCreatedAt().atZone(DEFAULT_ZONE).toLocalDate()
            : LocalDate.now(DEFAULT_ZONE);
        return new SaleCompletedEvent(
            sale.getCompanyId(),
            sale.getStoreId(),
            sale.getId(),
            sale.getReceiptNumber(),
            sale.getTotalAmount(),
            sale.getCashAmount(),
            sale.getCardAmount(),
            sale.getPaymentMethod() != null ? sale.getPaymentMethod().name() : null,
            transactionDate,
            sale.getCashierId(),
            sumItemsSold(sale, attrs),
            storeName,
            sale.getCashierName(),
            sale.getStatus() != null ? sale.getStatus().name() : "COMPLETED",
            mapLines(sale, attrs)
        );
    }

    private static long sumItemsSold(Sale sale, Map<UUID, Map<String, String>> attrs) {
        long total = 0L;
        if (sale.getItems() == null) {
            return total;
        }
        for (SaleItem item : sale.getItems()) {
            Product product = item.getProduct();
            Map<String, String> productAttrs = product != null
                ? attrs.getOrDefault(product.getId(), Map.of())
                : Map.of();
            BigDecimal netQty = QuantityUtil.subtract(item.getQuantity(), item.getReturnedQuantity());
            if (netQty.signum() > 0) {
                total += PharmacyPackSupport.reportableUnits(
                    product, item.getUnitPrice(), netQty, productAttrs
                );
            }
        }
        return total;
    }

    private static List<SaleLineSnapshot> mapLines(Sale sale, Map<UUID, Map<String, String>> attrs) {
        if (sale.getItems() == null || sale.getItems().isEmpty()) {
            return List.of();
        }
        List<SaleLineSnapshot> lines = new ArrayList<>();
        for (SaleItem item : sale.getItems()) {
            if (item.getProductName() == null || item.getProductName().isBlank()) {
                continue;
            }
            Product product = item.getProduct();
            Map<String, String> productAttrs = product != null
                ? attrs.getOrDefault(product.getId(), Map.of())
                : Map.of();
            BigDecimal itemQty = item.getQuantity() != null ? item.getQuantity() : BigDecimal.ZERO;
            BigDecimal returnedQty = item.getReturnedQuantity() != null ? item.getReturnedQuantity() : BigDecimal.ZERO;
            BigDecimal netQty = QuantityUtil.subtract(itemQty, returnedQty).max(BigDecimal.ZERO);
            long quantity = PharmacyPackSupport.reportableUnits(product, item.getUnitPrice(), itemQty, productAttrs);
            long quantityReturned = PharmacyPackSupport.reportableUnits(
                product, item.getUnitPrice(), returnedQty, productAttrs
            );
            BigDecimal revenue = proportionalRevenue(item, netQty);
            BigDecimal costEstimate = PharmacyPackSupport.costEstimate(
                product, item.getUnitPrice(), netQty, productAttrs
            );
            lines.add(new SaleLineSnapshot(
                product != null ? product.getId() : null,
                item.getProductName(),
                product != null ? product.getSku() : null,
                product != null ? product.getBarcode() : null,
                product != null ? product.getCategoryId() : null,
                null,
                quantity,
                quantityReturned,
                revenue,
                costEstimate
            ));
        }
        return lines;
    }

    private static BigDecimal proportionalRevenue(SaleItem item, BigDecimal netQty) {
        if (netQty.signum() <= 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        BigDecimal qty = QuantityUtil.normalize(item.getQuantity());
        if (netQty.compareTo(qty) >= 0) {
            return item.getLineTotal() != null ? item.getLineTotal() : BigDecimal.ZERO;
        }
        BigDecimal lineTotal = item.getLineTotal() != null ? item.getLineTotal() : BigDecimal.ZERO;
        return lineTotal.multiply(netQty).divide(qty, 2, RoundingMode.HALF_UP);
    }
}
