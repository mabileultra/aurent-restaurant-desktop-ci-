package com.pos.catalog.repository;

import com.pos.catalog.entity.ProductBarcode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface ProductBarcodeRepository extends JpaRepository<ProductBarcode, UUID> {

    boolean existsByCompanyIdAndBarcode(Integer companyId, String barcode);

    boolean existsByCompanyIdAndBarcodeAndProductIdNot(Integer companyId, String barcode, UUID productId);

    @Query("""
        SELECT b FROM ProductBarcode b
        JOIN FETCH b.product p
        WHERE b.barcode = :barcode
          AND b.companyId = :companyId
          AND p.active = true
        """)
    Optional<ProductBarcode> findActiveByCompanyAndBarcode(
        @Param("companyId") Integer companyId,
        @Param("barcode") String barcode
    );
}
