package com.pos.pharmacy.marks.service;

import java.util.Collection;
import java.util.UUID;

public interface StockMarkWithdrawStateService {

    int markPendingWithdraw(Integer storeId, UUID saleId, Collection<String> markCodes);

    int confirmSold(Integer companyId, Integer storeId, Collection<String> markCodes, String aslStatus);

    void recordWithdrawAttempt(Integer companyId, Integer storeId, Collection<String> markCodes, String error);
}
