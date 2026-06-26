package com.pos.reporting.service;

import com.pos.reporting.dto.PageResponse;
import com.pos.reporting.dto.stock.pos.PosLowStockRow;

import org.springframework.data.domain.Pageable;

public interface LowStockReportService {

    PageResponse<PosLowStockRow> lowStock(Pageable pageable);
}
