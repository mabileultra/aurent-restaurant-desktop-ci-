package com.pos.reporting.service;

import com.pos.reporting.dto.PageResponse;
import com.pos.reporting.dto.stock.pos.PosStockMovementRow;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.domain.Pageable;

public interface StockMovementReportService {

    PageResponse<PosStockMovementRow> movements(
        LocalDate from,
        LocalDate to,
        String movementType,
        Integer storeId,
        String search,
        Pageable pageable
    );

    List<PosStockMovementRow> listAll(
        LocalDate from,
        LocalDate to,
        String movementType,
        Integer storeId,
        String search
    );
}
