package com.pos.sales.service.salesledger;

import com.pos.cache.salesledger.SalesLedgerSnapshot;

public interface SalesLedgerCacheLoader {

    SalesLedgerSnapshot loadSnapshot();
}
