package com.pos.catalog.service.impl;

import com.pos.catalog.dto.product.CatalogServiceBackfillResult;
import com.pos.catalog.service.CatalogServiceBackfillService;
import com.pos.catalog.service.support.CatalogServiceBackfillPageWorker;
import com.pos.config.catalog.CatalogServiceProperties;
import com.pos.exception.PosExceptions;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CatalogServiceBackfillServiceImpl implements CatalogServiceBackfillService {

    private final CatalogServiceBackfillPageWorker pageWorker;
    private final CatalogServiceProperties catalogProperties;

    @Override
    public CatalogServiceBackfillResult backfillPage(Integer companyId, int page, int size) {
        requireEnabled();
        return pageWorker.backfillPage(companyId, page, size);
    }

    @Override
    public CatalogServiceBackfillResult backfillAll(Integer companyId, int size, int maxPages) {
        requireEnabled();
        int safeMax = Math.min(Math.max(maxPages, 1), 500);
        int totalProcessed = 0;
        int totalOk = 0;
        int totalFail = 0;
        int totalSkip = 0;
        long totalElements = 0;
        int totalPages = 0;
        int lastPage = 0;
        int safeSize = Math.min(Math.max(size, 1), 200);
        for (int page = 0; page < safeMax; page++) {
            CatalogServiceBackfillResult chunk = pageWorker.backfillPage(companyId, page, safeSize);
            lastPage = page;
            totalElements = chunk.totalElements();
            totalPages = chunk.totalPages();
            totalProcessed += chunk.processed();
            totalOk += chunk.succeeded();
            totalFail += chunk.failed();
            totalSkip += chunk.skipped();
            if (chunk.processed() == 0 || page + 1 >= chunk.totalPages()) {
                break;
            }
        }
        return new CatalogServiceBackfillResult(
            lastPage,
            safeSize,
            totalProcessed,
            totalOk,
            totalFail,
            totalSkip,
            totalElements,
            totalPages,
            true
        );
    }

    private void requireEnabled() {
        if (!catalogProperties.isEnabled()) {
            throw PosExceptions.badRequest(
                "catalog-service dual-write disabled (app.catalog.enabled=false)",
                "catalog.enabled",
                "false"
            );
        }
    }
}
