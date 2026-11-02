package com.pos.inventory.service.stock.support;

import com.pos.catalog.entity.Product;
import com.pos.catalog.service.product.support.CatalogManagedProductLoader;
import com.pos.exception.PosExceptions;
import com.pos.service.support.CatalogIsolationSupport;
import com.pos.util.QuantityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Общие проверки для складских документов (приёмка, инвентаризация, перемещение).
 */
@Component
@RequiredArgsConstructor
public class StockDocumentSupport {

    private final CatalogManagedProductLoader catalogManagedProductLoader;
    private final CatalogIsolationSupport catalogIsolation;

    public void requireLines(List<?> lines) {
        if (lines == null || lines.isEmpty()) {
            throw PosExceptions.badRequest("Add at least one line");
        }
    }

    public void requireCompanyContext(Integer companyId) {
        if (companyId == null) {
            throw PosExceptions.badRequest("Company context is required");
        }
    }

    public Product requireActiveProduct(UUID productId) {
        return catalogManagedProductLoader.requireActive(productId);
    }

    public Product requireActiveGroceryProduct(UUID productId) {
        Product product = requireActiveProduct(productId);
        catalogIsolation.rejectPharmacyFromGroceryWrite(product);
        return product;
    }

    public void requirePositiveQuantity(BigDecimal quantity) {
        if (QuantityUtil.normalize(quantity).signum() <= 0) {
            throw PosExceptions.badRequest("Quantity must be greater than zero");
        }
    }
}
