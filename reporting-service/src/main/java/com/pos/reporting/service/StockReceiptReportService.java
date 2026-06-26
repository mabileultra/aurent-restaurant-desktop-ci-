package com.pos.reporting.service;

import com.pos.reporting.dto.PageResponse;
import com.pos.reporting.dto.StockReceiptRowResponse;
import java.time.LocalDate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface StockReceiptReportService {

    PageResponse<StockReceiptRowResponse> receipts( LocalDate from, LocalDate to, Integer storeId, Pageable pageable );
}

