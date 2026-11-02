package com.pos.sales.service.sale.support;

import com.pos.catalog.entity.Product;
import com.pos.catalog.service.product.support.CatalogManagedProductLoader;
import com.pos.exception.PosExceptions;
import com.pos.sales.entity.SaleItem;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Loads managed {@link Product} for sale-line stock/events by {@code productId}.
 */
@Component
@RequiredArgsConstructor
public class SaleItemProductLoader {

    private final CatalogManagedProductLoader catalogManagedProductLoader;

    public Product require(SaleItem item) {
        if (item == null || item.getProductId() == null) {
            throw PosExceptions.badRequest("Sale line has no product id");
        }
        return catalogManagedProductLoader.requireById(item.getProductId());
    }

    public Map<UUID, Product> loadByItems(Collection<SaleItem> items) {
        if (items == null || items.isEmpty()) {
            return Map.of();
        }
        List<UUID> ids = items.stream()
            .map(SaleItem::getProductId)
            .filter(id -> id != null)
            .distinct()
            .toList();
        if (ids.isEmpty()) {
            return Map.of();
        }
        return catalogManagedProductLoader.findAllByIdWithCategory(ids).stream()
            .collect(Collectors.toMap(Product::getId, p -> p, (a, b) -> a, LinkedHashMap::new));
    }
}
