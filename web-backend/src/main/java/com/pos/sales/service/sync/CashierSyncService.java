package com.pos.sales.service.sync;

import com.pos.sales.dto.sync.CashierSyncBootstrapResponse;
import com.pos.sales.dto.sync.OfflineSalesBatchRequest;
import com.pos.sales.dto.sync.OfflineSalesBatchResponse;

import java.util.UUID;

public interface CashierSyncService {

    CashierSyncBootstrapResponse bootstrap(Integer storeId, UUID cashierId);

    OfflineSalesBatchResponse syncSalesBatch(OfflineSalesBatchRequest request, UUID cashierId);
}
