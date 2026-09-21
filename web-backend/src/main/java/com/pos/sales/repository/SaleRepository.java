package com.pos.sales.repository;

import com.pos.sales.entity.Sale;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SaleRepository extends JpaRepository<Sale, UUID>, JpaSpecificationExecutor<Sale> {

    Optional<Sale> findByReceiptNumber(String receiptNumber);

    Optional<Sale> findByClientSaleId(UUID clientSaleId);

    @EntityGraph(attributePaths = {"cashier", "store", "items", "items.product", "cashierShift"})
    @Query("""
        SELECT s FROM Sale s
        WHERE s.company.id = :companyId
          AND s.receiptNumber LIKE CONCAT('%-', :suffix)
        ORDER BY s.createdAt DESC
        """)
    List<Sale> findByReceiptSuffixAndCompanyOrderByCreatedAtDesc(
        @Param("companyId") Integer companyId,
        @Param("suffix") String suffix,
        Pageable pageable
    );

    long countByReceiptNumberStartingWith(String prefix);

    long countByStore_Id(Integer storeId);

    boolean existsByCashier_Id(UUID cashierId);

    @EntityGraph(attributePaths = {"cashier", "store", "items", "items.product"})
    @Query("""
        SELECT DISTINCT s FROM Sale s
        JOIN s.items si
        WHERE si.product.id = :productId
          AND s.createdAt >= :start AND s.createdAt < :end
        ORDER BY s.createdAt ASC
        """)
    List<Sale> findSalesWithProductBetween(
        @Param("productId") UUID productId,
        @Param("start") Instant start,
        @Param("end") Instant end
    );

    @EntityGraph(attributePaths = {
        "cashier", "store", "store.company", "items", "items.product",
        "items.lotAllocations", "items.lotAllocations.lot"
    })
    @Query("""
        SELECT s FROM Sale s
        WHERE s.status = :status
          AND (s.receiptType = :saleReceiptType OR s.receiptType IS NULL)
          AND s.createdAt >= :start AND s.createdAt < :end
          AND (:companyId IS NULL OR COALESCE(s.company.id, s.store.company.id) = :companyId)
        ORDER BY s.createdAt ASC
        """)
    List<Sale> findCompletedSalesForFinanceBackfill(
        @Param("start") Instant start,
        @Param("end") Instant end,
        @Param("companyId") Integer companyId,
        @Param("status") Sale.SaleStatus status,
        @Param("saleReceiptType") Sale.ReceiptType saleReceiptType
    );

    @EntityGraph(attributePaths = {"cashier", "store", "store.company", "company", "items", "items.product", "items.product.category"})
    @Query("""
        SELECT s FROM Sale s
        WHERE s.status = :status
          AND (s.receiptType = :saleReceiptType OR s.receiptType IS NULL)
          AND s.createdAt >= :start AND s.createdAt < :end
          AND (:companyId IS NULL OR COALESCE(s.company.id, s.store.company.id) = :companyId)
        ORDER BY s.createdAt ASC
        """)
    Page<Sale> findCompletedSalesForReportingBackfill(
        @Param("start") Instant start,
        @Param("end") Instant end,
        @Param("companyId") Integer companyId,
        @Param("status") Sale.SaleStatus status,
        @Param("saleReceiptType") Sale.ReceiptType saleReceiptType,
        Pageable pageable
    );

    @EntityGraph(attributePaths = {"cashier", "store", "store.company", "company", "items", "items.product", "items.product.category"})
    @Query("""
        SELECT s FROM Sale s
        WHERE (s.receiptType = :saleReceiptType OR s.receiptType IS NULL)
          AND s.createdAt >= :start AND s.createdAt < :end
          AND (:companyId IS NULL OR COALESCE(s.company.id, s.store.company.id) = :companyId)
        ORDER BY s.createdAt ASC
        """)
    Page<Sale> findSalesForReportingBackfill(
        @Param("start") Instant start,
        @Param("end") Instant end,
        @Param("companyId") Integer companyId,
        @Param("saleReceiptType") Sale.ReceiptType saleReceiptType,
        Pageable pageable
    );

    @EntityGraph(attributePaths = {"cashier", "store", "store.company", "company", "items", "items.product", "items.product.category"})
    @Query("""
        SELECT s FROM Sale s
        WHERE s.status IN :statuses
        ORDER BY s.createdAt ASC
        """)
    Page<Sale> findByStatusIn(@Param("statuses") Collection<Sale.SaleStatus> statuses, Pageable pageable);
}
