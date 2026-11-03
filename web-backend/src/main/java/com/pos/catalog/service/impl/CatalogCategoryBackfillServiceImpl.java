package com.pos.catalog.service.impl;

import com.pos.catalog.dto.product.CatalogCategoryBackfillResult;
import com.pos.catalog.entity.Category;
import com.pos.catalog.repository.CategoryRepository;
import com.pos.catalog.service.CatalogCategoryBackfillService;
import com.pos.client.catalog.CatalogCategoryUpsertMapper;
import com.pos.client.catalog.CatalogCategoryUpsertRequest;
import com.pos.client.catalog.CatalogServiceClient;
import com.pos.config.catalog.CatalogServiceProperties;
import com.pos.exception.PosExceptions;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CatalogCategoryBackfillServiceImpl implements CatalogCategoryBackfillService {

    private final CategoryRepository categoryRepository;
    private final CatalogCategoryUpsertMapper upsertMapper;
    private final CatalogServiceClient catalogServiceClient;
    private final CatalogServiceProperties catalogProperties;

    @Override
    @Transactional(readOnly = true)
    public CatalogCategoryBackfillResult backfill(Integer companyId) {
        if (!catalogProperties.isEnabled()) {
            throw PosExceptions.badRequest(
                "catalog-service dual-write disabled (app.catalog.enabled=false)",
                "catalog.enabled",
                "false"
            );
        }
        List<Category> categories = companyId != null
            ? categoryRepository.findByCompanyIdOrderByNameAsc(companyId)
            : categoryRepository.findAll();
        int ok = 0;
        int fail = 0;
        int skip = 0;
        for (Category category : categories) {
            if (category.getCompany() != null) {
                category.getCompany().getId();
            }
            CatalogCategoryUpsertRequest payload = upsertMapper.toUpsert(category);
            if (payload == null) {
                skip++;
                continue;
            }
            if (catalogServiceClient.tryUpsertCategory(payload)) {
                ok++;
            } else {
                fail++;
            }
        }
        LogUtil.info(
            CatalogCategoryBackfillServiceImpl.class,
            "catalog category backfill companyId={} processed={} ok={} fail={} skip={}",
            companyId,
            categories.size(),
            ok,
            fail,
            skip
        );
        return new CatalogCategoryBackfillResult(companyId, categories.size(), ok, fail, skip);
    }
}
