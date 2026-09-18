package com.pos.pharmacy.catalog.repository;

import com.pos.pharmacy.catalog.entity.ProductBarcode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductBarcodeRepository extends JpaRepository<ProductBarcode, UUID> {

    Optional<ProductBarcode> findByBarcode(String barcode);

    List<ProductBarcode> findByBarcodeIn(Collection<String> barcodes);

    void deleteByProductId(UUID productId);
}
