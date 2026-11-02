package com.pos.catalog.service.support;

import com.pos.catalog.entity.Product;
import com.pos.catalog.entity.ProductBarcode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class ProductBarcodeSync {

    private final ProductBarcodeUniqueness barcodeUniqueness;

    public void replaceExtras(Product product, List<String> additionalBarcodes, String primaryBarcode) {
        product.getExtraBarcodes().clear();
        if (additionalBarcodes == null || additionalBarcodes.isEmpty()) {
            return;
        }
        Integer companyId = product.getCompanyId();
        UUID productId = product.getId();
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
            barcodeUniqueness.assertAvailable(companyId, code, productId);
            product.getExtraBarcodes().add(ProductBarcode.builder()
                .companyId(companyId)
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
