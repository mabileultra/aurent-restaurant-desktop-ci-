package com.pos.catalog.service.product.support;

import com.pos.catalog.dto.product.ProductResponse;
import com.pos.catalog.entity.Product;
import com.pos.catalog.entity.ProductStorePrice;
import com.pos.catalog.repository.ProductStorePriceRepository;
import com.pos.catalog.service.product.ProductResponseAssembler;
import com.pos.inventory.service.stock.StoreStockService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Fills list/get columns that must follow branch filter: qty, selling price, storesCount, lowStock.
 */
@Component
@RequiredArgsConstructor
public class ProductStoreScopedResponseSupport {

    private final StoreStockService storeStockService;
    private final ProductStorePriceRepository productStorePriceRepository;
    private final ProductResponseAssembler assembler;

    public Map<UUID, BigDecimal> loadStorePrices(List<Product> products, Integer storeId) {
        if (storeId == null || products == null || products.isEmpty()) {
            return Map.of();
        }
        List<UUID> ids = products.stream().map(Product::getId).toList();
        Map<UUID, BigDecimal> prices = new HashMap<>();
        for (ProductStorePrice row : productStorePriceRepository.findByProduct_IdInAndStore_Id(ids, storeId)) {
            if (row.getProduct() != null && row.getProduct().getId() != null && row.getPrice() != null) {
                prices.put(row.getProduct().getId(), row.getPrice());
            }
        }
        return prices;
    }

    public ProductResponse applyStoreScope(
        ProductResponse base,
        Product product,
        Integer storeId,
        Map<UUID, BigDecimal> storeQty,
        Map<UUID, BigDecimal> storePrices
    ) {
        if (storeId == null) {
            return base;
        }
        BigDecimal qty = storeQty.getOrDefault(product.getId(), BigDecimal.ZERO);
        ProductResponse withQty = assembler.withStockQuantity(base, qty);
        BigDecimal price = storePrices.getOrDefault(product.getId(), product.getSellingPrice());
        ProductResponse withPrice = assembler.withSellingPrice(withQty, price);
        return assembler.withStoresCount(withPrice, 1);
    }

    public Map<UUID, BigDecimal> loadStoreQuantities(List<Product> products, Integer storeId) {
        return storeStockService.getQuantities(
            products.stream().map(Product::getId).collect(Collectors.toList()),
            storeId
        );
    }
}
