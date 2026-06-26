package com.pos.reporting.service;

import com.pos.reporting.dto.PageResponse;
import com.pos.reporting.dto.stock.pos.PosDeadStockRow;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.domain.Pageable;

public interface DeadStockReportService {

    PageResponse<PosDeadStockRow> deadStock(
        LocalDate asOfDate,
        int daysNoSale,
        Integer categoryId,
        String search,
        Pageable pageable
    );

    List<PosDeadStockRow> listAll(
        LocalDate asOfDate,
        int daysNoSale,
        Integer categoryId,
        String search
    );
}
