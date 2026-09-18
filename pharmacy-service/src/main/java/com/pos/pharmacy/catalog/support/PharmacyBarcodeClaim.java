package com.pos.pharmacy.catalog.support;

import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.catalog.repository.ProductBarcodeRepository;
import com.pos.pharmacy.catalog.repository.ProductRepository;
import com.pos.pharmacy.exception.PharmacyErrors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class PharmacyBarcodeClaim {

    private final ProductRepository productRepository;
    private final ProductBarcodeRepository productBarcodeRepository;

    public void claim(Integer companyId, String barcode) {
        claim(companyId, barcode, null);
    }

    public void claim(Integer companyId, String barcode, UUID ignoreProductId) {
        if (!StringUtils.hasText(barcode) || companyId == null) {
            return;
        }
        String normalized = barcode.trim();
        productRepository.findFirstByCompanyIdAndBarcode(companyId, normalized).ifPresent(existing -> {
            if (ignoreProductId != null && ignoreProductId.equals(existing.getId())) {
                return;
            }
            if (existing.isActive()) {
                throw PharmacyErrors.conflict("Штрихкод уже используется: " + normalized, "barcode", normalized);
            }
            release(existing);
            productRepository.saveAndFlush(existing);
        });
        productBarcodeRepository.findByBarcode(normalized).ifPresent(line -> {
            if (ignoreProductId != null && ignoreProductId.equals(line.getProductId())) {
                return;
            }
            productRepository.findById(line.getProductId())
                .filter(owner -> companyId.equals(owner.getCompanyId()))
                .ifPresent(owner -> {
                    if (owner.isActive()) {
                        throw PharmacyErrors.conflict(
                            "Штрихкод уже используется: " + normalized, "barcode", normalized
                        );
                    }
                    productBarcodeRepository.delete(line);
                    productBarcodeRepository.flush();
                });
        });
    }

    public void release(Product product) {
        if (product == null) {
            return;
        }
        product.setBarcode(null);
        if (product.getId() != null) {
            productBarcodeRepository.deleteByProductId(product.getId());
        }
        product.setSku(ReleasedCatalogIdentity.sku(product.getSku(), product.getId()));
        product.setActive(false);
    }
}
