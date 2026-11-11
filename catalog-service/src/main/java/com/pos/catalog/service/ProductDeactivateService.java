package com.pos.catalog.service;

import com.pos.catalog.entity.Product;
import com.pos.catalog.event.CatalogOutboxWriter;
import com.pos.catalog.repository.ProductRepository;
import com.pos.catalog.service.support.InactiveBarcodeReleaser;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductDeactivateService {

    private final ProductRepository productRepository;
    private final InactiveBarcodeReleaser barcodeReleaser;
    private final CatalogOutboxWriter outboxWriter;

    @Transactional
    public void deactivate(UUID id) {
        productRepository.findById(id).ifPresent(product -> {
            boolean wasActive = product.isActive();
            boolean heldCodes = holdsScanCodes(product);
            if (wasActive) {
                product.setActive(false);
            }
            barcodeReleaser.release(product);
            productRepository.save(product);
            if (wasActive || heldCodes) {
                outboxWriter.enqueueProductSnapshot(product);
                LogUtil.info(
                    ProductDeactivateService.class,
                    "catalog-service product deactivate id={} companyId={} wasActive={}",
                    product.getId(),
                    product.getCompanyId(),
                    wasActive
                );
            }
        });
    }

    private static boolean holdsScanCodes(Product product) {
        return StringUtils.hasText(product.getBarcode())
            || StringUtils.hasText(product.getPlu())
            || (product.getExtraBarcodes() != null && !product.getExtraBarcodes().isEmpty());
    }
}
