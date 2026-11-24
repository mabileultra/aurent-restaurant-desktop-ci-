package com.pos.catalog.service.product.support;

import com.pos.catalog.entity.Product;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.Optional;

/**
 * Resolves a grocery product by scanned barcode / IKPU / weight PLU for a company.
 * Used by {@link com.pos.catalog.api.CatalogFacade}; keeps lookup out of the facade class.
 */
@Component
@RequiredArgsConstructor
public class CatalogProductBarcodeFinder {

    private final ProductByScanVariantsFinder byScanVariantsFinder;

    public Optional<Product> find(Integer companyId, String barcode) {
        if (companyId == null || !StringUtils.hasText(barcode)) {
            return Optional.empty();
        }
        return byScanVariantsFinder.find(companyId, barcode);
    }
}
