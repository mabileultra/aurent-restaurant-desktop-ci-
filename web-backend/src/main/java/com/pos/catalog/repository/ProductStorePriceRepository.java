package com.pos.catalog.repository;

import com.pos.catalog.entity.ProductStorePrice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface ProductStorePriceRepository extends JpaRepository<ProductStorePrice, UUID> {

    long countByProduct_Id(UUID productId);

    @Query("select sp.product.id, count(sp) from ProductStorePrice sp where sp.product.id in :ids group by sp.product.id")
    List<Object[]> countStoresByProductIds(@Param("ids") Collection<UUID> ids);

    java.util.Optional<ProductStorePrice> findByProduct_IdAndStore_Id(UUID productId, Integer storeId);

    @Query("""
        SELECT sp
        FROM ProductStorePrice sp
        JOIN FETCH sp.store st
        JOIN FETCH sp.product p
        WHERE p.id IN :productIds
          AND st.active = true
        ORDER BY st.name ASC
        """)
    List<ProductStorePrice> findActiveStorePricesByProductIds(@Param("productIds") Collection<UUID> productIds);
}
