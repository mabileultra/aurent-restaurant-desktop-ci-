package com.pos.pharmacy.warehouse.repository;

import com.pos.pharmacy.warehouse.entity.StockInventory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StockInventoryRepository extends JpaRepository<StockInventory, UUID> {

    @Query("""
        SELECT i FROM StockInventory i
        LEFT JOIN FETCH i.lines
        WHERE i.id = :id AND i.companyId = :companyId
        """)
    Optional<StockInventory> findDetailedById(
        @Param("id") UUID id,
        @Param("companyId") Integer companyId
    );

    @Query("""
        SELECT i FROM StockInventory i
        WHERE i.companyId = :companyId
          AND i.createdAt >= :from
          AND i.createdAt < :to
          AND (:storeId IS NULL OR i.storeId = :storeId)
        ORDER BY i.createdAt DESC
        """)
    Page<StockInventory> findBetween(
        @Param("companyId") Integer companyId,
        @Param("from") Instant from,
        @Param("to") Instant to,
        @Param("storeId") Integer storeId,
        Pageable pageable
    );

    @Query("""
        SELECT i.inventoryNumber FROM StockInventory i
        WHERE i.inventoryNumber LIKE CONCAT(:prefix, '%')
        """)
    List<String> findInventoryNumbersStartingWith(@Param("prefix") String prefix);
}
