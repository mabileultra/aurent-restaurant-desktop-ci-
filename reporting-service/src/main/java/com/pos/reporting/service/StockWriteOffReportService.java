package com.pos.reporting.service;

import com.pos.reporting.dto.PageResponse;
import com.pos.reporting.dto.stock.pos.PosWriteOffRow;

import java.time.LocalDate;

import org.springframework.data.domain.Pageable;

public interface StockWriteOffReportService {

    PageResponse<PosWriteOffRow> writeOffs(
        LocalDate from,
        LocalDate to,
        Integer storeId,
        Pageable pageable
    );
}
