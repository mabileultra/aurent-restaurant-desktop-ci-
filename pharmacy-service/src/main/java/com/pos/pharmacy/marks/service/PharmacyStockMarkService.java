package com.pos.pharmacy.marks.service;

import com.pos.pharmacy.marks.dto.StockMarkCheckResponse;
import com.pos.pharmacy.marks.dto.StockMarkRegisterRequest;
import com.pos.pharmacy.marks.dto.StockMarkRegisterResponse;
import com.pos.pharmacy.marks.entity.StockMark;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface PharmacyStockMarkService {

    StockMarkCheckResponse findInStock(Integer storeId, String code);

    StockMarkRegisterResponse registerInStock(StockMarkRegisterRequest request);

    /** IN_STOCK → PENDING_WITHDRAW после локального checkout (ASL confirm — async). */
    int markPendingWithdraw(Integer storeId, UUID saleId, Collection<String> markCodes);

    /** PENDING_WITHDRAW → SOLD после подтверждения ASL / фискала. */
    int confirmSold(Integer companyId, Integer storeId, Collection<String> markCodes, String aslStatus);

    void recordWithdrawAttempt(Integer companyId, Integer storeId, Collection<String> markCodes, String error);

    List<StockMark> findPendingWithdrawBatch(int limit);

    /** SOLD / PENDING_WITHDRAW → IN_STOCK после возврата продажи. */
    int restoreOnReturn(Integer storeId, UUID saleId, Collection<String> markCodes);
}
