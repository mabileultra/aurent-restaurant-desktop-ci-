package com.pos.reporting.service.impl;

import com.pos.reporting.dto.PageResponse;
import com.pos.reporting.dto.stock.pos.PosStockMovementRow;
import com.pos.reporting.service.StockAdjustmentReportService;
import com.pos.reporting.service.StockMovementReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StockAdjustmentReportServiceImpl implements StockAdjustmentReportService {

    private final StockMovementReportService stockMovementReportService;

    @Override
    public PageResponse<PosStockMovementRow> adjustments(
        LocalDate from,
        LocalDate to,
        Integer storeId,
        String search,
        Pageable pageable
    ) {
        return stockMovementReportService.movements(from, to, "ADJUSTMENT", storeId, search, pageable);
    }
}
