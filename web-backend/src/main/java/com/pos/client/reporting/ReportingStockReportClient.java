package com.pos.client.reporting;

import com.pos.dto.report.sales.ProductSalesRowResponse;
import com.pos.dto.report.stock.DeadStockRowResponse;
import com.pos.dto.report.stock.LowStockRowResponse;
import com.pos.dto.report.stock.StockCatalogStatsResponse;
import com.pos.dto.report.stock.StockInventoryRowResponse;
import com.pos.dto.report.stock.StockTurnoverRowResponse;
import com.pos.dto.shared.PageResponse;

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
