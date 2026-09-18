package com.pos.pharmacy.catalog.support;

import com.pos.pharmacy.catalog.entity.ProductBarcode;
import com.pos.pharmacy.catalog.repository.ProductBarcodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.UUID;

/** Перезаписывает дополнительные штрихкоды карточки. */
@Component
@RequiredArgsConstructor
public class ProductExtraBarcodeWriter {

    private final ProductBarcodeRepository productBarcodeRepository;
    private final PharmacyBarcodeClaim barcodeClaim;

    public void replace(UUID productId, Integer companyId, String primaryBarcode, List<String> barcodes) {
        if (productId == null || barcodes == null) {
            return;
        }
        productBarcodeRepository.deleteByProductId(productId);
        productBarcodeRepository.flush();
        String primary = StringUtils.hasText(primaryBarcode) ? primaryBarcode.trim() : null;
        for (String raw : barcodes) {
            if (!StringUtils.hasText(raw)) {
                continue;
            }
            String barcode = raw.trim();
            if (barcode.equals(primary)) {
                continue;
            }
            barcodeClaim.claim(companyId, barcode, productId);
            productBarcodeRepository.save(ProductBarcode.builder()
                .productId(productId)
                .barcode(barcode)
                .build());
        }
    }
}
