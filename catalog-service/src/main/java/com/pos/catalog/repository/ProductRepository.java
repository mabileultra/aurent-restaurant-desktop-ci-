package com.pos.catalog.repository;

import com.pos.catalog.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID> {

    Optional<Product> findByIdAndCompanyId(UUID id, Integer companyId);

    boolean existsByCompanyIdAndSkuIgnoreCase(Integer companyId, String sku);

    boolean existsByCompanyIdAndSkuIgnoreCaseAndIdNot(Integer companyId, String sku, UUID id);

    @Query("""
        SELECT p FROM Product p
        LEFT JOIN FETCH p.category
        WHERE p.id = :id
        """)
    Optional<Product> findDetailedById(@Param("id") UUID id);

    @Query("""
        SELECT p FROM Product p
        WHERE p.companyId = :companyId
          AND p.active = true
          AND (
            LOWER(p.name) LIKE LOWER(CONCAT('%', :q, '%'))
            OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :q, '%'))
            OR p.barcode = :exact
          )
        ORDER BY p.name ASC
        """)
    List<Product> searchActive(
        @Param("companyId") Integer companyId,
        @Param("q") String q,
        @Param("exact") String exact,
        Pageable pageable
    );

    @Query("""
        SELECT p FROM Product p
        WHERE p.companyId = :companyId
          AND (:activeOnly = false OR p.active = true)
          AND (
            :q IS NULL OR :q = ''
            OR LOWER(p.name) LIKE LOWER(CONCAT('%', :q, '%'))
            OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :q, '%'))
            OR p.barcode = :exact
          )
        """)
    Page<Product> pageByCompany(
        @Param("companyId") Integer companyId,
        @Param("q") String q,
        @Param("exact") String exact,
        @Param("activeOnly") boolean activeOnly,
        Pageable pageable
    );

    boolean existsByCompanyIdAndBarcode(Integer companyId, String barcode);

    boolean existsByCompanyIdAndBarcodeAndIdNot(Integer companyId, String barcode, UUID id);

    Optional<Product> findByCompanyIdAndBarcodeAndActiveTrue(Integer companyId, String barcode);

    Optional<Product> findByCompanyIdAndPluAndActiveTrue(Integer companyId, String plu);

    long countByCompanyId(Integer companyId);

    long countByCompanyIdAndActiveTrue(Integer companyId);

    long countByCompanyIdAndActiveFalse(Integer companyId);

    long count();

    long countByActiveTrue();

    long countByActiveFalse();
}
