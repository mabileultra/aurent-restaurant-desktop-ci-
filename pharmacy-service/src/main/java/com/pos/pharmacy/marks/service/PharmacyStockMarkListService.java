package com.pos.pharmacy.marks.service;

import com.pos.pharmacy.common.PageResponse;
import com.pos.pharmacy.marks.dto.StockMarkListItemResponse;
import com.pos.pharmacy.marks.entity.StockMarkStatus;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.UUID;

public interface PharmacyStockMarkListService {

    PageResponse<StockMarkListItemResponse> list(
        Integer storeId,
        StockMarkStatus status,
        UUID shiftId,
        Instant soldFrom,
        Instant soldTo,
        String search,
        boolean problemsOnly,
        Pageable pageable
    );
}
