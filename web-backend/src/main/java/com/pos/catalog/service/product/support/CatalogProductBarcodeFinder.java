package com.pos.catalog.service.product.support;

import com.pos.catalog.entity.Product;
import com.pos.catalog.entity.ProductBarcode;
import com.pos.catalog.repository.ProductBarcodeRepository;
import com.pos.catalog.repository.ProductRepository;
import com.pos.catalog.repository.spec.ProductSpecifications;
import com.pos.scales.codec.WeightBarcodeCodec;
import com.pos.catalog.service.product.support.ProductLookupSupport;
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

    private final ProductLookupSupport productLookup;
    private final ProductBarcodeRepository productBarcodeRepository;
    private final ProductRepository productRepository;
    private final WeightBarcodeCodec weightBarcodeCodec;

    public Optional<Product> find(Integer companyId, String barcode) {
        if (companyId == null || !StringUtils.hasText(barcode)) {
            return Optional.empty();
        }
        for (String code : ProductBarcodeScanVariants.of(barcode)) {
            Optional<Product> primary = productLookup.findOne(
                ProductSpecifications.lookup(companyId).barcode(code).anyActiveState()
            );
            if (primary.isPresent()) {
                return primary;
            }
            Optional<Product> extra = productBarcodeRepository
                .findByBarcodeAndProductCompanyId(code, companyId)
                .map(ProductBarcode::getProduct);
            if (extra.isPresent()) {
                return extra;
            }
            Optional<Product> byIkpu = productLookup.findOne(
                ProductSpecifications.lookup(companyId).ikpu(code).anyActiveState()
            );
            if (byIkpu.isPresent()) {
                return byIkpu;
            }
        }
        return weightBarcodeCodec.tryDecode(barcode)
            .flatMap(decoded -> productRepository.findByCompany_IdAndPlu(companyId, decoded.plu()));
    }
}
