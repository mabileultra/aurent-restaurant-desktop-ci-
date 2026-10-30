package com.pos.sales.service.sync;

import com.pos.sales.dto.sync.CashierSyncCatalogDeltaResponse;

import java.time.Instant;
import java.util.UUID;

public interface CashierCatalogDeltaService {

    CashierSyncCatalogDeltaResponse delta(Integer storeId, UUID cashierId, Instant since);
}
