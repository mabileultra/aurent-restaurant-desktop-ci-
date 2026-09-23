package com.pos.catalog.repository;

import com.pos.catalog.entity.Product;
import com.pos.domain.SaleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ProductRepository extends JpaRepository<Product, UUID>, JpaSpecificationExecutor<Product> {

    Optional<Product> findByCompany_IdAndPlu(Integer companyId, String plu);

    @Query("""
        SELECT p FROM Product p
        LEFT JOIN FETCH p.category
        WHERE p.company.id = :companyId
          AND p.saleType = :saleType
          AND p.isActive = true
        ORDER BY CASE WHEN p.plu IS NULL THEN 1 ELSE 0 END, p.plu ASC NULLS LAST, p.name ASC
        """)
    List<Product> findActiveByCompanyAndSaleType(
        @Param("companyId") Integer companyId,
        @Param("saleType") SaleType saleType
    );

    @Query("SELECT p FROM Product p JOIN FETCH p.company WHERE p.id IN :ids")
    List<Product> findAllByIdWithCompany(@Param("ids") Collection<UUID> ids);

    @Query("""
        SELECT p FROM Product p
        LEFT JOIN FETCH p.category
        JOIN FETCH p.company
        WHERE (:companyId IS NULL OR p.company.id = :companyId)
        ORDER BY p.updatedAt ASC NULLS LAST, p.id ASC
        """)
    Page<Product> findForReportingSnapshot(@Param("companyId") Integer companyId, Pageable pageable);

    /**
     * Grocery low-stock: остаток по store_stock (или поле товара), без аптеки.
     * Pageable задаёт LIMIT.
     */
    @Query(value = """
        SELECT CAST(p.id AS varchar)
        FROM products p
        LEFT JOIN business_types bt ON bt.id = p.business_type_id
        LEFT JOIN (
            SELECT product_id, SUM(quantity) AS qty
            FROM store_stock
            GROUP BY product_id
        ) s ON s.product_id = p.id
        WHERE p.company_id = :companyId
          AND p.is_active = true
          AND COALESCE(s.qty, p.stock_quantity, 0) <= COALESCE(p.low_stock_alert, 10)
          AND (bt.code IS NULL OR UPPER(bt.code) <> 'PHARMACY')
        ORDER BY COALESCE(s.qty, p.stock_quantity, 0) ASC, p.name ASC
        """, nativeQuery = true)
    List<String> findGroceryLowStockIds(
        @Param("companyId") Integer companyId,
        Pageable pageable
    );
}
