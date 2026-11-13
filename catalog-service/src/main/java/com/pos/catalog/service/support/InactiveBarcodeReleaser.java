package com.pos.catalog.service.support;

import com.pos.catalog.entity.Product;
import com.pos.catalog.repository.ProductBarcodeRepository;
import com.pos.catalog.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.List;

/**
 * Soft-deactivate frees barcodes/PLU so a new card can reuse them (same as grocery web-backend).
 */
@Component
@RequiredArgsConstructor
public class InactiveBarcodeReleaser {

    private final ProductRepository productRepository;
    private final ProductBarcodeRepository productBarcodeRepository;

    public void release(Product product) {
        if (product == null) {
            return;
        }
        product.setBarcode(null);
        product.setPlu(null);
        if (product.getExtraBarcodes() != null) {
            product.getExtraBarcodes().clear();
        }
        if (product.getId() != null) {
            productBarcodeRepository.deleteByProduct_Id(product.getId());
            productBarcodeRepository.flush();
        }
    }

    public void releaseHeldByInactive(Integer companyId, String barcode) {
        if (!StringUtils.hasText(barcode) || companyId == null) {
            return;
        }
        String code = barcode.trim();
        productRepository.findByCompanyIdAndBarcode(companyId, code)
            .filter(product -> !product.isActive())
            .ifPresent(product -> {
                release(product);
                productRepository.save(product);
            });
        productBarcodeRepository.findByCompanyIdAndBarcode(companyId, code)
            .filter(line -> line.getProduct() != null && !line.getProduct().isActive())
            .ifPresent(line -> {
                productBarcodeRepository.delete(line);
                productBarcodeRepository.flush();
            });
    }

    public void releaseHeldPlu(Integer companyId, String plu) {
        if (!StringUtils.hasText(plu) || companyId == null) {
            return;
        }
        productRepository.findByCompanyIdAndPlu(companyId, plu.trim())
            .filter(product -> !product.isActive())
            .ifPresent(product -> {
                release(product);
                productRepository.save(product);
            });
    }

    public void releaseAll(List<String> barcodes, Integer companyId, String primary) {
        releaseHeldByInactive(companyId, primary);
        if (barcodes == null) {
            return;
        }
        for (String barcode : barcodes) {
            releaseHeldByInactive(companyId, barcode);
        }
    }
}
