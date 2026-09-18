package com.pos.pharmacy.marks.service.impl;

import com.pos.pharmacy.marks.dto.StockMarkCheckResponse;
import com.pos.pharmacy.marks.dto.StockMarkRegisterRequest;
import com.pos.pharmacy.marks.dto.StockMarkRegisterResponse;
import com.pos.pharmacy.marks.entity.StockMark;
import com.pos.pharmacy.marks.service.PharmacyStockMarkService;
import com.pos.pharmacy.marks.service.StockMarkQueryService;
import com.pos.pharmacy.marks.service.StockMarkRegisterService;
import com.pos.pharmacy.marks.service.StockMarkReturnService;
import com.pos.pharmacy.marks.service.StockMarkWithdrawStateService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PharmacyStockMarkServiceImpl implements PharmacyStockMarkService {

    private final StockMarkQueryService queryService;
    private final StockMarkRegisterService registerService;
    private final StockMarkWithdrawStateService withdrawStateService;
    private final StockMarkReturnService returnService;

    @Override
    public StockMarkCheckResponse findInStock(Integer storeId, String code) {
        return queryService.findInStock(storeId, code);
    }

    @Override
    public StockMarkRegisterResponse registerInStock(StockMarkRegisterRequest request) {
        return registerService.registerInStock(request);
    }

    @Override
    public int markPendingWithdraw(Integer storeId, UUID saleId, Collection<String> markCodes) {
        return withdrawStateService.markPendingWithdraw(storeId, saleId, markCodes);
    }

    @Override
    public int confirmSold(Integer companyId, Integer storeId, Collection<String> markCodes, String aslStatus) {
        return withdrawStateService.confirmSold(companyId, storeId, markCodes, aslStatus);
    }

    @Override
    public void recordWithdrawAttempt(Integer companyId, Integer storeId, Collection<String> markCodes, String error) {
        withdrawStateService.recordWithdrawAttempt(companyId, storeId, markCodes, error);
    }

    @Override
    public List<StockMark> findPendingWithdrawBatch(int limit) {
        return queryService.findPendingWithdrawBatch(limit);
    }

    @Override
    public int restoreOnReturn(Integer storeId, UUID saleId, Collection<String> markCodes) {
        return returnService.restoreOnReturn(storeId, saleId, markCodes);
    }
}
