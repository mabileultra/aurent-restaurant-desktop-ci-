package com.pos.catalog.service.support;

import com.pos.catalog.dto.product.CatalogServiceBackfillResult;
import com.pos.catalog.entity.Product;
import com.pos.catalog.repository.ProductRepository;
import com.pos.catalog.service.product.support.ProductCatalogLoader;
import com.pos.client.catalog.CatalogProductUpsertMapper;
import com.pos.client.catalog.CatalogProductUpsertRequest;
import com.pos.client.catalog.CatalogServiceClient;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * One transactional page of product → catalog-service upsert (avoids self-invocation LAZY bugs).
 */
@Component
@RequiredArgsConstructor
public class CatalogServiceBackfillPageWorker {

    private final ProductRepository productRepository;
    private final ProductCatalogLoader productCatalogLoader;
    private final CatalogProductUpsertMapper upsertMapper;
    private final CatalogServiceClient catalogServiceClient;

    @Transactional(readOnly = true)
    public CatalogServiceBackfillResult backfillPage(Integer companyId, int page, int size) {
        int safeSize = Math.min(Math.max(size, 1), 200);
        int safePage = Math.max(page, 0);
        Page<Product> products = productRepository.findForReportingSnapshot(
            companyId,
            PageRequest.of(safePage, safeSize)
        );
        int succeeded = 0;
        int failed = 0;
        int skipped = 0;
        for (Product product : products.getContent()) {
            productCatalogLoader.initCollections(product);
            if (product.getCompany() != null) {
                product.getCompany().getId();
            }
            if (product.getBusinessType() != null) {
                product.getBusinessType().getCode();
            }
            CatalogProductUpsertRequest payload = upsertMapper.toUpsert(product);
            if (payload == null) {
                skipped++;
                continue;
            }
            LogUtil.info(
                CatalogServiceBackfillPageWorker.class,
                "catalog backfill upsert localId={} sku={}",
                payload.id(),
                payload.sku()
            );
            if (catalogServiceClient.tryUpsertProduct(payload)) {
                succeeded++;
            } else {
                failed++;
            }
        }
        LogUtil.info(
            CatalogServiceBackfillPageWorker.class,
            "catalog backfill page={} processed={} ok={} fail={} skip={}",
            safePage,
            products.getNumberOfElements(),
            succeeded,
            failed,
            skipped
        );
        return new CatalogServiceBackfillResult(
            safePage,
            safeSize,
            products.getNumberOfElements(),
            succeeded,
            failed,
            skipped,
            products.getTotalElements(),
            products.getTotalPages(),
            true
        );
    }
}
