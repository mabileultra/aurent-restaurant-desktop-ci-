package com.pos.restaurant.report.service;

import com.pos.restaurant.report.dto.DishSalesReportResponse;
import com.pos.restaurant.report.dto.ReceiptExportRequest;
import com.pos.restaurant.report.dto.ReceiptJournalFilter;
import com.pos.restaurant.report.dto.ReceiptJournalResponse;
import com.pos.restaurant.report.dto.SalesSummaryResponse;

public interface RestaurantReportService {

    ReceiptJournalResponse receipts(Integer storeId, ReceiptJournalFilter filter, int page, int size);

    byte[] exportReceipts(Integer storeId, ReceiptExportRequest request);

    SalesSummaryResponse salesSummary(Integer storeId, ReceiptJournalFilter filter, String timeZone);

    DishSalesReportResponse dishSales(Integer storeId, ReceiptJournalFilter filter);

    byte[] exportDishSales(Integer storeId, ReceiptExportRequest request);
}
