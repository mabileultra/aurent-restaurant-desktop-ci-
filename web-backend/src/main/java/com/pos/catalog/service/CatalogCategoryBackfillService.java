package com.pos.catalog.service;

import com.pos.catalog.dto.product.CatalogCategoryBackfillResult;

public interface CatalogCategoryBackfillService {

    CatalogCategoryBackfillResult backfill(Integer companyId);
}
