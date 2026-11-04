package com.pos.pharmacy.catalog.support;

import com.pos.pharmacy.warehouse.entity.Supplier;
import com.pos.pharmacy.warehouse.repository.StockReceiptLineRepository;
import com.pos.pharmacy.warehouse.repository.SupplierRepository;
import com.pos.pharmacy.warehouse.support.ProductReceiptOrigin;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Latest receipt origin per product (by documentDate, then createdAt).
 */
@Component
@RequiredArgsConstructor
public class ProductReceiptOriginLoader {

    private final StockReceiptLineRepository stockReceiptLineRepository;
    private final SupplierRepository supplierRepository;

    public Map<UUID, Map<String, String>> loadAttrMaps(Collection<UUID> productIds) {
        if (productIds == null || productIds.isEmpty()) {
            return Map.of();
        }
        List<ProductReceiptOrigin> rows = stockReceiptLineRepository.findOriginsByProductIds(productIds);
        Map<UUID, ProductReceiptOrigin> latest = new HashMap<>();
        for (ProductReceiptOrigin row : rows) {
            if (row == null || row.productId() == null) {
                continue;
            }
            ProductReceiptOrigin prev = latest.get(row.productId());
            if (prev == null || isNewer(row, prev)) {
                latest.put(row.productId(), row);
            }
        }
        Set<UUID> supplierIds = new HashSet<>();
        for (ProductReceiptOrigin row : latest.values()) {
            if (row.supplierId() != null) {
                supplierIds.add(row.supplierId());
            }
        }
        Map<UUID, String> supplierNames = new HashMap<>();
        if (!supplierIds.isEmpty()) {
            for (Supplier supplier : supplierRepository.findAllById(supplierIds)) {
                if (supplier != null && supplier.getId() != null) {
                    supplierNames.put(supplier.getId(), supplier.getName());
                }
            }
        }
        Map<UUID, Map<String, String>> out = new HashMap<>();
        for (Map.Entry<UUID, ProductReceiptOrigin> e : latest.entrySet()) {
            ProductReceiptOrigin o = e.getValue();
            Map<String, String> attrs = new HashMap<>(6);
            if (o.receiptId() != null) {
                attrs.put(ProductReceiptOriginAttrs.RECEIPT_ID, o.receiptId().toString());
            }
            if (o.receiptNumber() != null) {
                attrs.put(ProductReceiptOriginAttrs.RECEIPT_NUMBER, o.receiptNumber());
            }
            if (o.supplierId() != null) {
                attrs.put(ProductReceiptOriginAttrs.SUPPLIER_ID, o.supplierId().toString());
                String name = supplierNames.get(o.supplierId());
                if (name != null) {
                    attrs.put(ProductReceiptOriginAttrs.SUPPLIER_NAME, name);
                }
            }
            if (o.documentDate() != null) {
                attrs.put(ProductReceiptOriginAttrs.DOCUMENT_DATE, o.documentDate().toString());
            }
            out.put(e.getKey(), Map.copyOf(attrs));
        }
        return out;
    }

    private static boolean isNewer(ProductReceiptOrigin a, ProductReceiptOrigin b) {
        Comparator<ProductReceiptOrigin> cmp = Comparator
            .comparing(ProductReceiptOrigin::documentDate, Comparator.nullsLast(Comparator.naturalOrder()))
            .thenComparing(ProductReceiptOrigin::createdAt, Comparator.nullsLast(Comparator.naturalOrder()));
        return cmp.compare(a, b) > 0;
    }
}
