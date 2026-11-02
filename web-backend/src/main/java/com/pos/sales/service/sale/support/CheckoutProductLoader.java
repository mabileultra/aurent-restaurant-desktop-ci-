package com.pos.sales.service.sale.support;

import com.pos.catalog.entity.Product;
import com.pos.catalog.service.product.support.CatalogManagedProductLoader;
import com.pos.sales.dto.sale.SaleItemRequest;
import com.pos.service.support.TenantAccessSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Checkout entry: validates tenant and returns managed products for stock / snapshot.
 * Does not touch {@code ProductRepository} — loading lives in catalog.
 */
@Component
@RequiredArgsConstructor
public class CheckoutProductLoader {

    private final CatalogManagedProductLoader catalogManagedProductLoader;
    private final TenantAccessSupport tenantAccess;

    public Map<UUID, Product> loadIndexed(List<SaleItemRequest> lineItems) {
        List<UUID> ids = lineItems.stream()
            .map(SaleItemRequest::productId)
            .distinct()
            .toList();

        Map<UUID, Product> byId = catalogManagedProductLoader.requireActiveWithCompany(ids);
        byId.values().forEach(tenantAccess::assertProductBelongsToTenant);
        return byId;
    }
}
