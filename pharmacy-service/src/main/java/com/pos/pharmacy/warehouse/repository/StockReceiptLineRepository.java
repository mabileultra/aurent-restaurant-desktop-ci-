package com.pos.pharmacy.warehouse.repository;

import com.pos.pharmacy.warehouse.entity.StockReceiptLine;
import com.pos.pharmacy.warehouse.support.ProductReceiptOrigin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface StockReceiptLineRepository extends JpaRepository<StockReceiptLine, UUID> {

    @Query("""
        SELECT new com.pos.pharmacy.warehouse.support.ProductReceiptOrigin(
          l.product.id, r.id, r.receiptNumber, r.supplierId, r.documentDate, r.createdAt
        )
        FROM StockReceiptLine l
        JOIN l.receipt r
        WHERE l.product.id IN :productIds
        """)
    List<ProductReceiptOrigin> findOriginsByProductIds(@Param("productIds") Collection<UUID> productIds);

    @Query("""
        SELECT l FROM StockReceiptLine l
        JOIN FETCH l.receipt r
        WHERE l.product.id = :productId AND r.status = :status
        """)
    List<StockReceiptLine> findByProductIdAndReceiptStatus(
        @Param("productId") UUID productId,
        @Param("status") String status
    );
}
