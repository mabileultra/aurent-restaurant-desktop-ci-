package com.pos.reporting.service;

import com.pos.reporting.dto.PageResponse;
import com.pos.reporting.dto.stock.pos.PosStockTurnoverRow;

import java.time.LocalDate;

import org.springframework.data.domain.Pageable;

public interface StockTurnoverReportService {

    PageResponse<PosStockTurnoverRow> turnover(
        LocalDate from,
        LocalDate to,
        Integer categoryId,
        String search,
        Pageable pageable
    );
}
