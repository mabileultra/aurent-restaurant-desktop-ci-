package com.pos.ai.client.reporting;

import com.pos.ai.dto.report.sales.ProductSalesRowResponse;
import com.pos.ai.dto.report.stock.DeadStockRowResponse;
import com.pos.ai.dto.report.stock.LowStockRowResponse;
import com.pos.ai.dto.report.stock.StockCatalogStatsResponse;
import com.pos.ai.dto.report.stock.StockInventoryRowResponse;
import com.pos.ai.dto.report.stock.StockTurnoverRowResponse;
import com.pos.ai.dto.shared.PageResponse;

import java.time.LocalDate;

public interface ReportingStockReportClient {

    StockCatalogStatsResponse catalogStats();

    PageResponse<LowStockRowResponse> lowStock(int page, int size);

    PageResponse<StockInventoryRowResponse> inventories(
        LocalDate from,
        LocalDate to,
        Integer storeId,
        int page,
        int size
    );

    PageResponse<StockTurnoverRowResponse> turnover(
        LocalDate from,
        LocalDate to,
        Integer categoryId,
        String search,
        int page,
        int size
    );

    PageResponse<ProductSalesRowResponse> productSales(
        LocalDate from,
        LocalDate to,
        Integer storeId,
        Integer categoryId,
        String search,
        int page,
        int size
    );

    PageResponse<DeadStockRowResponse> deadStock(
        LocalDate asOfDate,
        int daysNoSale,
        Integer categoryId,
        String search,
        int page,
        int size
    );
}
