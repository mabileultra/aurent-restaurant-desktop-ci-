package com.pos.pharmacy.warehouse.repository;

import com.pos.pharmacy.warehouse.entity.StockTransfer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StockTransferRepository extends JpaRepository<StockTransfer, UUID> {

    @Query("SELECT t.transferNumber FROM StockTransfer t WHERE t.transferNumber LIKE CONCAT(:prefix, '%')")
    List<String> findTransferNumbersStartingWith(@Param("prefix") String prefix);

    @Query("""
        SELECT t FROM StockTransfer t
        WHERE t.companyId = :companyId
          AND t.createdAt >= :from
          AND t.createdAt < :to
          AND (:fromStoreId IS NULL OR t.fromStoreId = :fromStoreId)
          AND (:toStoreId IS NULL OR t.toStoreId = :toStoreId)
        ORDER BY t.createdAt DESC
        """)
    Page<StockTransfer> findBetween(
        @Param("companyId") Integer companyId,
        @Param("from") Instant from,
        @Param("to") Instant to,
        @Param("fromStoreId") Integer fromStoreId,
        @Param("toStoreId") Integer toStoreId,
        Pageable pageable
    );

    @Query("""
        SELECT t FROM StockTransfer t
        LEFT JOIN FETCH t.lines
        WHERE t.id = :id AND t.companyId = :companyId
        """)
    Optional<StockTransfer> findDetailedById(
        @Param("id") UUID id,
        @Param("companyId") Integer companyId
    );
}
