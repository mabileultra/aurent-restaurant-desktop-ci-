package com.pos.catalog.service;

import com.pos.catalog.event.CatalogOutboxWriter;
import com.pos.catalog.repository.ProductRepository;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductDeactivateService {

    private final ProductRepository productRepository;
    private final CatalogOutboxWriter outboxWriter;

    @Transactional
    public void deactivate(UUID id) {
        productRepository.findById(id).ifPresent(product -> {
            if (!product.isActive()) {
                return;
            }
            product.setActive(false);
            productRepository.save(product);
            outboxWriter.enqueueProductSnapshot(product);
            LogUtil.info(
                ProductDeactivateService.class,
                "catalog-service product deactivate id={} companyId={}",
                product.getId(),
                product.getCompanyId()
            );
        });
    }
}
