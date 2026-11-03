package com.pos.sales.service.sync.support;

import com.pos.catalog.dto.product.ProductResponse;
import com.pos.catalog.service.product.support.CatalogCashierDeltaSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Sales-facing wrapper: catalog delta loading lives in {@link CatalogCashierDeltaSupport}.
 */
@Component
@RequiredArgsConstructor
public class CashierCatalogDeltaProductSupport {

    private final CatalogCashierDeltaSupport catalogCashierDeltaSupport;

    public List<ProductResponse> loadActiveUpserts(Integer companyId, Integer storeId, Instant since) {
        return catalogCashierDeltaSupport.loadActiveUpserts(companyId, storeId, since);
    }

    public List<UUID> loadRemovedIds(Integer companyId, Instant since) {
        return catalogCashierDeltaSupport.loadRemovedIds(companyId, since);
    }
}
