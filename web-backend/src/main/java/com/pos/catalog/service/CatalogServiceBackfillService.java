package com.pos.catalog.service;

import com.pos.catalog.dto.product.CatalogServiceBackfillResult;

public interface CatalogServiceBackfillService {

    CatalogServiceBackfillResult backfillPage(Integer companyId, int page, int size);

    /** Pages until empty or {@code maxPages} reached. */
    CatalogServiceBackfillResult backfillAll(Integer companyId, int size, int maxPages);
}
