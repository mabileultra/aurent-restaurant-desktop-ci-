package com.pos.catalog.service.product.support;

import com.pos.catalog.entity.Product;
import com.pos.catalog.repository.ProductBarcodeRepository;
import com.pos.catalog.repository.ProductRepository;
import com.pos.catalog.repository.spec.ProductSpecifications;
import com.pos.service.support.ProductLookupSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.List;

@Component
@RequiredArgsConstructor
public class InactiveBarcodeReleaser {

    private final ProductLookupSupport productLookup;
    private final ProductRepository productRepository;
    private final ProductBarcodeRepository productBarcodeRepository;

    public void releaseHeldByInactive(Integer companyId, String barcode) {
        if (!StringUtils.hasText(barcode) || companyId == null) {
            return;
        }
        String normalized = barcode.trim();
        productLookup.findOne(ProductSpecifications.lookup(companyId).barcode(normalized).anyActiveState())
            .filter(product -> !product.isActive())
            .ifPresent(this::release);
        productBarcodeRepository.findByBarcodeAndProductCompanyId(normalized, companyId)
            .filter(line -> line.getProduct() != null && !line.getProduct().isActive())
            .ifPresent(line -> {
                productBarcodeRepository.delete(line);
                productBarcodeRepository.flush();
            });
    }

    public void release(Product product) {
        if (product == null) {
            return;
        }
        product.setBarcode(null);
        product.setPlu(null);
        if (product.getId() != null) {
            productBarcodeRepository.deleteByProduct_Id(product.getId());
        }
        productRepository.saveAndFlush(product);
    }

    public void releaseHeldPlu(Integer companyId, String plu) {
        if (!StringUtils.hasText(plu) || companyId == null) {
            return;
        }
        productRepository.findByCompany_IdAndPlu(companyId, plu.trim())
            .filter(product -> !product.isActive())
            .ifPresent(this::release);
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
