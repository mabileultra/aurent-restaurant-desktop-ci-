package com.pos.reporting.service;

import com.pos.reporting.dto.PageResponse;
import com.pos.reporting.dto.stock.pos.PosStockMovementRow;

import java.time.LocalDate;

import org.springframework.data.domain.Pageable;

public interface StockAdjustmentReportService {

    PageResponse<PosStockMovementRow> adjustments(
        LocalDate from,
        LocalDate to,
        Integer storeId,
        String search,
        Pageable pageable
    );
}
