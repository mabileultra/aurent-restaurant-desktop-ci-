package com.pos.pharmacy.marks.service;

import java.util.Collection;
import java.util.UUID;

public interface PharmacyMarkWithdrawService {

    /** Не блокирует checkout: подтверждение ASL/ОФД в фоне. */
    void enqueueAfterSale(Integer companyId, Integer storeId, UUID saleId, Collection<String> markCodes);

    /** Дожим PENDING_WITHDRAW (scheduler). */
    int processPendingBatch();
}
