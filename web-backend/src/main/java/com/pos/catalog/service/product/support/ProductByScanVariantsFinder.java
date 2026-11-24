package com.pos.catalog.service.product.support;

import com.pos.catalog.entity.Product;
import com.pos.catalog.entity.ProductBarcode;
import com.pos.catalog.repository.ProductBarcodeRepository;
import com.pos.catalog.repository.ProductRepository;
import com.pos.scales.codec.WeightBarcodeCodec;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

/**
 * by-barcode: варианты скана одним проходом (IN), без N×3 round-trip в БД.
 */
@Component
@RequiredArgsConstructor
public class ProductByScanVariantsFinder {

    private final ProductRepository productRepository;
    private final ProductBarcodeRepository productBarcodeRepository;
    private final WeightBarcodeCodec weightBarcodeCodec;

    public Optional<Product> find(Integer companyId, String barcode) {
        if (companyId == null || !StringUtils.hasText(barcode)) {
            return Optional.empty();
        }
        List<String> variants = ProductBarcodeScanVariants.of(barcode);
        if (variants.isEmpty()) {
            return Optional.empty();
        }

        Set<String> codes = new LinkedHashSet<>(variants);

        Optional<Product> primary = productRepository
            .findFirstByCompany_IdAndBarcodeIn(companyId, codes);
        if (primary.isPresent()) {
            return primary;
        }

        Optional<Product> extra = productBarcodeRepository
            .findFirstByProduct_Company_IdAndBarcodeIn(companyId, codes)
            .map(ProductBarcode::getProduct);
        if (extra.isPresent()) {
            return extra;
        }

        Optional<Product> byIkpu = productRepository
            .findFirstByCompany_IdAndIkpuIn(companyId, codes);
        if (byIkpu.isPresent()) {
            return byIkpu;
        }

        return weightBarcodeCodec.tryDecode(barcode)
            .flatMap(decoded -> productRepository.findByCompany_IdAndPlu(companyId, decoded.plu()));
    }
}
