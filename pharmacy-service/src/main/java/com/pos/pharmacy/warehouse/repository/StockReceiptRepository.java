package com.pos.pharmacy.warehouse.repository;

import com.pos.pharmacy.warehouse.entity.StockReceipt;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StockReceiptRepository extends JpaRepository<StockReceipt, UUID> {

    @Query("SELECT r.receiptNumber FROM StockReceipt r WHERE r.receiptNumber LIKE CONCAT(:prefix, '%')")
    List<String> findReceiptNumbersStartingWith(@Param("prefix") String prefix);

    @Query("""
        SELECT DISTINCT r FROM StockReceipt r
        LEFT JOIN FETCH r.lines l
        LEFT JOIN FETCH l.product
        WHERE r.id = :id
        """)
    Optional<StockReceipt> findDetailedById(@Param("id") UUID id);

    @Query("""
        SELECT r FROM StockReceipt r
        WHERE r.companyId = :companyId
          AND (:storeId IS NULL OR r.storeId = :storeId)
          AND (:status IS NULL OR r.status = :status)
          AND (
            :searchPattern IS NULL
            OR LOWER(r.receiptNumber) LIKE :searchPattern
            OR LOWER(COALESCE(r.invoiceNumber, '')) LIKE :searchPattern
          )
        ORDER BY r.createdAt DESC
        """)
    Page<StockReceipt> findReceipts(
        @Param("companyId") Integer companyId,
        @Param("storeId") Integer storeId,
        @Param("status") String status,
        @Param("searchPattern") String searchPattern,
        Pageable pageable
    );
}
