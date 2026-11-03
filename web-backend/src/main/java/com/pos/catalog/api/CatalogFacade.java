package com.pos.catalog.api;

import com.pos.catalog.dto.ref.ProductRef;
import com.pos.catalog.dto.ref.WeightProductRef;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Cross-module entry into Grocery Catalog.
 * Sales / Inventory / Scales / Integrations must use this — not {@code ProductRepository}
 * or JPA {@code Product}.
 */
public interface CatalogFacade {

    /**
     * @throws com.pos.exception.ResourceNotFoundException if product is missing
     */
    ProductRef getById(UUID productId);

    Optional<ProductRef> findByBarcode(Integer companyId, String barcode);

    List<ProductRef> searchActiveProducts(
        Integer companyId,
        String searchText,
        String barcodeExact,
        int limit
    );

    Optional<ProductRef> findActiveById(UUID productId, Integer companyId);

    ProductRef requireActiveById(UUID productId, Integer companyId);

    List<WeightProductRef> listActiveWeightProducts(Integer companyId);

    Optional<WeightProductRef> findActiveWeightByPlu(Integer companyId, String plu);

    WeightProductRef requireActiveWeightByPlu(Integer companyId, String plu);

    WeightProductRef assignWeightPlu(UUID productId, String plu);
}
