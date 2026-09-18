package com.pos.pharmacy.marks.service;

import com.pos.pharmacy.marks.dto.StockMarkCheckResponse;
import com.pos.pharmacy.marks.entity.StockMark;

import java.util.List;

public interface StockMarkQueryService {

    StockMarkCheckResponse findInStock(Integer storeId, String code);

    List<StockMark> findPendingWithdrawBatch(int limit);
}
