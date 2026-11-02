package com.pos.inventory.repository;

import com.pos.entity.StoreStock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StoreStockRepository extends JpaRepository<StoreStock, UUID> {

    Optional<StoreStock> findByProductIdAndStoreId(UUID productId, Integer storeId);

    List<StoreStock> findByProductIdInAndStoreId(Collection<UUID> productIds, Integer storeId);

    @Query("""
        SELECT COALESCE(SUM(ss.quantity), 0)
        FROM StoreStock ss
        JOIN ss.store st
        WHERE ss.productId = :productId AND st.company.id = :companyId
        """)
    BigDecimal sumQuantityByProductAndCompany(@Param("productId") UUID productId, @Param("companyId") Integer companyId);

    @Query("""
        SELECT ss.productId, ss.quantity
        FROM StoreStock ss
        WHERE ss.store.id = :storeId AND ss.productId IN :productIds
        """)
    List<Object[]> quantitiesByStoreAndProductIds(
        @Param("storeId") Integer storeId,
        @Param("productIds") Collection<UUID> productIds
    );

    @Query("""
        SELECT ss.productId, COALESCE(SUM(ss.quantity), 0)
        FROM StoreStock ss
        WHERE ss.productId IN :productIds
        GROUP BY ss.productId
        """)
    List<Object[]> sumQuantitiesByProductIds(@Param("productIds") Collection<UUID> productIds);

    @Query("""
        SELECT ss
        FROM StoreStock ss
        JOIN FETCH ss.store st
        WHERE st.company.id = :companyId
        """)
    List<StoreStock> findAllDetailedByCompanyId(@Param("companyId") Integer companyId);

    @Query("""
        SELECT ss
        FROM StoreStock ss
        WHERE ss.productId IN :productIds
        """)
    List<StoreStock> findByProductIdIn(@Param("productIds") Collection<UUID> productIds);
}
