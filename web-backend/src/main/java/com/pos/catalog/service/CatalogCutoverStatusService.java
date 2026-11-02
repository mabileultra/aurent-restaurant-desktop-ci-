package com.pos.catalog.service;

import com.pos.catalog.dto.product.CatalogCutoverStatusResponse;

public interface CatalogCutoverStatusService {

    CatalogCutoverStatusResponse status(Integer companyId);
}
