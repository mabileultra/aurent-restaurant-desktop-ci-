package com.pos.catalog.service.product.support;

import com.pos.catalog.entity.Product;
import com.pos.entity.Store;
import com.pos.inventory.service.stock.StoreStockService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Branch assortment writes: presence is {@code store_stock}; price is {@code product_store_prices}.
 * Removing a product from one store must not deactivate the company card.
 */
@Component
@RequiredArgsConstructor
public class ProductStoreAssortmentSupport {

    private final StoreStockService storeStockService;
    private final ProductStorePriceApplier storePriceApplier;

    public Store requireStore(Product product, Integer storeId) {
        Integer companyId = product.getCompany() != null ? product.getCompany().getId() : null;
        return storeStockService.requireStoreForCompany(companyId, storeId);
    }

    /**
     * Drops this product from the store assortment (stock row + store price). Card stays active.
     * Caller must persist {@code product} so orphanRemoval drops the store price row.
     */
    public void removeFromStore(Product product, Integer storeId) {
        Store store = requireStore(product, storeId);
        storePriceApplier.removeStorePrice(product, store.getId());
        storeStockService.removePresence(product, store);
    }
}
