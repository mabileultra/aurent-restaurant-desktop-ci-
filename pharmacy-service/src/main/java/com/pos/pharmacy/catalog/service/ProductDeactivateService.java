package com.pos.pharmacy.catalog.service;

import com.pos.pharmacy.cache.PharmacyCatalogCacheEvictor;
import com.pos.pharmacy.catalog.dto.BulkProductIdsRequest;
import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.catalog.repository.ProductRepository;
import com.pos.pharmacy.catalog.support.PharmacyBarcodeClaim;
import com.pos.pharmacy.common.TenantSupport;
import com.pos.pharmacy.exception.PharmacyErrors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/** Мягкое удаление аптечного товара: скрыть с кассы и освободить штрихкод. */
@Service
@RequiredArgsConstructor
public class ProductDeactivateService {

    private final ProductRepository productRepository;
    private final PharmacyBarcodeClaim barcodeClaim;
    private final TenantSupport tenant;
    private final PharmacyCatalogCacheEvictor catalogCacheEvictor;

    @Transactional
    public void deactivate(UUID id) {
        Product product = requireOwned(id);
        deactivate(product);
    }

    @Transactional
    public void deactivate(Product product) {
        if (product == null || !product.isActive()) {
            return;
        }
        barcodeClaim.release(product);
        productRepository.save(product);
        catalogCacheEvictor.onProductChanged(product.getCompanyId());
    }

    @Transactional
    public int bulkDeactivate(BulkProductIdsRequest req) {
        Integer companyId = tenant.requireCompanyId();
        List<Product> products = productRepository.findAllById(req.productIds()).stream()
            .filter(p -> companyId.equals(p.getCompanyId()))
            .toList();
        if (products.isEmpty()) {
            throw PharmacyErrors.badRequest("No products found for provided ids");
        }
        int updated = 0;
        for (Product product : products) {
            if (!product.isActive()) {
                continue;
            }
            barcodeClaim.release(product);
            updated++;
        }
        productRepository.saveAll(products);
        if (updated > 0) {
            catalogCacheEvictor.onProductChanged(companyId);
        }
        return updated;
    }

    private Product requireOwned(UUID id) {
        Integer companyId = tenant.requireCompanyId();
        return productRepository.findById(id)
            .filter(p -> p.getCompanyId().equals(companyId))
            .orElseThrow(() -> PharmacyErrors.notFound("Product", id));
    }
}
