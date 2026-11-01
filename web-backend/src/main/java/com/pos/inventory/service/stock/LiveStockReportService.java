package com.pos.inventory.service.stock;

import com.pos.dto.report.stock.LowStockRowResponse;
import com.pos.dto.report.stock.StockBalanceRowResponse;
import com.pos.dto.shared.PageResponse;
import org.springframework.data.domain.Pageable;

public interface LiveStockReportService {

    PageResponse<StockBalanceRowResponse> balances(
        Integer storeId,
        Integer categoryId,
        String search,
        boolean onlyWithStock,
        Pageable pageable
    );

    PageResponse<LowStockRowResponse> lowStock(Pageable pageable);
}
