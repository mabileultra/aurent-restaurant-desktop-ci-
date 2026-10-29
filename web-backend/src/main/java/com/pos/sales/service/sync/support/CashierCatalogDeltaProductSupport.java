package com.pos.sales.service.sync.support;

import com.pos.catalog.dto.product.ProductResponse;
import com.pos.catalog.entity.Product;
import com.pos.catalog.repository.ProductRepository;
import com.pos.catalog.repository.ProductStorePriceRepository;
import com.pos.catalog.service.product.ProductResponseAssembler;
import com.pos.catalog.service.product.support.ProductCatalogLoader;
import com.pos.inventory.service.stock.StoreStockService;
import com.pos.service.support.CatalogIsolationSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class CashierCatalogDeltaProductSupport {

    private final ProductRepository productRepository;
    private final ProductCatalogLoader catalogLoader;
    private final ProductResponseAssembler assembler;
    private final StoreStockService storeStockService;
    private final ProductStorePriceRepository productStorePriceRepository;
    private final CatalogIsolationSupport catalogIsolation;

    public List<ProductResponse> loadActiveUpserts(Integer companyId, Integer storeId, Instant since) {
        List<Product> changed = productRepository.findActiveUpdatedSince(companyId, since);
        List<ProductResponse> out = new ArrayList<>(changed.size());
        for (Product product : changed) {
            if (catalogIsolation.isPharmacyProduct(product)) {
                continue;
            }
            catalogLoader.initCollections(product);
            out.add(withStoreFields(assembler.toResponse(product), product, storeId));
        }
        return out;
    }

    public List<UUID> loadRemovedIds(Integer companyId, Instant since) {
        List<UUID> ids = productRepository.findInactiveIdsUpdatedSince(companyId, since);
        if (ids.isEmpty()) {
            return List.of();
        }
        List<Product> rows = productRepository.findAllByIdWithCompany(ids);
        List<UUID> removed = new ArrayList<>();
        for (Product product : rows) {
            if (catalogIsolation.isPharmacyProduct(product)) {
                continue;
            }
            removed.add(product.getId());
        }
        return removed;
    }

    private ProductResponse withStoreFields(ProductResponse base, Product product, Integer storeId) {
        BigDecimal qty = storeStockService.getQuantity(product.getId(), storeId);
        ProductResponse withQty = assembler.withStockQuantity(base, qty);
        BigDecimal price = productStorePriceRepository
            .findByProduct_IdAndStore_Id(product.getId(), storeId)
            .map(sp -> sp.getPrice())
            .orElse(product.getSellingPrice());
        return assembler.withSellingPrice(withQty, price);
    }
}
