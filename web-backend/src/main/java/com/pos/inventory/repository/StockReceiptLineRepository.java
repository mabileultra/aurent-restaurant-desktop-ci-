package com.pos.inventory.repository;

import com.pos.inventory.entity.StockReceiptLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface StockReceiptLineRepository extends JpaRepository<StockReceiptLine, UUID> {

    /**
     * Latest posted receipt number per product (Postgres DISTINCT ON).
     * Row: [product_id UUID, receipt_number String].
     */
    @Query(value = """
        SELECT DISTINCT ON (l.product_id)
               l.product_id,
               r.receipt_number
        FROM stock_receipt_lines l
        INNER JOIN stock_receipts r ON r.id = l.receipt_id
        INNER JOIN stores s ON s.id = r.store_id
        WHERE l.product_id IN (:productIds)
          AND s.company_id = :companyId
          AND r.status = 'POSTED'
        ORDER BY l.product_id, r.created_at DESC NULLS LAST
        """, nativeQuery = true)
    List<Object[]> findLatestReceiptNumberByProductIds(
        @Param("companyId") Integer companyId,
        @Param("productIds") Collection<UUID> productIds
    );

    @Query(value = """
        SELECT DISTINCT l.product_id
        FROM stock_receipt_lines l
        INNER JOIN stock_receipts r ON r.id = l.receipt_id
        INNER JOIN stores s ON s.id = r.store_id
        WHERE s.company_id = :companyId
          AND r.status = 'POSTED'
          AND LOWER(r.receipt_number) LIKE LOWER(CAST(:pattern AS text)) ESCAPE '\'
        """, nativeQuery = true)
    List<UUID> findProductIdsByReceiptNumberContains(
        @Param("companyId") Integer companyId,
        @Param("pattern") String pattern
    );
}
