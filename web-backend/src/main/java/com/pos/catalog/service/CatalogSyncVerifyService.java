package com.pos.catalog.service;

import com.pos.catalog.dto.product.CatalogSyncVerifyResult;

public interface CatalogSyncVerifyService {

    CatalogSyncVerifyResult verify(Integer companyId, int sampleSize);
}
