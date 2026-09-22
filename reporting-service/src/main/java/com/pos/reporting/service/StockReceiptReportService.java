package com.pos.reporting.service;

import com.pos.reporting.dto.PageResponse;
import com.pos.reporting.dto.StockReceiptRowResponse;
import java.time.LocalDate;
import java.util.List;

import org.springframework.data.domain.Pageable;

public interface StockReceiptReportService {

    PageResponse<StockReceiptRowResponse> receipts( LocalDate from, LocalDate to, Integer storeId, Pageable pageable );

    List<StockReceiptRowResponse> listAll(LocalDate from, LocalDate to, Integer storeId);
}

