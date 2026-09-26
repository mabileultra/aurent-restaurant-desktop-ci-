package com.pos.pharmacy.catalog.repository;

import com.pos.pharmacy.catalog.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID> {

    Optional<Product> findByCompanyIdAndSku(Integer companyId, String sku);

    List<Product> findByCompanyIdAndSkuIn(Integer companyId, Collection<String> skus);

    Optional<Product> findByCompanyIdAndBarcode(Integer companyId, String barcode);

    List<Product> findByCompanyIdAndBarcodeIn(Integer companyId, Collection<String> barcodes);

    @Query("""
        SELECT p FROM Product p
        WHERE p.companyId = :companyId
          AND (:active IS NULL OR p.active = :active)
          AND (
            :search IS NULL OR :search = ''
            OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(COALESCE(p.barcode, '')) LIKE LOWER(CONCAT('%', :search, '%'))
          )
        ORDER BY p.name
        """)
    Page<Product> search(
        @Param("companyId") Integer companyId,
        @Param("search") String search,
        @Param("active") Boolean active,
        Pageable pageable
    );

    Optional<Product> findFirstByCompanyIdAndUzInvoiceDocumentId(Integer companyId, String invoiceId);

    Optional<Product> findFirstByCompanyIdAndSkuStartingWith(Integer companyId, String skuPrefix);

    Optional<Product> findFirstByCompanyIdAndBarcode(Integer companyId, String barcode);

    /**
     * Остаток — сумма по магазинам, если она есть, иначе поле товара.
     * Порог NULL считается как 10 (дефолт карточки).
     */
    @Query(value = """
        SELECT CAST(p.id AS varchar)
        FROM products p
        LEFT JOIN (
            SELECT product_id, SUM(quantity) AS qty
            FROM store_stock
            GROUP BY product_id
        ) s ON s.product_id = p.id
        WHERE p.company_id = :companyId
          AND p.is_active = true
          AND COALESCE(s.qty, p.stock_quantity, 0) <= COALESCE(p.low_stock_alert, 10)
        ORDER BY COALESCE(s.qty, p.stock_quantity, 0) ASC, p.name ASC
        """, nativeQuery = true)
    List<String> findLowStockIds(
        @Param("companyId") Integer companyId,
        Pageable pageable
    );
}
