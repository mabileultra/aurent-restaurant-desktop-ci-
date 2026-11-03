package com.pos.catalog.service.support;

import com.pos.catalog.exception.CatalogExceptions;
import com.pos.catalog.repository.ProductBarcodeRepository;
import com.pos.catalog.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.UUID;

/**
 * Barcode uniqueness is per company (same as grocery pos_db), never global.
 */
@Component
@RequiredArgsConstructor
public class ProductBarcodeUniqueness {

    private final ProductRepository productRepository;
    private final ProductBarcodeRepository productBarcodeRepository;

    public void assertAvailable(Integer companyId, String barcode, UUID excludeProductId) {
        if (companyId == null || !StringUtils.hasText(barcode)) {
            return;
        }
        String code = barcode.trim();
        boolean primaryTaken = excludeProductId == null
            ? productRepository.existsByCompanyIdAndBarcode(companyId, code)
            : productRepository.existsByCompanyIdAndBarcodeAndIdNot(companyId, code, excludeProductId);
        boolean extraTaken = excludeProductId == null
            ? productBarcodeRepository.existsByCompanyIdAndBarcode(companyId, code)
            : productBarcodeRepository.existsByCompanyIdAndBarcodeAndProductIdNot(
                companyId, code, excludeProductId
            );
        if (primaryTaken || extraTaken) {
            throw CatalogExceptions.conflict("Штрихкод уже используется: " + code);
        }
    }
}
