package com.pos.catalog.service.support;

import com.pos.catalog.entity.Product;
import com.pos.catalog.entity.ProductBarcode;
import com.pos.catalog.exception.CatalogExceptions;
import com.pos.catalog.repository.ProductBarcodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class ProductBarcodeSync {

    private final ProductBarcodeRepository productBarcodeRepository;

    public void replaceExtras(Product product, List<String> additionalBarcodes, String primaryBarcode) {
        product.getExtraBarcodes().clear();
        if (additionalBarcodes == null || additionalBarcodes.isEmpty()) {
            return;
        }
        Set<String> unique = new LinkedHashSet<>();
        for (String raw : additionalBarcodes) {
            if (!StringUtils.hasText(raw)) {
                continue;
            }
            String code = raw.trim();
            if (primaryBarcode != null && primaryBarcode.equals(code)) {
                continue;
            }
            if (!unique.add(code)) {
                continue;
            }
            if (productBarcodeRepository.existsByBarcode(code)) {
                throw CatalogExceptions.conflict("Штрихкод уже используется: " + code);
            }
            product.getExtraBarcodes().add(ProductBarcode.builder()
                .product(product)
                .barcode(code)
                .build());
        }
    }

    public List<String> normalize(List<String> barcodes) {
        if (barcodes == null || barcodes.isEmpty()) {
            return List.of();
        }
        List<String> out = new ArrayList<>();
        for (String raw : barcodes) {
            if (StringUtils.hasText(raw)) {
                out.add(raw.trim());
            }
        }
        return out;
    }
}
