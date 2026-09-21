package com.pos.reporting.repository;

import com.pos.reporting.entity.SaleItemFact;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface SaleItemFactRepository extends JpaRepository<SaleItemFact, UUID> {

    @Modifying
    void deleteBySaleId(UUID saleId);

    @Query(value = """
        SELECT i.product_name,
               COALESCE(SUM(i.quantity - i.quantity_returned), 0),
               COALESCE(SUM(i.revenue), 0)
        FROM sale_item_facts i
        WHERE i.company_id = :companyId
          AND i.transaction_date BETWEEN :from AND :to
        GROUP BY i.product_name
        HAVING COALESCE(SUM(i.quantity - i.quantity_returned), 0) > 0
        ORDER BY SUM(i.quantity - i.quantity_returned) DESC
        LIMIT :limit
        """, nativeQuery = true)
    List<Object[]> topProducts(
        @Param("companyId") Integer companyId,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to,
        @Param("limit") int limit
    );

    @Query(
        value = """
        SELECT COALESCE(CAST(i.product_id AS varchar), i.product_name) AS product_id,
               MAX(i.product_name) AS product_name,
               MAX(COALESCE(i.sku, '')) AS sku,
               MAX(COALESCE(i.barcode, '')) AS barcode,
               MAX(COALESCE(i.category_name, '')) AS category_name,
               COALESCE(SUM(i.quantity - i.quantity_returned), 0) AS net_qty,
               COALESCE(SUM(i.quantity_returned), 0) AS returned_qty,
               COALESCE(SUM(i.revenue), 0) AS revenue,
               COALESCE(SUM(i.cost_estimate), 0) AS cost_estimate
        FROM sale_item_facts i
        WHERE i.company_id = :companyId
          AND i.transaction_date BETWEEN :from AND :to
          AND (:storeId IS NULL OR i.store_id = :storeId)
          AND (:categoryId IS NULL OR i.category_id = :categoryId)
          AND (
            CAST(:searchPattern AS text) = ''
            OR LOWER(i.product_name) LIKE LOWER(CAST(:searchPattern AS text))
            OR LOWER(COALESCE(i.sku, '')) LIKE LOWER(CAST(:searchPattern AS text))
            OR LOWER(COALESCE(i.barcode, '')) LIKE LOWER(CAST(:searchPattern AS text))
          )
        GROUP BY COALESCE(CAST(i.product_id AS varchar), i.product_name)
        HAVING COALESCE(SUM(i.quantity - i.quantity_returned), 0) > 0
            OR COALESCE(SUM(i.quantity_returned), 0) > 0
        ORDER BY net_qty DESC
        """,
        countQuery = """
        SELECT COUNT(*) FROM (
          SELECT COALESCE(CAST(i.product_id AS varchar), i.product_name)
          FROM sale_item_facts i
          WHERE i.company_id = :companyId
            AND i.transaction_date BETWEEN :from AND :to
            AND (:storeId IS NULL OR i.store_id = :storeId)
            AND (:categoryId IS NULL OR i.category_id = :categoryId)
            AND (
              CAST(:searchPattern AS text) = ''
              OR LOWER(i.product_name) LIKE LOWER(CAST(:searchPattern AS text))
              OR LOWER(COALESCE(i.sku, '')) LIKE LOWER(CAST(:searchPattern AS text))
              OR LOWER(COALESCE(i.barcode, '')) LIKE LOWER(CAST(:searchPattern AS text))
            )
          GROUP BY COALESCE(CAST(i.product_id AS varchar), i.product_name)
          HAVING COALESCE(SUM(i.quantity - i.quantity_returned), 0) > 0
              OR COALESCE(SUM(i.quantity_returned), 0) > 0
        ) sub
        """,
        nativeQuery = true
    )
    Page<Object[]> productSalesPage(
        @Param("companyId") Integer companyId,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to,
        @Param("storeId") Integer storeId,
        @Param("categoryId") Integer categoryId,
        @Param("searchPattern") String searchPattern,
        Pageable pageable
    );

    @Query(
        value = """
        SELECT i.category_id,
               MAX(COALESCE(i.category_name, '')) AS category_name,
               COUNT(DISTINCT i.sale_id) AS receipt_count,
               COALESCE(SUM(i.quantity - i.quantity_returned), 0) AS net_qty,
               COALESCE(SUM(i.quantity_returned), 0) AS returned_qty,
               COALESCE(SUM(i.revenue), 0) AS revenue,
               COALESCE(SUM(i.cost_estimate), 0) AS cost_estimate
        FROM sale_item_facts i
        WHERE i.company_id = :companyId
          AND i.transaction_date BETWEEN :from AND :to
          AND (:storeId IS NULL OR i.store_id = :storeId)
        GROUP BY i.category_id, COALESCE(i.category_name, '')
        HAVING COALESCE(SUM(i.quantity - i.quantity_returned), 0) > 0
            OR COALESCE(SUM(i.quantity_returned), 0) > 0
        ORDER BY revenue DESC
        """,
        countQuery = """
        SELECT COUNT(*) FROM (
          SELECT i.category_id, COALESCE(i.category_name, '')
          FROM sale_item_facts i
          WHERE i.company_id = :companyId
            AND i.transaction_date BETWEEN :from AND :to
            AND (:storeId IS NULL OR i.store_id = :storeId)
          GROUP BY i.category_id, COALESCE(i.category_name, '')
          HAVING COALESCE(SUM(i.quantity - i.quantity_returned), 0) > 0
              OR COALESCE(SUM(i.quantity_returned), 0) > 0
        ) sub
        """,
        nativeQuery = true
    )
    Page<Object[]> categorySalesPage(
        @Param("companyId") Integer companyId,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to,
        @Param("storeId") Integer storeId,
        Pageable pageable
    );

    @Query(value = """
        SELECT COALESCE(SUM(i.quantity - i.quantity_returned), 0)
        FROM sale_item_facts i
        WHERE i.company_id = :companyId
          AND i.transaction_date BETWEEN :from AND :to
          AND (:storeId IS NULL OR i.store_id = :storeId)
        """, nativeQuery = true)
    long sumSoldUnits(
        @Param("companyId") Integer companyId,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to,
        @Param("storeId") Integer storeId
    );

    @Query("""
        SELECT COALESCE(SUM(i.costEstimate), 0)
        FROM SaleItemFact i
        WHERE i.companyId = :companyId
          AND i.transactionDate BETWEEN :from AND :to
        """)
    BigDecimal sumCostEstimateByCompanyAndDateRange(
        @Param("companyId") Integer companyId,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to
    );

    @Query(value = """
        SELECT CAST(i.transaction_date AS varchar),
               COALESCE(SUM(i.quantity - i.quantity_returned), 0)
        FROM sale_item_facts i
        WHERE i.company_id = :companyId
          AND i.transaction_date BETWEEN :from AND :to
          AND (:storeId IS NULL OR i.store_id = :storeId)
        GROUP BY i.transaction_date
        ORDER BY i.transaction_date
        """, nativeQuery = true)
    List<Object[]> dailySoldUnits(
        @Param("companyId") Integer companyId,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to,
        @Param("storeId") Integer storeId
    );
}
