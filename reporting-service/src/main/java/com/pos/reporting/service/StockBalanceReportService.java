package com.pos.reporting.service;

import com.pos.reporting.dto.PageResponse;
import com.pos.reporting.dto.stock.pos.PosStockBalanceRow;

import java.util.List;

import org.springframework.data.domain.Pageable;

public interface StockBalanceReportService {

    PageResponse<PosStockBalanceRow> balances(
        Integer categoryId,
        String search,
        boolean onlyWithStock,
        Pageable pageable
    );

    List<PosStockBalanceRow> listAll(Integer categoryId, String search, boolean onlyWithStock);
}
