package com.pos.catalog.repository.spec;

import com.pos.catalog.entity.Product;
import com.pos.entity.StoreStock;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;

/**
 * Branch assortment: product is visible for a store when a {@code store_stock} row exists
 * (qty may be zero). Does not depend on store prices being enabled.
 */
public final class ProductStoreAssortmentSpecifications {

    private ProductStoreAssortmentSpecifications() {
    }

    public static Specification<Product> presentAtStore(Integer storeId) {
        if (storeId == null) {
            return (root, query, cb) -> cb.conjunction();
        }
        return (root, query, cb) -> {
            Subquery<Long> stock = query.subquery(Long.class);
            Root<StoreStock> ss = stock.from(StoreStock.class);
            stock.select(cb.literal(1L));
            stock.where(
                cb.equal(ss.get("productId"), root.get("id")),
                cb.equal(ss.get("store").get("id"), storeId)
            );
            return cb.exists(stock);
        };
    }
}
